import * as T from 'three';

// Original modular scout geometry. Coordinates use +Y up and -Z forward.
export function createShipModel({ fitted = [], upgrades = [], violet = false, item = null } = {}) {
 const ship = new T.Group(); ship.name='Tideglass Scout';
 const white=new T.MeshPhysicalMaterial({color:violet?'#9983bc':'#dde6ed',metalness:.65,roughness:.27,clearcoat:1});
 const dark=new T.MeshStandardMaterial({color:'#142631',metalness:.85,roughness:.3});
 const silver=new T.MeshStandardMaterial({color:'#7293a1',metalness:.8,roughness:.24});
 const glass=new T.MeshPhysicalMaterial({color:'#12485e',metalness:.5,roughness:.09,clearcoat:1});
 const glow=new T.MeshStandardMaterial({color:'#8bffed',emissive:'#24e7cf',emissiveIntensity:3});
 const blue=new T.MeshStandardMaterial({color:'#172955',metalness:.65,roughness:.25});
 const materials=[white,dark,silver,glass,glow,blue];
 const add=(group,geo,mat,pos=[0,0,0],scale=[1,1,1])=>{const m=new T.Mesh(geo,mat);m.position.set(...pos);m.scale.set(...scale);group.add(m);return m;};
 const box=(g,size,pos,mat)=>add(g,new T.BoxGeometry(...size),mat,pos);
 const shell=(rings)=>{
  const vertices=[],indices=[],n=12;
  for(const [z,w,h,y] of rings)for(let i=0;i<n;i++){const a=i/n*Math.PI*2;vertices.push(Math.cos(a)*w,Math.sin(a)*h+y,z);}
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n,c=(j+1)*n+i,d=(j+1)*n+(i+1)%n;indices.push(a,b,c,b,d,c);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;
 };
 const wing=(side)=>{
  const s=new T.Shape();s.moveTo(.55*side,-.5);s.lineTo(2.5*side,1.4);s.lineTo(2.35*side,1.8);s.lineTo(.5*side,1.1);s.closePath();
  const geo=new T.ExtrudeGeometry(s,{depth:.12,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.055,bevelThickness:.04});geo.rotateX(Math.PI/2);return geo;
 };
 for(const id of ['frame','drive','nav']){
  if(!(item ? item===id : fitted.includes(id)))continue;
  const g=new T.Group();g.name=id;ship.add(g);
  if(id==='frame'){
   add(g,shell([[-2.8,.02,.02,0],[-1.8,.47,.22,0],[-.7,.78,.34,0],[.7,.85,.38,0],[1.65,.6,.24,0],[1.8,.03,.03,0]]),white);
   add(g,shell([[-1.85,.01,.01,.18],[-1.1,.35,.25,.25],[-.35,.45,.27,.27],[.12,.32,.12,.29],[.2,.01,.01,.25]]),glass);
   for(const side of [-1,1]){
    add(g,wing(side),white,[0,-.03,0]);
    box(g,[.06,.045,1.1],[side*.61,.29,.43],dark);
    box(g,[.035,.035,.7],[side*.66,.34,.55],glow);
    const fin=box(g,[.09,.7,.8],[side*.64,.55,1.18],dark);fin.rotation.z=side*-.28;
    for(let j=0;j<4;j++)box(g,[.3,.04,.055],[side*.93,.04,.45+j*.16],dark);
   }
   box(g,[.22,.07,1.2],[0,-.32,.35],dark);
  }
  if(id==='drive')for(const side of [-1,1]){
   const pod=add(g,new T.CylinderGeometry(.24,.32,1.8,32),dark,[side*1.05,-.05,.95]);pod.rotation.x=Math.PI/2;
   const cuff=add(g,new T.CylinderGeometry(.32,.32,.28,32),silver,[side*1.05,-.05,1.72]);cuff.rotation.x=Math.PI/2;
   const nozzle=add(g,new T.TorusGeometry(.23,.065,10,32),silver,[side*1.05,-.05,1.9]);
   add(g,new T.CircleGeometry(.19,32),glow,[side*1.05,-.05,1.94]);
   const plume=add(g,new T.ConeGeometry(.17,.85,24),new T.MeshBasicMaterial({color:'#67ffe7',transparent:true,opacity:.35,depthWrite:false}),[side*1.05,-.05,2.37]);plume.rotation.x=Math.PI/2;
  }
  if(id==='nav'){
   box(g,[.45,.13,.5],[0,.48,.72],silver);
   add(g,new T.SphereGeometry(.2,24,12),glass,[0,.62,.7],[1,.6,1]);
   box(g,[.025,.55,.025],[0,.85,.9],silver);add(g,new T.SphereGeometry(.05,12,8),glow,[0,1.13,.9]);
  }
 }
 if(!item && upgrades.includes('solar')){
  const g=new T.Group();g.name='solar';ship.add(g);
  for(const side of [-1,1]){
   box(g,[2,.08,.12],[side*1.9,-.15,.4],silver);box(g,[1.5,.045,1.8],[side*2.65,-.1,.4],blue);
   for(let i=0;i<6;i++)box(g,[1.5,.012,.015],[side*2.65,-.07,-.4+i*.32],silver);
   for(let i=0;i<4;i++)box(g,[.012,.012,1.8],[side*(2+i*.42),-.07,.4],silver);
  }
 }
 if(!item && upgrades.includes('scanner')){const g=new T.Group();g.name='scanner';ship.add(g);const dish=add(g,new T.TorusGeometry(.32,.035,8,32),glow,[0,.8,.1]);dish.rotation.x=-.45;add(g,new T.OctahedronGeometry(.17),glass,[0,.8,.1]);}
 if(!ship.children.length){const g=new T.Group();g.name='assembly-guide';ship.add(g);const guide=new T.MeshBasicMaterial({color:'#418d9b',wireframe:true,transparent:true,opacity:.35});add(g,shell([[-2.8,.01,.01,0],[-.7,.78,.34,0],[1.65,.6,.24,0],[1.8,.01,.01,0]]),guide);}
 ship.userData.dispose=()=>{const mats=new Set(materials);ship.traverse(o=>{o.geometry?.dispose();if(o.material)mats.add(o.material);});mats.forEach(m=>m.dispose());};
 return ship;
}
