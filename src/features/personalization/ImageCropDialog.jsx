import {useEffect,useId,useRef,useState} from 'react';
import {cropImage,cropRect} from './imageCrop.js';

export default function ImageCropDialog({file,kind,onApply,onCancel}) {
  const label=useId(), dialog=useRef(null), image=useRef(null);
  const [url,setUrl]=useState(''),[size,setSize]=useState(null),[zoom,setZoom]=useState(1),[x,setX]=useState(50),[y,setY]=useState(50),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const aspect=kind==='picture'?1:8/3;
  useEffect(()=>{const objectUrl=URL.createObjectURL(file);setUrl(objectUrl);return()=>URL.revokeObjectURL(objectUrl);},[file]);
  useEffect(()=>{const previous=document.activeElement;dialog.current?.focus();return()=>previous?.focus?.();},[]);
  let rect=size?cropRect(size.width,size.height,aspect,zoom,x,y):null;
  async function apply(){setBusy(true);setError('');try{const prepared=await cropImage(image.current,rect,kind);await onApply(prepared);}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <div className="lp-crop-overlay"><section ref={dialog} className="lp-crop-dialog" role="dialog" aria-modal="true" aria-labelledby={label} tabIndex={-1} onKeyDown={e=>{
    if(e.key==='Escape'&&!busy){e.preventDefault();onCancel();}
    if(e.key==='Tab'){const nodes=[...dialog.current.querySelectorAll('button,input')].filter(n=>!n.matches(':disabled'));if(!nodes.length){e.preventDefault();return;}if(e.shiftKey&&(document.activeElement===nodes[0]||document.activeElement===dialog.current)){e.preventDefault();nodes.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0].focus();}}
  }}>
    <h2 id={label}>{kind==='picture'?'Frame your profile photo':'Frame your cover banner'}</h2><p>Choose what appears in your private learning space. Nothing is uploaded until you use this crop.</p>
    <div className={`lp-crop-window ${kind==='picture'?'lp-crop-round':''}`} style={{aspectRatio:aspect}}>
      {url&&<img ref={image} src={url} alt="Selected image crop preview" onLoad={e=>{const {naturalWidth:width,naturalHeight:height}=e.currentTarget;if(!width||!height){setError('This image could not be read.');return;}setSize({width,height});}} onError={()=>{setSize(null);setError('This image could not be read. Choose another image.');}} style={rect?{position:'absolute',width:`${size.width/rect.width*100}%`,height:`${size.height/rect.height*100}%`,maxWidth:'none',left:`${-rect.x/rect.width*100}%`,top:`${-rect.y/rect.height*100}%`}:{width:'100%'}}/>}
    </div>
    <fieldset disabled={busy||!size} className="lp-crop-controls"><legend>Adjust the crop</legend>{[['Zoom',zoom,setZoom,1,3,.05],['Horizontal position',x,setX,0,100,1],['Vertical position',y,setY,0,100,1]].map(([name,value,set,min,max,step])=><label key={name}>{name}<input type="range" aria-label={name} min={min} max={max} step={step} value={value} onChange={e=>set(Number(e.target.value))}/><output>{name==='Zoom'?`${Number(value).toFixed(2)}×`:`${value}%`}</output></label>)}</fieldset>
    <p className="lp-muted">Your image becomes a still PNG. Animated GIFs use a single frame. Banner edges may crop further on smaller screens. Use the sliders with arrow keys to reposition.</p>
    {error&&<p role="alert" className="lp-error">{error}</p>}{busy&&<p role="status">Preparing your image…</p>}
    <div className="lp-actions"><button type="button" disabled={busy} onClick={onCancel}>Cancel image change</button><button type="button" disabled={busy||!size} onClick={apply}>{busy?'Preparing…':'Use this crop'}</button></div>
  </section></div>;
}
