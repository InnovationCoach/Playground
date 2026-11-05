import React, { lazy, Suspense, useState } from 'react';
const Ship3D = lazy(() => import('./Ship3D.jsx'));
class ShipBoundary extends React.Component {
 state = {failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed ? this.props.fallback : this.props.children;}
}
export function ShipArt(props) {
 const [failed,setFailed]=useState(false);
 const fallback=<ShipDiagram {...props}/>;
 if(failed || typeof window === 'undefined' || !window.WebGL2RenderingContext || props.item) return fallback;
 return <ShipBoundary fallback={fallback}><Suspense fallback={fallback}><Ship3D {...props} onFailure={()=>setFailed(true)}/></Suspense></ShipBoundary>;
}
function ShipDiagram({ fitted = [], upgrades = [], violet = false, item = null }) {
 const has = id => item ? item === id : fitted.includes(id);
 return <svg className="fc-ship-art" viewBox="0 0 320 210" role="img" aria-label={item ? `${item} component` : `Your ship: ${fitted.length} starter parts fitted${upgrades.length ? ', upgraded' : ''}`}>
 <ellipse cx="160" cy="184" rx="110" ry="12" fill="#061720" opacity=".45"/>
 {!item && <path d="M160 24L226 156H94Z" fill="none" stroke="#80b2bd" strokeDasharray="5 7"/>}
 {upgrades.includes('solar') && <g fill="#315e99" stroke="#94dbf3" strokeWidth="2"><path d="M118 90H20V145H118ZM202 90H300V145H202Z"/><path d="M45 90V145M70 90V145M95 90V145M225 90V145M250 90V145M275 90V145M20 118H118M202 118H300"/></g>}
 {has('drive') && <g><path d="M119 138H147L141 182H124ZM173 138H201L196 182H179Z" fill="#567b91" stroke="#c4edf3" strokeWidth="3"/><path d="M128 181L134 204L139 181M182 181L188 204L193 181" fill="#8dffe7"/></g>}
 {has('frame') && <g><path d="M160 25C181 46 200 88 207 146L160 168L113 146C120 88 139 46 160 25Z" fill={violet?'#ad91dc':'#d5e8e8'} stroke="#77a8b8" strokeWidth="3"/><path d="M125 102L80 157L117 147M195 102L240 157L203 147" fill="#55939e"/><path d="M160 43L177 89H143Z" fill="#173f59" stroke="#60e0d5" strokeWidth="3"/><path d="M160 102V144" stroke="#52939b" strokeWidth="5"/></g>}
 {has('nav') && <g stroke="#a1f2df" strokeWidth="4"><path d="M160 30V10M148 13Q160 0 172 13" fill="none"/><circle cx="160" cy="8" r="4" fill="#f2d796"/></g>}
 {upgrades.includes('scanner') && <path d="M160 0L173 13L160 27L147 13Z" fill="#bdb4ff" stroke="#f2e4ff"/>}
 </svg>;
}

export function MaterialArt({kind}) {
 return <svg className="fc-material" viewBox="0 0 60 60" role="img" aria-label={kind}>
 {kind==='crystal' ? <g fill="#a9b0ff" stroke="#e4e4ff" strokeWidth="2"><path d="M30 4L48 23L39 51L23 56L12 29Z"/><path d="M30 4L23 56M12 29L48 23"/></g> : kind==='alloy' ? <g fill="#82a9ba" stroke="#d9eff5" strokeWidth="2"><path d="M7 28L36 15L54 27L25 42Z"/><path d="M7 28V40L25 52L54 37V27L25 42Z"/></g> : <g stroke="#bcffe6" strokeWidth="2"><rect x="18" y="8" width="25" height="44" rx="7" fill="#236f70"/><path d="M29 15L23 32H31L27 45L38 27H31Z" fill="#c4ffd8"/></g>}
 </svg>;
}
