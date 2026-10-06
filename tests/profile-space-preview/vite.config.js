import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
const path=p=>fileURLToPath(new URL(p,import.meta.url));
export default defineConfig({root:path('./'),plugins:[react(),{name:'local-personalization-fixtures',enforce:'pre',resolveId(id){if(id.endsWith('/usePersonalization.js')||id==='./usePersonalization.js')return path('./fixtureSpace.js');if(id.endsWith('/apiClient.js'))return path('./fixtureApi.js');}}],server:{host:'127.0.0.1',port:5190,strictPort:true,fs:{allow:[path('../../')]}}});
