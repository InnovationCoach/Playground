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
  if(!uid || !file || !file.size || file.size>MAX_MEDIA_SIZE) throw new Error('Choose a file between 1 byte and 20 MB.');
  // Explicit metadata supports text code, ZIPs and model formats consistently.
  const ext = file.name.split('.').at(-1).toLowerCase();
  const types = {glb:'model/gltf-binary',gltf:'model/gltf+json',obj:'text/plain',zip:'application/zip',txt:'text/plain',py:'text/plain',js:'text/plain',ts:'text/plain',json:'text/plain',html:'text/plain',css:'text/plain',ino:'text/plain'};
  const contentType = types[ext] || file.type.split(';')[0];
  if(!MEDIA_TYPES.includes(contentType)) throw new Error('Choose an image, audio/video reflection, code file, ZIP, GLB, glTF or OBJ.');
  const name = file.name.slice(0,160), safe = name.replace(/[^A-Za-z0-9_.-]/g,'_');
  const path = `learnerMedia/${uid}/${crypto.randomUUID()}/${safe}`;
  await storage.ref(path).put(file,{contentType});
  // Do not generate permanent download tokens or store public URLs.
  return schoolRequest('POST','/api/learner-space/media-preview',{body:{media:{path,name},kind}});
}
