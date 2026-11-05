import React, { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { createShipModel } from './shipModel.js';
function Model({fitted,upgrades,violet,item,angle}) {
 const model=useMemo(()=>createShipModel({fitted,upgrades,violet,item}),[fitted.join('|'),upgrades.join('|'),violet,item]);
 useEffect(()=>()=>model.userData.dispose(),[model]);
 return <primitive object={model} rotation={[0,angle,0]} dispose={null}/>;
}
export default function Ship3D({fitted=[],upgrades=[],violet=false,item=null,compact=false,onFailure}) {
 const [angle,setAngle]=useState(0),[view,setView]=useState(0);
 const label=item?`${item} component in 3D`:`Tideglass Scout, ${fitted.length} components fitted`;
 return <div className={`fc-ship-view ${compact?'is-compact':''}`}>
 {!compact && <div className="fc-ship-label"><span>TIDEGLASS / SCOUT 01</span><span>MODULAR EXPLORER</span></div>}
 <div className="fc-ship-canvas" role="img" aria-label={label}>
 <Canvas key={view} frameloop="demand" dpr={[1,1.5]} camera={{position:[5,3.4,-6],fov:34}} gl={{antialias:true,alpha:true}} onCreated={({gl})=>{gl.domElement.addEventListener('webglcontextlost',onFailure,{once:true});}} fallback={<span>3D is unavailable on this device.</span>}>
 <ambientLight intensity={.6}/><directionalLight position={[3,7,-5]} intensity={3}/><directionalLight position={[-5,2,4]} intensity={2} color="#72cfff"/>
 <Environment resolution={128}><Lightformer position={[0,5,0]} rotation={[Math.PI/2,0,0]} scale={[10,10,1]} intensity={3}/><Lightformer position={[-5,1,0]} rotation={[0,Math.PI/2,0]} scale={[5,3,1]} intensity={2} color="#84dcec"/></Environment>
 <Model fitted={fitted} upgrades={upgrades} violet={violet} item={item} angle={angle}/>
 {!compact && <OrbitControls makeDefault enablePan={false} enableZoom={false} minPolarAngle={.2} maxPolarAngle={Math.PI*.83} target={[0,0,0]}/>}
 </Canvas></div>
 {!compact && <div className="fc-ship-controls"><span>Drag to inspect</span><button type="button" className="fc-quiet" onClick={()=>setAngle(a=>a-.4)} aria-label="Rotate ship left">↶</button><button type="button" className="fc-quiet" onClick={()=>setAngle(a=>a+.4)} aria-label="Rotate ship right">↷</button><button type="button" className="fc-quiet" onClick={()=>{setAngle(0);setView(v=>v+1);}}>Reset view</button></div>}
 </div>;
}
