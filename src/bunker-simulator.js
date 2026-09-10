import { 
  db, 
  auth, 
  collection, 
  addDoc, 
  getDocs, 
  serverTimestamp 
} from "./firebase.js";

/**
 * Climate Hazard Profiles
 */
export const HAZARD_PROFILES = {
  heatwave: {
    name: "☀️ Deadly 50°C Heatwave & Power Grid Collapse",
    description: "Sustained extreme temperatures exceeding 50°C with severe thermal radiation, causing total electrical grid overload and outdoor heat stroke risk within 15 minutes.",
    exteriorTemp: 50,
    aqiRisk: "High Thermal Stress",
    floodRisk: "Low",
    keyDefense: "Geothermal / Hybrid HVAC & Deep Underground Insulation"
  },
  hypercane: {
    name: "🌀 Category 5+ Hypercane & Storm Surge",
    description: "Sustained 195 mph (314 km/h) destructive winds accompanied by a 6-meter coastal storm surge and catastrophic structural debris impact.",
    exteriorTemp: 28,
    aqiRisk: "Debris & Pressure Drops",
    floodRisk: "Extreme",
    keyDefense: "Hydro-Sealed Reinforced Vault & Heavy Duty Blast Doors"
  },
  wildfire: {
    name: "🌲 Toxic Wildfire Firestorm (AQI 999+)",
    description: "Uncontrolled mega-wildfire producing extreme radiant heat (400°C exterior pulse) and hazardous carbon monoxide/particulate toxic air (AQI > 999).",
    exteriorTemp: 45,
    aqiRisk: "Severe Toxins / CO / Ash",
    floodRisk: "Low",
    keyDefense: "Positive Pressure NBC Air Scrubber & Thermal Retardant Hull"
  },
  flood: {
    name: "🌊 Mega-Flash Flood & Silt Mudslide",
    description: "Torrential atmospheric river delivering 500mm rainfall in 12 hours, driving rapid soil erosion, massive hydrostatic pressure, and heavy water ingress.",
    exteriorTemp: 22,
    aqiRisk: "Mold & Humidity",
    floodRisk: "Catastrophic",
    keyDefense: "Hydro-Sealed Deep Vault & Marine Airlock Blast Seals"
  }
};

/**
 * Calculate Bunker Survival Metrics based on Bomb Shelter Supply pricing and engineering models
 */
export function calculateBunkerSurvival({
  hazard = "heatwave",
  hull = 1,      // 1: Steel ($25k), 2: Concrete ($65k), 3: Deep Vault ($120k)
  air = 1,       // 1: HEPA ($4.5k), 2: NBC ($14.5k), 3: Closed-Loop ($32k)
  water = 1,     // 1: Tanks ($3.5k), 2: Water Gen & Well ($18.5k)
  food = 1,      // 1: 30-Day ($3k), 2: 180-Day ($12k), 3: 365-Day ($24k)
  energy = 1,    // 1: Solar ($12k), 2: Solar-Diesel ($28k), 3: Geothermal ($45k)
  seals = 1,     // 1: Standard Marine ($5k), 2: Heavy Blast/Water Seals ($18k)
  budget = 250000
}) {
  const sitePrepCost = 15000; // Base excavation & underground installation fee

  const hullCosts = [0, 25000, 65000, 120000];
  const airCosts = [0, 4500, 14500, 32000];
  const waterCosts = [0, 3500, 18500];
  const foodCosts = [0, 3000, 12000, 24000];
  const energyCosts = [0, 12000, 28000, 45000];
  const sealsCosts = [0, 5000, 18000];

  const totalCost = sitePrepCost + 
    (hullCosts[hull] || 25000) + 
    (airCosts[air] || 4500) + 
    (waterCosts[water] || 3500) + 
    (foodCosts[food] || 3000) + 
    (energyCosts[energy] || 12000) + 
    (sealsCosts[seals] || 5000);

  // Days calculations
  const foodDaysMap = [0, 30, 180, 365];
  const foodDays = foodDaysMap[food] || 30;

  const waterDaysMap = [0, 45, 365];
  const waterDays = waterDaysMap[water] || 45;

  let energyDays = 60;
  if (energy === 1) { // Solar
    energyDays = hazard === "wildfire" || hazard === "hypercane" ? 20 : 90; // Smoke/clouds cut solar
  } else if (energy === 2) { // Hybrid Diesel
    energyDays = 180;
  } else if (energy === 3) { // Geothermal
    energyDays = 365;
  }

  // Base Max Days bounded by primary limiting resource
  let maxAutonomousDays = Math.min(foodDays, waterDays, energyDays);

  // Structural & Air Resilience calculation (%)
  let resilienceScore = 40; // Base rating

  // Hull bonuses
  if (hull === 2) resilienceScore += 25; // Concrete
  if (hull === 3) resilienceScore += 45; // Deep Vault

  // Air filtration bonuses against hazard
  if (hazard === "wildfire") {
    if (air === 1) resilienceScore -= 20; // HEPA chokes on CO/toxins
    if (air === 2) resilienceScore += 20; // NBC
    if (air === 3) resilienceScore += 35; // Closed loop
  } else {
    if (air >= 2) resilienceScore += 10;
  }

  // Flood & Blast seals bonus
  if (hazard === "hypercane" || hazard === "flood") {
    if (seals === 2) resilienceScore += 30; // Heavy Blast / Flood seals
    else resilienceScore -= 25; // Marine doors fail under heavy hydrostatic pressure
  } else {
    if (seals === 2) resilienceScore += 10;
  }

  // Heatwave HVAC check
  if (hazard === "heatwave") {
    if (energy === 3) resilienceScore += 20; // Geothermal handles extreme exterior heat
    else if (energy === 1) resilienceScore -= 15; // Solar efficiency drops in high thermal ambient
  }

  // Clamp resilience 5% to 99%
  resilienceScore = Math.min(Math.max(resilienceScore, 5), 99);

  // Final Days adjusted by resilience
  const actualSurvivalDays = Math.round(maxAutonomousDays * (resilienceScore / 100));

  // Habitability & Thermal Comfort
  let internalTemp = 22; // ideal °C
  if (hazard === "heatwave") {
    internalTemp = energy === 3 ? 21 : energy === 2 ? 24 : 33;
  } else if (hazard === "wildfire") {
    internalTemp = hull === 3 ? 22 : 29;
  }

  let indoorAQI = "Good (0-50)";
  if (air === 1 && hazard === "wildfire") indoorAQI = "Unhealthy (180+)";
  if (air >= 2) indoorAQI = "Purified Clean Air (10-25)";

  // Overall Survival Score (0-100)
  const daysComponent = Math.min((actualSurvivalDays / 365) * 40, 40);
  const resilienceComponent = (resilienceScore / 100) * 40;
  const budgetBonus = totalCost <= budget ? 20 : Math.max(0, 20 - Math.round(((totalCost - budget) / 10000) * 5));

  const survivalScore = Math.round(daysComponent + resilienceComponent + budgetBonus);

  // Efficiency Rating: (Survival Days * (Resilience/100)) / (Cost in $10k)
  const costUnits = totalCost / 10000;
  const efficiency = Number(((actualSurvivalDays * (resilienceScore / 100)) / costUnits).toFixed(2));

  return {
    totalCost,
    isWithinBudget: totalCost <= budget,
    budget,
    survivalDays: actualSurvivalDays,
    maxAutonomousDays,
    resilienceScore,
    internalTemp,
    indoorAQI,
    survivalScore,
    efficiency,
    limitingFactor: foodDays <= waterDays && foodDays <= energyDays ? "Food Stockpile" :
                    waterDays <= foodDays && waterDays <= energyDays ? "Water Supply System" : "Energy / HVAC Autonomy"
  };
}

/**
 * Submit score to Firestore 'bunker_leaderboard'
 */
export async function submitBunkerScore({ commanderName, bunkerName, survivalDays, survivalScore, efficiency, totalCost, hazard }) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("You must be signed in (or an anonymous guest) to submit your bunker design.");
  }

  const ref = collection(db, "bunker_leaderboard");
  const docRef = await addDoc(ref, {
    userId: currentUser.uid,
    commanderName: commanderName || "Commander Student",
    bunkerName: bunkerName || "Vault 101",
    survivalDays: Number(survivalDays),
    survivalScore: Number(survivalScore),
    efficiency: Number(efficiency),
    totalCost: Number(totalCost),
    hazard: hazard || "heatwave",
    createdAt: serverTimestamp()
  });

  return docRef.id;
}

/**
 * Fetch leaderboard from Firestore 'bunker_leaderboard'
 */
export async function fetchBunkerLeaderboard() {
  const ref = collection(db, "bunker_leaderboard");
  const snapshot = await getDocs(ref);
  const entries = [];
  snapshot.forEach((docSnap) => {
    entries.push({ id: docSnap.id, ...docSnap.data() });
  });

  return entries.sort((a, b) => (b.efficiency || 0) - (a.efficiency || 0));
}
