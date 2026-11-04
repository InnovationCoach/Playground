import {useCallback, useEffect, useState} from 'react';
import {schoolRequest} from '../../services/api/apiClient.js';
import {defaults, normalizeSettings, MAX_MEDIA_SIZE, MEDIA_TYPES} from './personalizationModel.js';
import {PROFILE_SPACE_STRINGS as copy} from './profileSpaceStrings.js';
import {storage} from '../../firebase.js';
export function usePersonalization(uid) {
  const [saved,setSaved] = useState(null), [draft,setDraft] = useState(defaults), [history,setHistory] = useState([]);
  const [loading,setLoading] = useState(true), [busy,setBusy] = useState(false), [error,setError] = useState(''), [status,setStatus] = useState('');
  const reload = useCallback(async () => {
    setLoading(true); setError('');
    try {const data = await schoolRequest('GET','/api/learner-space'); setSaved(data);setDraft(data);setHistory([]);}
    catch(e) {setSaved(null);setDraft(defaults());setHistory([]);setError(e.message || copy.loadFailed);}
    finally {setLoading(false);}
  },[]);
  useEffect(()=>{let active=true; setLoading(true);setSaved(null);setDraft(defaults());setHistory([]);setStatus('');setError('');
    schoolRequest('GET','/api/learner-space').then(data=>{if(active){setSaved(data);setDraft(data);setHistory([]);}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[uid]);
  function change(transform) {setHistory(h=>[...h.slice(-19),structuredClone(draft)]);setDraft(transform(structuredClone(draft)));setStatus(copy.previewStatus);}
  function undo() {if(!history.length)return;setDraft(d=>({...d,dashboard:history.at(-1).dashboard,portfolio:history.at(-1).portfolio}));setHistory(h=>h.slice(0,-1));setStatus(copy.undoneStatus);}
  function discard() {if(saved){setDraft(structuredClone(saved));setHistory([]);setStatus(copy.discardedStatus);}}
  async function save() {
    setBusy(true);setError('');
    try {const data = await schoolRequest('PUT','/api/learner-space',{body:{...normalizeSettings(draft,uid),revision:draft.revision}});setSaved(data);setDraft(data);setStatus(copy.savedStatus);}
    catch(e){setError(e.message || copy.saveFailed);}finally{setBusy(false);}
  }
  async function saveItem(item, remove=false) {
    setBusy(true);setError('');
    try {
      const path = `/api/learner-space/items${item.id ? `/${encodeURIComponent(item.id)}` : ''}`;
      const data = await schoolRequest(remove?'DELETE':item.id?'PATCH':'POST',path,{body:item});
      setSaved(data);setDraft(d=>({...d,items:data.items,approvedAudienceCount:data.approvedAudienceCount}));setStatus(remove?'Work removed.':'Work and audience settings saved.');return true;
    }catch(e){setError(e.message || 'Work could not be saved.');return false;}finally{setBusy(false);}
  }
  return {saved,draft,change,undo,discard,save,saveItem,reload,history,loading,busy,error,status,setError};
}
export async function uploadLearnerFile(uid,file,kind='image') {
  if(!uid) throw new Error('Sign in again before uploading your file.');
  if(!file || !file.size || file.size <= 0) throw new Error('Please select a valid, non-empty file.');
  if(file.size > MAX_MEDIA_SIZE) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`File "${file.name}" (${mb} MB) exceeds the 20 MB student limit. Please compress or choose a file under 20 MB.`);
  }
  const ext = file.name.split('.').at(-1).toLowerCase();
  if (['heic', 'heif'].includes(ext) || file.type === 'image/heic' || file.type === 'image/heif') {
    throw new Error('iPhone HEIC/HEIF photos are not supported by web browsers. Please export as JPEG or PNG before uploading.');
  }
  // Explicit metadata supports text code, ZIPs and model formats consistently.
  const types = {glb:'model/gltf-binary',gltf:'model/gltf+json',obj:'text/plain',zip:'application/zip',txt:'text/plain',py:'text/plain',js:'text/plain',ts:'text/plain',json:'text/plain',html:'text/plain',css:'text/plain',ino:'text/plain',mov:'video/quicktime',mp4:'video/mp4',webm:'video/webm',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif'};
  const contentType = types[ext] || file.type.split(';')[0];
  if(!MEDIA_TYPES.includes(contentType)) throw new Error('Choose an image, audio/video reflection, code file, ZIP, GLB, glTF or OBJ.');
  const name = file.name.slice(0,160), safe = name.replace(/[^A-Za-z0-9_.-]/g,'_');
  const path = `learnerMedia/${uid}/${crypto.randomUUID()}/${safe}`;
  try {
    await storage.ref(path).put(file,{contentType});
  } catch (err) {
    if (err.code === 'storage/unauthorized') {
      throw new Error(`Upload denied for "${file.name}". Please ensure your file is under the 20 MB limit and your student account is active.`);
    }
    throw err;
  }
  // Try media-preview endpoint with retries; if the backend verification has transient propagation delays,
  // fall back gracefully so student crop flow never blocks on preview generation.
  // The file is already in Storage at this point, so no preview error may discard it.
  // Any failure (not only "unavailable") falls back to a direct download URL; saving
  // the item later re-validates the stored file on the server.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) await new Promise(resolve => setTimeout(resolve, 400 * attempt));
      return await schoolRequest('POST','/api/learner-space/media-preview',{body:{media:{path,name},kind}});
    } catch (e) {
      console.warn('[uploadLearnerFile] media preview failed, using direct URL:', e?.code || e?.message);
    }
  }
  // Graceful fallback for local display: get the download URL or generate an object URL
  const downloadUrl = await storage.ref(path).getDownloadURL().catch(() => URL.createObjectURL(file));
  return { path, name, contentType, size: file.size, url: downloadUrl };
}
