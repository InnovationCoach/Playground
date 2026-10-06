import {useEffect,useId,useRef,useState} from 'react';
import {PROFILE_SPACE_STRINGS as copy,profileText} from './profileSpaceStrings.js';
import {cropImage,cropRect} from './imageCrop.js';

export default function ImageCropDialog({file,kind,onApply,onCancel,returnFocus}) {
  const label=useId(), dialog=useRef(null), image=useRef(null);
  const [url,setUrl]=useState(''),[size,setSize]=useState(null),[zoom,setZoom]=useState(1),[x,setX]=useState(50),[y,setY]=useState(50),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const aspect=kind==='picture'?1:8/3;
  useEffect(()=>{const objectUrl=URL.createObjectURL(file);setUrl(objectUrl);return()=>URL.revokeObjectURL(objectUrl);},[file]);
  useEffect(()=>{const previous=returnFocus||document.activeElement;dialog.current?.focus();return()=>previous?.focus?.();},[]);
  let rect=size?cropRect(size.width,size.height,aspect,zoom,x,y):null;
  async function apply(){setBusy(true);setError('');try{const prepared=await cropImage(image.current,rect,kind);await onApply(prepared);}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <div className="lp-crop-overlay"><section ref={dialog} className="lp-crop-dialog" role="dialog" aria-modal="true" aria-labelledby={label} tabIndex={-1} onKeyDown={e=>{
    if(e.key==='Escape'&&!busy){e.preventDefault();onCancel();}
    if(e.key==='Tab'){const nodes=[...dialog.current.querySelectorAll('button,input')].filter(n=>!n.matches(':disabled'));if(!nodes.length){e.preventDefault();return;}if(e.shiftKey&&(document.activeElement===nodes[0]||document.activeElement===dialog.current)){e.preventDefault();nodes.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0].focus();}}
  }}>
    <h2 id={label}>{kind==='picture'?copy.cropPhotoTitle:copy.cropBannerTitle}</h2><p className="lp-crop-lead">{copy.cropLead}</p>
    <div className={`lp-crop-window ${kind==='picture'?'lp-crop-round':''}`} style={{aspectRatio:aspect}}>
      {url&&<img ref={image} src={url} alt={copy.cropPreviewAlt} onLoad={e=>{const {naturalWidth:width,naturalHeight:height}=e.currentTarget;if(!width||!height){setError(copy.unreadableImage);return;}setSize({width,height});}} onError={()=>{setSize(null);setError(copy.invalidImage);}} style={rect?{position:'absolute',width:`${size.width/rect.width*100}%`,height:`${size.height/rect.height*100}%`,maxWidth:'none',left:`${-rect.x/rect.width*100}%`,top:`${-rect.y/rect.height*100}%`}:{width:'100%'}}/>}
    </div>
    <fieldset disabled={busy||!size} className="lp-crop-controls"><legend>{copy.cropLegend}</legend><button type="button" className="lp-crop-reset" disabled={zoom===1&&x===50&&y===50} onClick={()=>{setZoom(1);setX(50);setY(50);}}>{copy.reset}</button>{[[copy.zoom,zoom,setZoom,1,3,.05],[copy.horizontal,x,setX,0,100,1],[copy.vertical,y,setY,0,100,1]].map(([name,value,set,min,max,step])=><label key={name}>{name}<input type="range" aria-label={name} min={min} max={max} step={step} value={value} onChange={e=>set(Number(e.target.value))}/><output>{name===copy.zoom?`${Number(value).toFixed(2)}×`:`${value}%`}</output></label>)}</fieldset>
    <ul className="lp-crop-notes"><li>{profileText('cropOutput',{size:kind==='picture'?'640 × 640':'1600 × 600'})}</li>{kind==='cover'&&<li>{copy.cropEdges}</li>}<li>{copy.cropKeyboard}</li></ul>
    {error&&<p role="alert" className="lp-error">{error}</p>}{busy&&<p role="status">{copy.preparingImage}</p>}
    <div className="lp-actions lp-crop-actions"><button type="button" disabled={busy} onClick={onCancel}>{copy.cancelImage}</button><button type="button" className="lp-primary" disabled={busy||!size} onClick={apply}>{busy?copy.preparing:copy.applyCrop}</button></div>
  </section></div>;
}
