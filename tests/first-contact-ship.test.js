import { it, expect } from 'vitest';
import { Box3 } from 'three';
import { createShipModel } from '../src/features/universe/firstContact/shipModel.js';
it('builds only fitted modules and owned upgrades with finite renderable geometry',()=>{
 const empty=createShipModel();expect(empty.children.map(c=>c.name)).toEqual(['assembly-guide']);empty.userData.dispose();
 const ship=createShipModel({fitted:['frame','drive','nav'],upgrades:['solar','scanner'],violet:true});
 expect(ship.children.map(c=>c.name)).toEqual(['frame','drive','nav','solar','scanner']);
 let meshes=0;ship.traverse(o=>{if(o.isMesh){meshes++;expect([...o.geometry.attributes.position.array].every(Number.isFinite)).toBe(true);}});
 expect(meshes).toBeGreaterThan(30);const b=new Box3().setFromObject(ship);expect(b.max.x-b.min.x).toBeGreaterThan(6);ship.userData.dispose();
});
