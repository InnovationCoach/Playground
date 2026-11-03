// Structured, bounded simulation settings. Never execute coach-provided code.
export function validateSimulation(value) {
  if (value == null) return null;
  const text = (key, max) => {
    if (typeof value[key] !== 'string' || !value[key].trim() || value[key].length > max) throw new Error(`Simulation ${key} is required (up to ${max} characters).`);
    return value[key].trim();
  };
  if (value.kind !== 'resource-lab') throw new Error('Choose the supported resource simulation.');
  const result = {kind:'resource-lab', title:text('title',200), question:text('question',1000), resource:text('resource',60), unit:text('unit',30), reflection:text('reflection',1000)};
  for (const [key,min,max] of [['demand',1,10000],['capacity',1,10000],['cost',1,1000],['budget',1,100000]]) {
    if (!Number.isFinite(value[key]) || value[key]<min || value[key]>max) throw new Error(`Simulation ${key} is outside its allowed range.`);
    result[key]=value[key];
  }
  return result;
}
export function simulationFromPrompt(prompt) {
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length>2000) throw new Error('Describe your challenge in 1–2000 characters.');
  const water=/water|rain|irrigation/i.test(prompt);
  return validateSimulation({kind:'resource-lab',title:water?'Water resilience lab':'Clean energy design lab',question:prompt.trim(),resource:water?'Water collected':'Energy supplied',unit:water?'litres':'kWh',demand:100,capacity:10,cost:20,budget:200,reflection:'Which design met the need within budget? Explain your evidence and one limitation of this model.'});
}
export function runSimulation(settings, units, efficiency) {
  const count=Math.min(30,Math.max(0,Number(units)||0));
  const percent=Math.min(100,Math.max(10,Number(efficiency)||10));
  const supplied=Math.round(count*settings.capacity*percent)/100;
  const cost=count*settings.cost;
  return {supplied,cost,unmet:Math.max(0,settings.demand-supplied),success:supplied>=settings.demand&&cost<=settings.budget};
}
