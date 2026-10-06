import {useEffect,useRef,useState} from 'react';
import {usePersonalization,uploadLearnerFile} from './usePersonalization.js';
import {PALETTES,BACKGROUNDS,WIDGETS,LAYOUTS,KINDS,AUDIENCES,defaults,moveWidget,previewItems,safeProjectLink} from './personalizationModel.js';
import {schoolRequest} from '../../services/api/apiClient.js';
import ImageCropDialog from './ImageCropDialog.jsx';
import {IMAGE_TYPES,MAX_MEDIA_SIZE} from './personalizationModel.js';
import {refreshLearnerAvatar} from '../shell/useLearnerAvatar.js';
import './personalization.css';
const Field = ({label,children}) => <label className="lp-field"><span>{label}</span>{children}</label>;
export function surfaceStyle(surface) {return {'--lp-accent':PALETTES[surface.appearance.accent].accent,'--lp-ink':PALETTES[surface.appearance.accent].ink,background:BACKGROUNDS[surface.appearance.background]};}
function SurfaceHeader({surface,name,privateDashboard=false}) {
  return <header className="lp-header">{surface.appearance.cover?.url && <img className="lp-cover" src={surface.appearance.cover.url} alt={privateDashboard ? "My dashboard banner" : "Portfolio cover"}/>}<div className="lp-identity">{surface.appearance.picture?.url ? <img className="lp-avatar" src={surface.appearance.picture.url} alt={`${name || 'Learner'} profile`}/> : <span className="lp-avatar lp-initial" aria-hidden="true">{(name || 'L').slice(0,1)}</span>}<div><h1>{surface.heading || name || 'My space'}</h1>{name && <p>{name}</p>}</div></div><p className="lp-intro">{surface.introduction}</p>{surface.interests && <p><strong>Interests:</strong> {surface.interests}</p>}</header>;
}
function Feedback({space}) {return <>{space.error && <p className="lp-error" role="alert">{space.error}</p>}<p className="lp-status" role="status" aria-live="polite">{space.status}</p></>;}
function SettingsEditor({space,uid,surfaceKey,externalBusy=false}) {
  const surface=space.draft[surfaceKey], [uploading,setUploading]=useState(false);
  const update=(key,value)=>space.change(d=>({...d,[surfaceKey]:{...d[surfaceKey],[key]:value}}));
  const appearance=(key,value)=>space.change(d=>({...d,[surfaceKey]:{...d[surfaceKey],appearance:{...d[surfaceKey].appearance,[key]:value}}}));
  async function upload(key,file) {
    if(!file)return;setUploading(true);space.setError('');
    try {appearance(key,await uploadLearnerFile(uid,file));}catch(e){space.setError(e.message);}finally{setUploading(false);}
  }
  return <fieldset className="lp-editor" disabled={space.busy || uploading || externalBusy || !space.saved}><legend>{surfaceKey==='dashboard'?'Personalize your private dashboard':'Personalize your shareable portfolio'}</legend>
    <p>{surfaceKey==='dashboard'?'Your introduction, interests, personal goals and dashboard settings are private.':'Only this portfolio introduction, interests and selected work can be shared. Personal goals and support information stay on your private dashboard.'}</p>
    <div className="lp-fields"><Field label="Heading"><input maxLength={100} value={surface.heading} onChange={e=>update('heading',e.target.value)}/></Field><Field label="Short introduction"><textarea maxLength={600} value={surface.introduction} onChange={e=>update('introduction',e.target.value)}/></Field><Field label="Interests"><input maxLength={300} value={surface.interests} onChange={e=>update('interests',e.target.value)}/></Field>
    {surfaceKey==='dashboard' && <Field label="Private personal goals"><textarea maxLength={1200} value={surface.goals} onChange={e=>update('goals',e.target.value)}/></Field>}
    <Field label="Accent color"><select value={surface.appearance.accent} onChange={e=>appearance('accent',e.target.value)}>{Object.entries(PALETTES).map(([id,p])=><option key={id} value={id}>{p.label}</option>)}</select></Field>
    <Field label="Background"><select value={surface.appearance.background} onChange={e=>appearance('background',e.target.value)}>{Object.keys(BACKGROUNDS).map(id=><option key={id} value={id}>{id}</option>)}</select></Field>
    <Field label="Preset layout"><select value={surface.layout} onChange={e=>{const layout=e.target.value;space.change(d=>({...d,[surfaceKey]:{...d[surfaceKey],layout,...(surfaceKey==='dashboard'?{widgetOrder:[...LAYOUTS[layout]]}:{})}}));}}>{Object.keys(surfaceKey==='dashboard'?LAYOUTS:{gallery:1,journal:1}).map(id=><option value={id} key={id}>{id}</option>)}</select></Field>
    {(surfaceKey==='portfolio'?['picture','cover']:[]).map(key=><div key={key}><Field label={key==='picture'?'Profile picture':'Portfolio cover'}><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e=>{const file=e.target.files[0];e.target.value='';upload(key,file);}}/></Field>{surface.appearance[key] && <button type="button" onClick={()=>appearance(key,null)}>Remove {key}</button>}</div>)}
    </div><p className="lp-muted">Curated colors and layouts keep your space readable. Uploaded images: up to 20 MB.</p>
    <div className="lp-actions"><button type="button" onClick={space.save}>{space.busy?'Saving…':'Save personalization'}</button><button type="button" disabled={!space.history.length} onClick={space.undo}>Undo last change</button><button type="button" onClick={space.discard}>Discard preview</button>{surfaceKey==='dashboard' && <button type="button" onClick={()=>space.change(d=>({...d,dashboard:{...d.dashboard,layout:'balanced',widgetOrder:[...defaults().dashboard.widgetOrder]}}))}>Restore default layout</button>}</div>
    {uploading && <p role="status">Uploading your image…</p>}
  </fieldset>;
}
function DashboardProfile({space,uid,profile,onUploading}) {
  const [selection,setSelection]=useState(null),[uploading,setUploading]=useState(false);
  const pictureInput=useRef(null),coverInput=useRef(null);
  const surface=space.draft.dashboard, appearance=surface.appearance;
  const disabled=space.loading||space.busy||uploading||!space.saved;
  const changed=space.saved&&JSON.stringify(space.draft.dashboard)!==JSON.stringify(space.saved.dashboard);
  function select(kind,file){
    if(!file)return;
    space.setError('');
    if(!IMAGE_TYPES.includes(file.type)){space.setError('Choose a JPG, PNG, WebP or GIF image.');return;}
    if(!file.size||file.size>MAX_MEDIA_SIZE){space.setError('Choose an image between 1 byte and 20 MB.');return;}
    setSelection({kind,file});onUploading(true);
  }
  function cancel(){setSelection(null);onUploading(false);}
  function remove(kind){space.change(d=>({...d,dashboard:{...d.dashboard,appearance:{...d.dashboard.appearance,[kind]:null}}}));}
  async function apply(file){
    setUploading(true);
    try{const uploaded=await uploadLearnerFile(uid,file);space.change(d=>({...d,dashboard:{...d.dashboard,appearance:{...d.dashboard.appearance,[selection.kind]:uploaded}}}));setSelection(null);onUploading(false);}
    finally{setUploading(false);}
  }
  return <>
    <header className="lp-profile-header" aria-label="Your personal learning space">
      <div className="lp-profile-cover">{appearance.cover?.url?<img src={appearance.cover.url} alt="My dashboard banner" className="lp-cover"/>:<div className="lp-cover-placeholder"><span>YOUR SPACE, YOUR STORY</span><p>A little room for what inspires you.</p></div>}
        <button type="button" className="lp-cover-edit" disabled={disabled} onClick={()=>coverInput.current?.click()}>{appearance.cover?'Change banner':'Add cover banner'}</button>
      </div>
      <div className="lp-profile-identity"><div className="lp-profile-photo">
        {appearance.picture?.url?<img className="lp-avatar" src={appearance.picture.url} alt={`${profile?.displayName||'Learner'} profile`}/>:<span className="lp-avatar lp-initial" aria-hidden="true">{(profile?.displayName||'L').slice(0,1)}</span>}
        <button type="button" className="lp-photo-edit" disabled={disabled} onClick={()=>pictureInput.current?.click()}>{appearance.picture?'Change photo':'Add photo'}</button>
      </div><div className="lp-profile-copy"><p className="lp-profile-name">{profile?.displayName||'My private dashboard'}</p><h1>{surface.heading||'My learning space'}</h1><p className="lp-intro">{surface.introduction||'A place for your ideas, discoveries and next steps.'}</p>{surface.interests&&<p className="lp-profile-interests"><strong>Interests:</strong> {surface.interests}</p>}</div></div>
      <div className="lp-profile-tools"><p>Your photo and banner decorate this private dashboard. Your shareable portfolio has its own settings.</p><details><summary>Image settings</summary><div className="lp-image-settings">
        <label>Profile picture<input ref={pictureInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={disabled} onChange={e=>{const file=e.target.files?.[0];e.target.value='';select('picture',file);}}/></label>
        <label>Dashboard banner<input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={disabled} onChange={e=>{const file=e.target.files?.[0];e.target.value='';select('cover',file);}}/></label>
        {appearance.picture&&<button type="button" disabled={disabled} onClick={()=>remove('picture')}>Remove profile picture</button>}{appearance.cover&&<button type="button" disabled={disabled} onClick={()=>remove('cover')}>Remove dashboard banner</button>}
        <p>JPG, PNG, WebP or GIF, up to 20 MB. Crop and preview before saving.</p>
      </div></details></div>
    </header>
    {changed&&<div className="lp-profile-save" role="region" aria-label="Unsaved dashboard preview"><p>Previewing your changes. Save when it feels like you.</p><div className="lp-actions"><button type="button" disabled={disabled||!!selection} onClick={async()=>{await space.save();refreshLearnerAvatar(uid);}}>Save dashboard changes</button><button type="button" disabled={disabled||!space.history.length||!!selection} onClick={space.undo}>Undo decoration change</button><button type="button" disabled={disabled||!!selection} onClick={space.discard}>Discard dashboard preview</button></div></div>}
    {selection&&<ImageCropDialog key={selection.kind} {...selection} onCancel={cancel} onApply={apply}/>}
  </>;
}
export function PersonalizedDashboard({uid,profile,widgets}) {
  const space=usePersonalization(uid), [editing,setEditing]=useState(false), [dragId,setDragId]=useState(null), [announcement,setAnnouncement]=useState(''), [decorating,setDecorating]=useState(false);
  const d=space.draft.dashboard;
  function move(id,target){space.change(value=>({...value,dashboard:{...value.dashboard,widgetOrder:moveWidget(value.dashboard.widgetOrder,id,target)}}));setAnnouncement(`${WIDGETS[id]} moved to position ${target+1} of 4.`);}
  return <section className={`lp-space lp-dashboard lp-layout-${d.layout}`} style={surfaceStyle(d)} aria-label="Private learning dashboard">
    <div className="lp-toolbar"><strong>Private learning dashboard</strong><a href="#/portfolio">My shareable portfolio →</a><button type="button" aria-expanded={editing} onClick={()=>setEditing(v=>!v)} disabled={space.loading || decorating || !space.saved}>Personalize dashboard</button></div>
    {space.loading && <p role="status">Loading your personalization…</p>}
    <Feedback space={space}/>{space.error && <button type="button" onClick={space.reload}>Reload personalization</button>}
    <DashboardProfile space={space} uid={uid} profile={profile} onUploading={setDecorating}/>
    {editing && <><SettingsEditor space={space} uid={uid} surfaceKey="dashboard" externalBusy={decorating}/><p>Live preview below. Drag a widget by its handle, use Alt + ↑/↓ on the handle, or use Move up / Move down. Save to keep your order.</p></>}
    <p className="lp-sr" role="status" aria-live="polite">{announcement}</p>
    <div className="lp-widgets">{d.widgetOrder.map((id,index)=><section className="lp-widget" key={id} aria-label={WIDGETS[id]} onDragOver={e=>{if(editing)e.preventDefault();}} onDrop={e=>{e.preventDefault();if(editing&&dragId)move(dragId,index);setDragId(null);}}>
      {editing && <div className="lp-widget-controls"><button type="button" draggable={!space.busy} disabled={space.busy} aria-label={`Reorder ${WIDGETS[id]}`} onDragStart={e=>{setDragId(id);e.dataTransfer.setData('text/plain',id);e.dataTransfer.effectAllowed='move';}} onDragEnd={()=>setDragId(null)} onKeyDown={e=>{if(e.altKey && ['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const target=index+(e.key==='ArrowUp'?-1:1);if(target>=0 && target<4)move(id,target);}}}>⠿ {WIDGETS[id]}</button><button type="button" disabled={index===0 || space.busy} onClick={()=>move(id,index-1)}>Move up<span className="lp-sr"> {WIDGETS[id]}</span></button><button type="button" disabled={index===3 || space.busy} onClick={()=>move(id,index+1)}>Move down<span className="lp-sr"> {WIDGETS[id]}</span></button></div>}
      {id==='about'?<div><h2>About my learning</h2><p>{d.introduction || 'Use Personalize dashboard to introduce yourself.'}</p><h3>My private personal goals</h3><p className="lp-intro">{d.goals || 'Add a personal goal in your dashboard settings.'}</p></div>:widgets[id]}
    </section>)}</div>
  </section>;
}
function WorkCard({item}) {
  let link = ''; try {link = safeProjectLink(item.link);} catch { /* unsafe drafts are never linked */ }
  return <article className="lp-work"><small>{KINDS[item.kind]}</small><h3>{item.title}</h3>{item.body && (item.kind==='code'?<pre><code>{item.body}</code></pre>:<p className="lp-intro">{item.body}</p>)}{link && <a href={link} target="_blank" rel="noopener noreferrer">Open project link ↗</a>}
    {item.media?.url && <div className="lp-media">{item.kind==='image'?<img src={item.media.url} alt={item.title}/>:item.kind==='recording'?(item.media.contentType.startsWith('video/')?<video controls preload="metadata" src={item.media.url}/>:<audio controls preload="metadata" src={item.media.url}/>):<a href={item.media.url} download={item.media.name}>Download {item.media.name}</a>}</div>}
  </article>;
}
export function PortfolioPresentation({portfolio,items}) {return <section className={`lp-space lp-portfolio lp-portfolio-${portfolio.layout}`} style={surfaceStyle(portfolio)} aria-label="Shareable portfolio"><SurfaceHeader surface={portfolio}/><div className="lp-work-grid">{items.map(item=><WorkCard key={item.id} item={item}/>)}{!items.length && <p>No work is shared with this audience yet.</p>}</div></section>;}
function Recorder({onFile,onError,disabled,onRecording}) {
  const [recording,setRecording]=useState(false), recorder=useRef(null), stream=useRef(null), timer=useRef(null), active=useRef(true);
  useEffect(()=>{active.current=true;return()=>{active.current=false;clearTimeout(timer.current);if(recorder.current?.state==='recording')recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop());};},[]);
  async function start(){
    try {
      if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('Recording is unavailable in this browser. Upload an audio file instead.');
      const audio=await navigator.mediaDevices.getUserMedia({audio:true});if(!active.current){audio.getTracks().forEach(t=>t.stop());return;}
      stream.current=audio;const chunks=[];const rec=new MediaRecorder(audio);recorder.current=rec;
      rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      rec.onstop=()=>{clearTimeout(timer.current);audio.getTracks().forEach(t=>t.stop());if(!active.current)return;setRecording(false);onRecording(false);const type=rec.mimeType.split(';')[0];onFile(new File(chunks,`reflection.${type.includes('mp4')?'m4a':type.includes('ogg')?'ogg':'webm'}`,{type}));};
      rec.onerror=()=>{audio.getTracks().forEach(t=>t.stop());if(active.current){setRecording(false);onRecording(false);onError('Recording failed. Try again or upload an audio file.');}};
      rec.start();setRecording(true);onRecording(true);timer.current=setTimeout(()=>{if(rec.state==='recording')rec.stop();},180000);
    }catch(e){onError(e.message || 'Microphone access is needed to record.');}
  }
  return <div><button type="button" disabled={disabled && !recording} onClick={()=>recording?recorder.current.stop():start()}>{recording?'Stop recording':'Record a reflection'}</button><p role="status">{recording?'Recording… Stop when finished (maximum 3 minutes).':'You can record audio or upload an existing recording.'}</p></div>;
}
const emptyItem=()=>({title:'',kind:'writing',body:'',link:'',media:null,audiences:[]});
function WorkEditor({space,uid}) {
  const [item,setItem]=useState(emptyItem), [uploading,setUploading]=useState(false), [preview,setPreview]=useState(false), [removing,setRemoving]=useState(null), [itemHistory,setItemHistory]=useState([]), [recording,setRecording]=useState(false);
  const update=(key,value)=>{setItemHistory(h=>[...h.slice(-19),structuredClone(item)]);setItem(i=>({...i,[key]:value}));setPreview(false);};
  async function fileSelected(file){if(!file)return;setUploading(true);space.setError('');try {update('media',await uploadLearnerFile(uid,file,item.kind));}catch(e){space.setError(e.message);}finally{setUploading(false);}}
  return <section className="lp-work-editor"><h2>Add and curate your work</h2><p>New work starts private. Audience choices apply only to this entry. Recorded reflections can include a transcript in the text field.</p>
    <form onSubmit={async e=>{e.preventDefault();if(!recording && await space.saveItem(item)){setItem(emptyItem());setItemHistory([]);setPreview(false);}}}>
    <fieldset disabled={space.busy || uploading}><legend>{item.id?'Edit portfolio work':'Add portfolio work'}</legend><div className="lp-fields"><Field label="Work type"><select value={item.kind} disabled={recording} onChange={e=>{setItemHistory(h=>[...h.slice(-19),structuredClone(item)]);setItem({...item,kind:e.target.value,media:null});setPreview(false);}}>{Object.entries(KINDS).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></Field>
    <Field label="Work title"><input required maxLength={160} value={item.title} onChange={e=>update('title',e.target.value)}/></Field><Field label={item.kind==='code'?'Code or project description':'Reflection, description or transcript'}><textarea maxLength={12000} rows={5} value={item.body} onChange={e=>update('body',e.target.value)}/></Field>
    <Field label="Project link (HTTPS)"><input type="url" pattern="https://.*" value={item.link} onChange={e=>update('link',e.target.value)}/></Field>
    {item.kind!=='writing' && <Field label="Upload work (up to 20 MB)"><input type="file" accept={item.kind==='image'?'image/jpeg,image/png,image/webp,image/gif':item.kind==='model'?'.glb,.gltf,.obj':item.kind==='code'?'.zip,.txt,.py,.js,.ts,.json,.html,.css,.ino':'audio/webm,audio/ogg,audio/mpeg,audio/mp4,audio/wav,video/webm,video/mp4'} onChange={e=>{const f=e.target.files[0];e.target.value='';fileSelected(f);}}/></Field>}
    </div>{item.kind==='recording' && <Recorder onRecording={setRecording} onFile={fileSelected} onError={space.setError} disabled={uploading || space.busy}/>}{item.media && <p>Attached: {item.media.name} <button type="button" onClick={()=>update('media',null)}>Remove attachment</button></p>}
    <fieldset><legend>Who can see this work?</legend>{Object.entries(AUDIENCES).map(([id,label])=><label className="lp-checkbox" key={id}><input type="checkbox" checked={item.audiences.includes(id)} onChange={e=>update('audiences',e.target.checked?[...item.audiences,id]:item.audiences.filter(a=>a!==id))}/>{label}</label>)}<p>{!item.audiences.length?'Private — only you can view this work.':item.audiences.includes('wider')?`Wider audience: ${space.draft.approvedAudienceCount || 0} approved account(s). No wider viewer has access until school approval.`:'Only selected audiences can view this work.'}</p></fieldset>
    <div className="lp-actions"><button type="button" onClick={()=>setPreview(v=>!v)}>Preview work</button><button type="submit" disabled={recording}>{item.id?'Save work changes':'Add work'}</button><button type="button" disabled={!itemHistory.length || recording} onClick={()=>{setItem(itemHistory.at(-1));setItemHistory(h=>h.slice(0,-1));setPreview(false);}}>Undo work change</button><button type="button" disabled={recording} onClick={()=>{setItem(emptyItem());setItemHistory([]);setPreview(false);}}>Discard work changes</button></div></fieldset></form>
    {uploading && <p role="status">Uploading your work…</p>}{preview && <div aria-label="Work preview"><WorkCard item={item}/></div>}
    <h3>Your saved work</h3>{space.draft.items.map(entry=><div className="lp-entry" key={entry.id}><strong>{entry.title}</strong><span>{entry.audiences.length?entry.audiences.map(a=>AUDIENCES[a]).join(', '):'Private'}</span><button type="button" disabled={space.busy || recording || uploading} onClick={()=>{setItem(entry);setItemHistory([]);setPreview(false);}}>Edit work<span className="lp-sr"> {entry.title}</span></button><button type="button" disabled={space.busy} onClick={()=>setRemoving(entry)}>Remove work<span className="lp-sr"> {entry.title}</span></button></div>)}
    {removing && <div role="alert"><p>Remove “{removing.title}” from your portfolio?</p><button type="button" disabled={space.busy} onClick={async()=>{if(await space.saveItem(removing,true))setRemoving(null);}}>Confirm removal</button><button type="button" onClick={()=>setRemoving(null)}>Keep work</button></div>}
  </section>;
}
export function PortfolioEditor({uid}) {
  const space=usePersonalization(uid), [audience,setAudience]=useState('owner'), [copied,setCopied]=useState('');
  if(space.loading)return <p role="status">Loading your portfolio…</p>;
  if(!space.saved)return <div className="lp-space"><Feedback space={space}/><button onClick={space.reload}>Try again</button></div>;
  return <main className="lp-owner"><div className="lp-toolbar"><a href="#/home">← Private learning dashboard</a><h1>My shareable portfolio</h1><button type="button" onClick={async()=>{try {await navigator.clipboard.writeText(`${window.location.href.split('#')[0]}#/portfolio/${encodeURIComponent(uid)}`);setCopied('Portfolio link copied. Viewers must sign in and have access to the work.');}catch{setCopied(`Portfolio link: ${window.location.href.split('#')[0]}#/portfolio/${encodeURIComponent(uid)}`);}}}>Copy portfolio link</button></div><p role="status">{copied}</p><Feedback space={space}/><SettingsEditor space={space} uid={uid} surfaceKey="portfolio"/><WorkEditor space={space} uid={uid}/>
    <section className="lp-preview"><h2>Preview portfolio</h2><Field label="Preview as"><select value={audience} onChange={e=>setAudience(e.target.value)}><option value="owner">Me (includes private work)</option>{Object.entries(AUDIENCES).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></Field><p>{audience==='owner'?'This view includes private entries for you.':audience==='wider'?'Shows the work a school-approved wider viewer could see. Approval is still required.':'Shows only work shared with this audience.'} Personal goals and support information are excluded from every portfolio view.</p><PortfolioPresentation portfolio={space.draft.portfolio} items={previewItems(space.draft.items,audience)}/></section>
  </main>;
}
export function PortfolioViewer({uid,role}) {
  const [data,setData]=useState(null),[error,setError]=useState('');
  useEffect(()=>{let active=true;setData(null);setError('');schoolRequest('GET',`/api/learner-portfolios/${encodeURIComponent(uid)}`).then(d=>{if(active)setData(d);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[uid]);
  return <main className="lp-owner"><h1>Shared learner portfolio</h1>{error && <p role="alert" className="lp-error">{error}</p>}{!data && !error && <p role="status">Checking shared work…</p>}{data && <PortfolioPresentation portfolio={data.portfolio} items={data.items}/>}<p>Personal goals, private notes and support information are never included here.</p>{role==='admin' && <AudienceApproval uid={uid}/>}</main>;
}
function AudienceApproval({uid}) {
  const [value,setValue]=useState(''),[revision,setRevision]=useState(null),[status,setStatus]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{let active=true;schoolRequest('GET',`/api/learner-portfolios/${encodeURIComponent(uid)}/audience`).then(d=>{if(active){setValue(d.viewerUids.join('\n'));setRevision(d.revision);}}).catch(e=>{if(active)setStatus(e.message);});return()=>{active=false;};},[uid]);
  return <form className="lp-editor" onSubmit={async e=>{e.preventDefault();setBusy(true);try{await schoolRequest('PUT',`/api/learner-portfolios/${encodeURIComponent(uid)}/audience`,{body:{revision,viewerUids:value.split(/[,\s]+/).filter(Boolean)}});setRevision(r=>r+1);setStatus('Wider audience approval saved. Learners still choose which entries to share.');}catch(e){setStatus(e.message);}finally{setBusy(false);}}}><h2>School approval for a wider audience</h2><Field label="Approved viewer account IDs (one per line)"><textarea value={value} onChange={e=>setValue(e.target.value)}/></Field><p>Approve named accounts only. Clear the list to revoke wider access.</p><button disabled={busy || revision===null}>Save approved viewers</button><p role="status">{status}</p></form>;
}
