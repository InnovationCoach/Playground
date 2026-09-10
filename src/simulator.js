import { 
  db, 
  auth, 
  collection, 
  addDoc, 
  getDocs, 
  serverTimestamp 
} from "./firebase.js";

/**
 * Calculate Urban Heat Mitigation results based on Townsville simulation model
 * (Tavares et al. 2025: Green roofs, Street trees, Water features, Cool walls)
 */
export function calculateSimulatedHeat({ roofs = 0, trees = 0, water = 0, walls = 0, budget = 500000 }) {
  // Cooling effects (°C)
  const roofCooling = (roofs / 100) * 3.5;  // Green Roofs: up to -3.5°C
  const treeCooling = (trees / 100) * 2.5;  // Street Trees: up to -2.5°C
  const waterCooling = (water / 100) * 1.8; // Water Features: up to -1.8°C
  const wallCooling = (walls / 100) * 1.2;  // Cool Walls: up to -1.2°C

  const totalCooling = roofCooling + treeCooling + waterCooling + wallCooling;
  const simulatedTemp = 36.5 - totalCooling; // Base peak temp 36.5°C in tropical climate

  // Cost estimates ($)
  const roofCost = roofs * 2500;
  const treeCost = trees * 1500;
  const waterCost = water * 3000;
  const wallCost = walls * 1000;
  const totalCost = roofCost + treeCost + waterCost + wallCost;

  const costMillions = totalCost / 1000000;
  const efficiency = costMillions > 0 ? Number((totalCooling / Math.max(costMillions, 0.1)).toFixed(2)) : 0;
  const isWithinBudget = totalCost <= budget;

  return {
    simulatedTemp: Number(simulatedTemp.toFixed(2)),
    totalCooling: Number(totalCooling.toFixed(2)),
    totalCost,
    efficiency,
    isWithinBudget
  };
}

/**
 * Submit simulation score to Firestore 'leaderboard' collection
 */
export async function submitLeaderboardScore({ studentName, score, efficiency, strategy }) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("You must be logged in (or anonymous guest) to submit a score.");
  }

  const leaderboardRef = collection(db, "leaderboard");
  const docRef = await addDoc(leaderboardRef, {
    userId: currentUser.uid,
    studentName: studentName || "Anonymous Student",
    score: Number(score),
    efficiency: Number(efficiency),
    strategy: strategy || "Balanced Urban Heat Mitigation",
    createdAt: serverTimestamp()
  });

  return docRef.id;
}

/**
 * Fetch leaderboard submissions from Firestore
 */
export async function fetchLeaderboard() {
  const leaderboardRef = collection(db, "leaderboard");
  const snapshot = await getDocs(leaderboardRef);
  const entries = [];
  snapshot.forEach((docSnap) => {
    entries.push({ id: docSnap.id, ...docSnap.data() });
  });

  // Sort by efficiency descending
  return entries.sort((a, b) => (b.efficiency || 0) - (a.efficiency || 0));
}
