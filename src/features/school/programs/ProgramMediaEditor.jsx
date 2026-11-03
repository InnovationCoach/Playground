import { useState } from 'react';
import { auth, storage } from '../../../firebase.js';
import { mutateSchool, schoolPath, serviceMessage } from '../useSchoolWorkspace.js';
import { LearningMedia } from '../media/LearningMedia.jsx';
import { MEDIA_ACCEPT, MEDIA_HINT, learningMediaType, validateMediaFiles } from '../media/mediaSpec.js';

export function ProgramMediaEditor({school, offering, onSaved}) {
  const [attachments,setAttachments] = useState(offering.attachments || []);
  const [files,setFiles] = useState([]), [revision,setRevision] = useState(offering.revision);
  const [busy,setBusy] = useState(false), [error,setError] = useState(''), [progress,setProgress] = useState('');
  const [inputKey,setInputKey] = useState(0);
  const base = `${schoolPath(school.id,'program-offerings')}/${offering.id}/media`;
  return <details className="sw-card"><summary>Add a program poster, videos and presentation slides</summary><p>These resources appear in enrolled students’ program dashboards. The first image becomes the program poster.</p>
    <form className="sw-form" onSubmit={async e=>{
      e.preventDefault(); setBusy(true);setError('');
      let next = attachments.map(({url,...a})=>a), currentRevision = revision;
      try {
        validateMediaFiles(files,next.length);
        const persist = async resources => {
          const saved = await mutateSchool('PATCH',base,{attachments:resources,revision:currentRevision});
          currentRevision=saved.revision;setRevision(currentRevision);setAttachments(resources);
        };
        if (!files.length) await persist(next);
        for (const file of files) {
          const contentType=learningMediaType(file);
          const path=`programMedia/${school.id}/${offering.id}/${auth.currentUser.uid}/${crypto.randomUUID()}`;
          try {
            const task=storage.ref(path).put(file,{contentType});
            await new Promise((resolve,reject)=>task.on('state_changed',snap=>setProgress(`Uploading ${file.name}: ${Math.round(snap.bytesTransferred/snap.totalBytes*100)}%`),reject,resolve));
          } catch(uploadErr) {
            if (uploadErr.code === 'storage/unauthorized') {
              throw new Error(`Upload denied for "${file.name}". Please ensure the file is under the 100 MB limit and your coach account is assigned to this school.`);
            }
            throw uploadErr;
          }
          const resources=[...next,{path,name:file.name,contentType,size:file.size}];
          await persist(resources);next=resources;setFiles(pending=>pending.slice(1));
        }
        setProgress('Program resources saved.');setInputKey(k=>k+1);onSaved();
      } catch(e) {setError(serviceMessage(e));setProgress('');} finally {setBusy(false);}
    }}>
      <fieldset disabled={busy}><label className="sw-field"><span>Program resources (Max 100 MB per file)</span><input key={inputKey} type="file" multiple accept={MEDIA_ACCEPT} onChange={e=>{
        const chosen = Array.from(e.target.files || []);
        try {
          validateMediaFiles(chosen, attachments.length);
          setFiles(chosen);
          setError('');
        } catch(err) {
          setError(err.message);
          e.target.value = '';
          setFiles([]);
        }
      }}/><small>{MEDIA_HINT}</small></label>
      {files.length>0&&<ul>{files.map((file,i)=><li key={`${file.name}-${i}`}>{file.name}</li>)}</ul>}
      <LearningMedia attachments={attachments}/>{attachments.map(a=><button key={a.path} type="button" className="gh-btn gh-btn-ghost" onClick={()=>setAttachments(items=>items.filter(item=>item.path!==a.path))}>Remove {a.name}</button>)}
      <button className="gh-btn gh-btn-primary">{busy?'Saving…':'Save program resources'}</button></fieldset>
      {progress&&<p role="status">{progress}</p>}{error&&<p role="alert" className="sw-error">{error}</p>}
    </form></details>;
}
