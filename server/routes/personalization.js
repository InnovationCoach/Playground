import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { requireClaims } from '../middleware/auth.js';
import { sendError } from '../lib/errors.js';
import { schoolCaller, requireId, fail, intersection, staff } from '../lib/schoolScope.js';
import { defaults, normalizeSettings, normalizeItem, asset, IMAGE_TYPES, MEDIA_TYPES, MAX_MEDIA_SIZE } from '../../src/features/personalization/personalizationModel.js';
const router = Router();
const wrap = fn => async (req,res,next) => {try {await fn(req,res);} catch(e) {if(e.status) return sendError(res,e.status,e.code,e.message); next(e);}};
const privateRef = uid => getFirestore().collection('learnerSpaces').doc(uid);
const portfolioRef = uid => getFirestore().collection('learnerPortfolios').doc(uid);
const grantsRef = uid => getFirestore().collection('portfolioAudienceGrants').doc(uid);
const bucket = () => getStorage().bucket(process.env.FIREBASE_STORAGE_BUCKET || 'dnd-master-73449.firebasestorage.app');
router.use((req,res,next) => /^\/(learner-space|learner-portfolios)(\/|$)/.test(req.path) ? next() : next('router'));
router.use(requireClaims);
router.use(async (req,res,next) => {
  try {req.spaceCaller = await schoolCaller(req); next();}
  catch(e) {if(e.status) return sendError(res,e.status,e.code,e.message); next(e);}
});
router.use((req,res,next)=>{
  if(!['GET','HEAD'].includes(req.method) && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) return sendError(res,400,'VALIDATION','A JSON object is required.');
  next();
});
function learner(req) {
  if (req.spaceCaller.role !== 'student') fail(403,'FORBIDDEN','Sign in as a learner to customize your space.');
  return req.spaceCaller.uid;
}
async function fetchMediaMetadata(path) {
  const bucketsToTry = [];
  const primaryBucketName = process.env.FIREBASE_STORAGE_BUCKET || 'dnd-master-73449.firebasestorage.app';
  bucketsToTry.push(getStorage().bucket(primaryBucketName));
  // If the primary bucket name is different from the legacy appspot default, add default bucket as fallback
  if (primaryBucketName !== 'dnd-master-73449.appspot.com') {
    bucketsToTry.push(getStorage().bucket('dnd-master-73449.appspot.com'));
  }

  let lastError = null;
  // Try up to 4 attempts (0ms, 250ms, 500ms, 1000ms) to accommodate GCS metadata propagation delay
  const delays = [0, 250, 500, 1000];
  for (const delay of delays) {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    for (const b of bucketsToTry) {
      try {
        const [meta] = await b.file(path).getMetadata();
        if (meta) return { metadata: meta, targetBucket: b };
      } catch (err) {
        lastError = err;
      }
    }
  }
  throw lastError || new Error('File metadata unavailable');
}

async function validateMedia(media, kind = 'image') {
  if (!media) return null;
  let metadata, targetBucket;
  try {
    const res = await fetchMediaMetadata(media.path);
    metadata = res.metadata;
    targetBucket = res.targetBucket;
  } catch {
    fail(400,'VALIDATION','The uploaded file is unavailable. Upload it again.');
  }
  const mime = metadata.contentType, size = Number(metadata.size);
  const allowed = kind === 'image' ? IMAGE_TYPES.includes(mime)
    : kind === 'recording' ? ['audio/webm','audio/ogg','audio/mpeg','audio/mp4','audio/wav','video/webm','video/mp4','video/quicktime'].includes(mime)
    : kind === 'model' ? ['model/gltf-binary','model/gltf+json','application/octet-stream','text/plain'].includes(mime) && /\.(glb|gltf|obj)$/i.test(media.name)
    : kind === 'code' ? ['application/zip','text/plain','application/octet-stream'].includes(mime) && /\.(zip|txt|py|js|ts|json|html|css|ino)$/i.test(media.name)
    : false;
  if (!allowed || !MEDIA_TYPES.includes(mime) || !Number.isFinite(size) || size <= 0 || size > MAX_MEDIA_SIZE) fail(400,'VALIDATION',`Choose a supported file up to 20 MB for this work type (received ${size ? (size/(1024*1024)).toFixed(1) : 0} MB).`);
  // Firebase uploads may carry permanent download tokens. Remove them so
  // audience restrictions cannot be bypassed after saving or revocation.
  if(metadata.metadata?.firebaseStorageDownloadTokens) {
    await (targetBucket || bucket()).file(media.path).setMetadata({metadata:{firebaseStorageDownloadTokens:null}}).catch(() => {});
  }
  return {...media, contentType: mime, size};
}
async function cleanupUnreferencedMedia(uid, candidatePaths = []) {
  try {
    const prefix = `learnerMedia/${uid}/`;
    const [priv, pub] = await Promise.all([privateRef(uid).get(), portfolioRef(uid).get()]);
    const referenced = new Set();
    const addMedia = m => { if (m?.path) referenced.add(m.path); };
    if (priv.exists) {
      addMedia(priv.data()?.dashboard?.appearance?.picture);
      addMedia(priv.data()?.dashboard?.appearance?.cover);
    }
    if (pub.exists) {
      addMedia(pub.data()?.portfolio?.appearance?.picture);
      addMedia(pub.data()?.portfolio?.appearance?.cover);
      (pub.data()?.items || []).forEach(it => addMedia(it.media));
    }

    let files = [];
    try {
      const [bucketFiles] = await bucket().getFiles({ prefix });
      files = bucketFiles || [];
    } catch {
      files = (candidatePaths || []).filter(p => typeof p === 'string' && p.startsWith(prefix)).map(p => bucket().file(p));
    }

    const GRACE_PERIOD_MS = 15 * 60 * 1000;
    const now = Date.now();

    for (const file of files) {
      const path = file.name || file.path;
      if (!path || !path.startsWith(prefix)) continue;
      if (referenced.has(path)) continue;

      try {
        const [meta] = await file.getMetadata();
        const created = meta?.timeCreated ? new Date(meta.timeCreated).getTime() : 0;
        if (created > 0 && now - created < GRACE_PERIOD_MS) {
          continue;
        }
        await file.delete().catch(() => {});
      } catch {
        // Ignore individual file deletion errors
      }
    }
  } catch (err) {
    console.warn('[Storage Cleanup] Unreferenced media cleanup failed:', err?.message);
  }
}
async function signMedia(media, download = false) {
  if (!media) return null;
  try {
    // Temporary signed URLs expire in 5 minutes (300,000 ms).
    const options = {action:'read', expires: Date.now()+5*60*1000};
    if (download) options.responseDisposition = 'attachment';
    const [url] = await bucket().file(media.path).getSignedUrl(options);
    // Viewers receive only display metadata and a temporary URL, never object paths.
    return {name:media.name,contentType:media.contentType,size:media.size,url};
  } catch (err) {
    console.warn('[signMedia] Failed to sign URL for path:', media?.path, err?.message);
    return {name:media.name,contentType:media.contentType,size:media.size,url:''};
  }
}
async function displaySurface(surface, owner) {
  const a = surface.appearance;
  const signed = async file => file ? {...(owner ? file : {}), ...await signMedia(file)} : null;
  return {...surface, appearance:{...a,picture:await signed(a.picture),cover:await signed(a.cover)}};
}
async function ownerData(uid) {
  const [priv, pub, grants] = await Promise.all([privateRef(uid).get(),portfolioRef(uid).get(),grantsRef(uid).get()]);
  const base = defaults();
  const data = {version:1, revision:priv.data()?.revision || 0, dashboard:priv.data()?.dashboard || base.dashboard, portfolio:pub.data()?.portfolio || base.portfolio, items:pub.data()?.items || [], approvedAudienceCount:grants.data()?.viewerUids?.length || 0};
  data.dashboard = await displaySurface(data.dashboard,true);
  data.portfolio = await displaySurface(data.portfolio,true);
  data.items = await Promise.all(data.items.map(async item => ({...item,media:item.media ? {...item.media,...await signMedia(item.media,['code','model'].includes(item.kind))} : null})));
  return data;
}
router.get('/learner-space',wrap(async(req,res) => {res.json(await ownerData(learner(req)));}));
router.put('/learner-space',wrap(async(req,res) => {
  const uid = learner(req), content = normalizeSettings(req.body,uid);
  for (const surface of [content.dashboard,content.portfolio]) for (const key of ['picture','cover']) surface.appearance[key] = await validateMedia(surface.appearance[key]);
  const [oldPriv, oldPub] = await Promise.all([privateRef(uid).get(), portfolioRef(uid).get()]);
  const candidatePaths = [
    oldPriv.data()?.dashboard?.appearance?.picture?.path,
    oldPriv.data()?.dashboard?.appearance?.cover?.path,
    oldPub.data()?.portfolio?.appearance?.picture?.path,
    oldPub.data()?.portfolio?.appearance?.cover?.path
  ];
  await getFirestore().runTransaction(async tx => {
    const [priv,pub] = await tx.getAll(privateRef(uid),portfolioRef(uid));
    if ((priv.data()?.revision || 0) !== req.body.revision) fail(409,'CONFLICT','Your space changed in another window. Reload before saving.');
    const revision = (priv.data()?.revision || 0)+1;
    tx.set(privateRef(uid),{version:1,revision,dashboard:content.dashboard,updatedAt:new Date().toISOString()});
    tx.set(portfolioRef(uid),{version:1,portfolio:content.portfolio,items:pub.data()?.items || []});
  });
  await cleanupUnreferencedMedia(uid, candidatePaths);
  res.json(await ownerData(uid));
}));
router.post('/learner-space/media-preview',wrap(async(req,res)=>{
  const uid = learner(req), media = await validateMedia(asset(req.body?.media,uid),req.body?.kind || 'image');
  if(!media) fail(400,'VALIDATION','Choose an uploaded file.');
  res.json({...media,...await signMedia(media,['code','model'].includes(req.body?.kind))});
}));
router.post('/learner-space/items',wrap(async(req,res) => {
  const uid = learner(req), item = normalizeItem(req.body,uid);
  item.media = await validateMedia(item.media,item.kind);
  const id = getFirestore().collection('unusedIds').doc().id;
  await getFirestore().runTransaction(async tx => {
    const ref = portfolioRef(uid), snap = await tx.get(ref), value = snap.data() || {version:1,portfolio:defaults().portfolio,items:[]};
    if(value.items.length >= 60) fail(400,'VALIDATION','Keep up to 60 portfolio entries. Remove an entry before adding another.');
    tx.set(ref,{...value,items:[{...item,id,revision:1,createdAt:new Date().toISOString()},...value.items]});
  });
  res.status(201).json(await ownerData(uid));
}));
router.patch('/learner-space/items/:itemId',wrap(async(req,res) => {
  const uid = learner(req), id = requireId(req.params.itemId), content = normalizeItem(req.body,uid);
  content.media = await validateMedia(content.media,content.kind);
  const snap = await portfolioRef(uid).get();
  const oldItem = snap.data()?.items?.find(i => i.id === id);
  const oldMedia = oldItem?.media?.path;
  await getFirestore().runTransaction(async tx => {
    const ref = portfolioRef(uid), txSnap = await tx.get(ref), value = txSnap.data();
    const item = value?.items.find(i => i.id===id);
    if(!item) fail(404,'NOT_FOUND','Work not found.');
    if(item.revision !== req.body.revision) fail(409,'CONFLICT','This work changed. Reload before saving.');
    tx.update(ref,{items:value.items.map(i => i.id===id ? {...item,...content,revision:item.revision+1} : i)});
  });
  await cleanupUnreferencedMedia(uid, [oldMedia]);
  res.json(await ownerData(uid));
}));
router.delete('/learner-space/items/:itemId',wrap(async(req,res) => {
  const uid = learner(req), id = requireId(req.params.itemId);
  const snap = await portfolioRef(uid).get();
  const oldItem = snap.data()?.items?.find(i => i.id === id);
  const oldMedia = oldItem?.media?.path;
  const clientRev = req.body?.revision !== undefined
    ? req.body.revision
    : (req.query?.revision !== undefined ? Number(req.query.revision) : undefined);
  await getFirestore().runTransaction(async tx => {
    const ref = portfolioRef(uid), txSnap = await tx.get(ref), value = txSnap.data(), item = value?.items.find(i=>i.id===id);
    if(!item) fail(404,'NOT_FOUND','Work not found.');
    if(clientRev !== undefined && item.revision !== clientRev) fail(409,'CONFLICT','This work changed. Reload before removing it.');
    tx.update(ref,{items:value.items.filter(i=>i.id!==id)});
  });
  await cleanupUnreferencedMedia(uid, [oldMedia]);
  res.json(await ownerData(uid));
}));
async function ownerProfile(uid) {
  const snap = await getFirestore().collection('users').doc(requireId(uid)).get(), profile = snap.data();
  if(!profile || profile.role !== 'student' || profile.status === 'suspended') fail(403,'FORBIDDEN','This portfolio is unavailable.');
  return profile;
}
async function audiencesFor(caller,uid) {
  const owner = await ownerProfile(uid);
  const schools = intersection(caller.schoolIds,owner.schoolIds);
  const classes = intersection(caller.classIds,owner.classIds);
  // Classes must still belong to a shared, active school; profile changes revoke access.
  const assigned = await Promise.all(classes.map(id=>getFirestore().collection('classes').doc(id).get()));
  const shared = assigned.some(c=>c.exists && schools.includes(c.data().schoolId) && c.data().status !== 'archived');
  const activeSchools = await Promise.all(schools.map(id=>getFirestore().collection('schools').doc(id).get()));
  const schoolActive = activeSchools.some(s=>s.exists && s.data().status !== 'suspended');
  const ownerCohorts = [owner.cohortId, ...(owner.cohortIds || [])].filter(Boolean);
  const callerCohorts = caller.cohortIds || [];
  const sharesCohort = callerCohorts.some(id => ownerCohorts.includes(id));
  const grants = await grantsRef(uid).get();
  const result = [];
  if((shared || sharesCohort) && schoolActive && staff(caller)) result.push('coaches');
  if(shared && schoolActive && caller.role==='student') result.push('classmates');
  const grant = grants.data();
  if(grant?.viewerUids?.includes(caller.uid) && owner.schoolIds?.includes(grant.schoolId)) {
    const school = await getFirestore().collection('schools').doc(grant.schoolId).get();
    if(school.exists && school.data().status !== 'suspended') result.push('wider');
  }
  return result;
}
router.get('/learner-portfolios/:uid',wrap(async(req,res) => {
  const uid = requireId(req.params.uid), caller = req.spaceCaller;
  if(caller.uid === uid) {
    const data = await ownerData(learner(req));
    return res.json({portfolio:data.portfolio,items:data.items});
  }
  const audiences = await audiencesFor(caller,uid), snap = await portfolioRef(uid).get(), value = snap.data();
  const visible = value?.items.filter(item=>item.audiences.some(a=>audiences.includes(a))) || [];
  if(!visible.length) fail(403,'FORBIDDEN','No portfolio work is shared with you.');
  const items = await Promise.all(visible.map(async item=>({id:item.id,title:item.title,kind:item.kind,body:item.body,link:item.link,media:await signMedia(item.media,['code','model'].includes(item.kind))})));
  res.json({portfolio:await displaySurface(value.portfolio,false),items});
}));
async function approveAccess(req) {
  const uid = requireId(req.params.uid), caller = req.spaceCaller, owner = await ownerProfile(uid);
  if(caller.role !== 'admin') fail(403,'FORBIDDEN','School administrators approve wider portfolio audiences.');
  const schools = intersection(caller.schoolIds,owner.schoolIds);
  if(!schools.length) fail(403,'FORBIDDEN','This learner is outside your school.');
  const school = await getFirestore().collection('schools').doc(schools[0]).get();
  if(!school.exists || school.data().status==='suspended') fail(403,'FORBIDDEN','School access is unavailable.');
  return {uid,schoolId:schools[0],caller};
}
router.get('/learner-portfolios/:uid/audience',wrap(async(req,res)=>{
  const {uid} = await approveAccess(req), snap = await grantsRef(uid).get();
  res.json({viewerUids:snap.data()?.viewerUids || [],revision:snap.data()?.revision || 0});
}));
router.put('/learner-portfolios/:uid/audience',wrap(async(req,res) => {
  const {uid,schoolId,caller} = await approveAccess(req), ids = req.body?.viewerUids;
  if(!Array.isArray(ids) || ids.length>30 || new Set(ids).size !== ids.length) fail(400,'VALIDATION','Choose up to 30 unique signed-in viewers.');
  for(const id of ids) {
    requireId(id);
    const viewer = await getFirestore().collection('users').doc(id).get();
    if(!viewer.exists || viewer.data().status==='suspended') fail(400,'VALIDATION','Each viewer needs an active account.');
  }
  await getFirestore().runTransaction(async tx=>{
    const ref = grantsRef(uid), snap = await tx.get(ref);
    if((snap.data()?.revision || 0) !== req.body.revision) fail(409,'CONFLICT','Approvals changed. Reload before saving.');
    tx.set(ref,{viewerUids:ids,schoolId,revision:(snap.data()?.revision || 0)+1,approvedBy:caller.uid,updatedAt:new Date().toISOString()});
  });
  res.json({saved:true});
}));
export default router;
