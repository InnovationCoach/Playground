import React, {useState} from 'react';
import { createRoot } from 'react-dom/client';
import { ShipArt } from '../../src/features/universe/firstContact/ShipArt.jsx';
import '../../src/features/universe/firstContact/firstContact.css';
function Shipyard(){
 const [violet,setViolet]=useState(false),[upgrades,setUpgrades]=useState([]);
 return <main className="fc fc-inline"><header><span>MY UNIVERSE / DESIGN LAB</span><span>3D SHIP PREVIEW</span></header><h1>Tideglass Scout</h1><p>A modular explorer with ceramic-metal armour, a glass canopy and twin ion-drive pods. Drag the model or use the rotate buttons to inspect it.</p><ShipArt fitted={['frame','drive','nav']} upgrades={upgrades} violet={violet}/><div><button onClick={()=>setViolet(v=>!v)}>{violet?'Use pearl finish':'Use violet finish'}</button>{['solar','scanner'].map(id=><button key={id} onClick={()=>setUpgrades(u=>u.includes(id)?u.filter(x=>x!==id):[...u,id])}>{upgrades.includes(id)?'Remove':'Preview'} {id==='solar'?'solar wings':'beacon scanner'}</button>)}</div><p>Preview controls do not change your adventure inventory.</p><a href="./first-contact.html">Return to the adventure →</a></main>;
}
createRoot(document.getElementById('root')).render(<Shipyard/>);
