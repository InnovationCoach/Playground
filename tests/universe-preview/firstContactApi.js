import { createAdapter } from '../../server/lib/ai/gemini.js';
import { validGrade, gradeLevel } from '../../src/features/universe/firstContact/curriculum.js';
import { validatePractice } from '../../src/features/universe/firstContact/expeditions.js';

// Local authoring bridge only. Keys are process environment values and never enter Vite's client bundle.
export function firstContactApi({ apiKey = process.env.GEMINI_API_KEY, model = process.env.GEMINI_MODEL } = {}) {
 let busy = false, last = 0;
 return { name:'first-contact-local-gemini', configureServer(server) {
  server.middlewares.use(async(req,res,next)=>{
   if(req.url !== '/__first_contact/generate') return next();
   const send=(status,value)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(value));};
   const host=req.headers.host;
   if(!/^127\.0\.0\.1:\d+$/.test(host || '') || (req.headers.origin && req.headers.origin !== `http://${host}`)) return send(403,{error:'Local preview only'});
   if(req.method !== 'POST') return send(405,{error:'POST required'});
   if(!apiKey || !model) return send(503,{error:'Configure GEMINI_API_KEY and GEMINI_MODEL on the preview process.'});
   if(busy || Date.now()-last<10000) return send(429,{error:'Please wait before generating another mission.'});
   busy=true;last=Date.now();
   try{
    let body='';for await(const chunk of req){body+=chunk;if(body.length>1000)return send(413,{error:'Request too large'});}
    let input;try{input=JSON.parse(body);}catch{return send(400,{error:'Invalid request'});}
    if(!input || !validGrade(input.grade) || Object.keys(input).some(k=>k!=='grade')) return send(400,{error:'Invalid request'});
    const adapter=createAdapter({apiKey,model});
    const level=gradeLevel(input.grade);
    const result=await adapter.complete({system:'Create a fictional STEAM engineering energy-budget practice dataset. Return only JSON: title (3–80 characters), story (10–400 characters), power (integer 10–100 W), hours (integer 1–8), efficiency (integer percent 50–100), uncertainty (integer W from 0 to power minus 1). Keep numbers out of the story; the app displays them. No personal questions, URLs, factual claims, rewards, standards IDs or answers. The app assigns the standard and computes energy. Do not claim full NGSS mastery.',user:`Grade band level ${level}. ${level===0?'Use efficiency 100 and uncertainty 0.':level===1?'Use efficiency below 100 and uncertainty 0.':'Use efficiency below 100 and uncertainty above 0; compute conservative energy.'} Context: choosing equipment for a fictional workshop under an energy constraint.`},{maxOutputTokens:1000});
    let candidate;try{candidate=validatePractice(JSON.parse(result.text),input.grade);}catch{}
    if(!candidate)return send(502,{error:'Mission did not pass validation'});
    send(200,candidate);
   }catch{send(502,{error:'Gemini is unavailable; offline missions remain available.'});}finally{busy=false;}
  });
 }};
}
