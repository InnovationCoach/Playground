import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, storage, auth } from './config/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import BuildPrototype from './components/SolarCar/BuildPrototype';
import TestIterate from './components/SolarCar/TestIterate';
import CompeteLeaderboard from './components/SolarCar/CompeteLeaderboard';
import { analyzePrototypeWithGemini } from './services/geminiService';
import { calculatePrototypeScore } from './utils/scoringEngine';

interface TeamPrototype {
  teamId: string;
  teamName: string;
  userId: string;
  currentVersion: number;
  components: {
    chassis: string;
    motor: string;
    battery: string;
    controller: string;
    solarPanel: string;
    additionalComponents: string[];
  };
  weight: {
    chassis: number;
    battery: number;
    motor: number;
    controller: number;
    solarPanel: number;
    additional: number;
    total: number;
  };
  specs: {
    dragCoefficient?: number;
    solarCoverage?: number;
    weightBalance?: string;
    aerodynamicRating?: string;
  };
  images: Array<{
    iteration: number;
    url: string;
    timestamp: number;
    aiAnalysis?: {
      aerodynamics: string;
      dragCoefficient: number;
      solarCoverage: number;
      weightBalance: string;
      suggestions: string[];
    };
  }>;
  score?: {
    efficiency: number;
    aerodynamics: number;
    innovation: number;
    speed: number;
    total: number;
  };
  createdAt: number;
  lastUpdated: number;
}

const COMPONENT_DATABASE = {
  chassis: [
    { id: 'aluminum_frame', name: 'Aluminum Frame', weight: 1800, dragFactor: 0.05, cost: 45 },
    { id: 'carbon_tube', name: 'Carbon Fiber Tube', weight: 900, dragFactor: 0.03, cost: 120 },
    { id: 'steel_frame', name: 'Steel Frame', weight: 2200, dragFactor: 0.08, cost: 25 },
  ],
  motor: [
    { id: 'brushed_dc', name: 'Brushed DC Motor', weight: 450, powerOutput: 50, cost: 35 },
    { id: 'bldc', name: 'BLDC Motor', weight: 350, powerOutput: 75, cost: 85 },
    { id: 'geared_motor', name: 'Geared Motor', weight: 550, powerOutput: 100, cost: 65 },
  ],
  battery: [
    { id: 'li_18650_2x', name: 'Li-ion 2×18650', weight: 600, capacity: 4400, cost: 25 },
    { id: 'li_poly_3s', name: 'LiPo 3S 2200mAh', weight: 420, capacity: 7920, cost: 40 },
    { id: 'li_ion_pack', name: 'Li-ion Pack 48V', weight: 1200, capacity: 24000, cost: 120 },
  ],
  controller: [
    { id: 'arduino_nano', name: 'Arduino Nano', weight: 7, cost: 12 },
    { id: 'esp32', name: 'ESP32', weight: 8, cost: 18 },
    { id: 'stm32_board', name: 'STM32 Board', weight: 10, cost: 25 },
  ],
  solarPanel: [
    { id: 'solar_20w', name: '20W Top-Mounted', weight: 300, powerOutput: 20, dragFactor: 0.08, cost: 60 },
    { id: 'solar_30w', name: '30W Top-Mounted', weight: 480, powerOutput: 30, dragFactor: 0.12, cost: 90 },
    { id: 'solar_50w', name: '50W Hood-Wrapped', weight: 650, powerOutput: 50, dragFactor: 0.18, cost: 150 },
  ],
  additional: [
    { id: 'mosfet_driver', name: 'MOSFET H-Bridge', weight: 45, cost: 15 },
    { id: 'voltage_reg', name: 'Voltage Regulator', weight: 12, cost: 5 },
    { id: 'relay_module', name: 'Relay Module', weight: 32, cost: 8 },
    { id: 'gps_module', name: 'GPS Module', weight: 18, cost: 25 },
    { id: 'current_sensor', name: 'Current Sensor', weight: 6, cost: 10 },
    { id: 'led_display', name: 'LED Display', weight: 50, cost: 20 },
  ],
};

const SolarCarActivity: React.FC = () => {
  const [user] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState<'build' | 'test' | 'compete'>('build');
  const [teamData, setTeamData] = useState<TeamPrototype | null>(null);
  const [loading, setLoading] = useState(true);
  const [allTeams, setAllTeams] = useState<TeamPrototype[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load team data
  useEffect(() => {
    if (!user) return;

    const loadTeamData = async () => {
      try {
        const q = query(
          collection(db, 'solarCar_prototypes'),
          where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          if (!querySnapshot.empty) {
            setTeamData(querySnapshot.docs[0].data() as TeamPrototype);
          } else {
            // Create initial prototype document
            const newTeam: TeamPrototype = {
              teamId: `team_${user.uid}_${Date.now()}`,
              teamName: `Team ${user.displayName || user.email}`,
              userId: user.uid,
              currentVersion: 1,
              components: {
                chassis: 'aluminum_frame',
                motor: 'brushed_dc',
                battery: 'li_18650_2x',
                controller: 'arduino_nano',
                solarPanel: 'solar_30w',
                additionalComponents: [],
              },
              weight: {
                chassis: 1800,
                battery: 600,
                motor: 450,
                controller: 7,
                solarPanel: 480,
                additional: 0,
                total: 3337,
              },
              specs: {},
              images: [],
              createdAt: Date.now(),
              lastUpdated: Date.now(),
            };

            await setDoc(
              doc(db, 'solarCar_prototypes', user.uid),
              newTeam
            );
            setTeamData(newTeam);
          }
        });

        return unsubscribe;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load team data');
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = loadTeamData();
    return () => {
      unsubscribe?.then(unsub => unsub?.());
    };
  }, [user]);

  // Load leaderboard data
  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'solarCar_prototypes'));
        const teams = snapshot.docs.map(doc => doc.data() as TeamPrototype);
        setAllTeams(teams.sort((a, b) => (b.score?.total || 0) - (a.score?.total || 0)));
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      }
    };

    loadLeaderboard();
  }, []);

  const handleComponentChange = async (category: string, componentId: string) => {
    if (!teamData || !user) return;

    try {
      const component = COMPONENT_DATABASE[category as keyof typeof COMPONENT_DATABASE].find(
        c => c.id === componentId
      );

      if (!component) return;

      const updatedComponents = { ...teamData.components, [category]: componentId };
      const updatedWeight = calculateTotalWeight(updatedComponents);
      const newVersion = teamData.currentVersion + 1;

      const updates = {
        components: updatedComponents,
        weight: updatedWeight,
        currentVersion: newVersion,
        lastUpdated: Date.now(),
      };

      await updateDoc(doc(db, 'solarCar_prototypes', user.uid), updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update components');
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!teamData || !user) return;

    try {
      const storageRef = ref(storage, `solarCar/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      // Analyze image with Gemini
      const aiAnalysis = await analyzePrototypeWithGemini(imageUrl);

      // Update team data with image and analysis
      const newImage = {
        iteration: teamData.currentVersion,
        url: imageUrl,
        timestamp: Date.now(),
        aiAnalysis,
      };

      const updatedImages = [...teamData.images, newImage];

      // Calculate new score
      const newScore = calculatePrototypeScore(teamData, aiAnalysis);

      await updateDoc(doc(db, 'solarCar_prototypes', user.uid), {
        images: updatedImages,
        specs: {
          dragCoefficient: aiAnalysis.dragCoefficient,
          solarCoverage: aiAnalysis.solarCoverage,
          weightBalance: aiAnalysis.weightBalance,
          aerodynamicRating: aiAnalysis.aerodynamics,
        },
        score: newScore,
        lastUpdated: Date.now(),
      });

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload and analyze image');
    }
  };

  const calculateTotalWeight = (components: TeamPrototype['components']): TeamPrototype['weight'] => {
    let total = 0;
    const weights: TeamPrototype['weight'] = {
      chassis: 0,
      battery: 0,
      motor: 0,
      controller: 0,
      solarPanel: 0,
      additional: 0,
      total: 0,
    };

    const chassisComponent = COMPONENT_DATABASE.chassis.find(c => c.id === components.chassis);
    if (chassisComponent) {
      weights.chassis = chassisComponent.weight;
      total += chassisComponent.weight;
    }

    const motorComponent = COMPONENT_DATABASE.motor.find(c => c.id === components.motor);
    if (motorComponent) {
      weights.motor = motorComponent.weight;
      total += motorComponent.weight;
    }

    const batteryComponent = COMPONENT_DATABASE.battery.find(c => c.id === components.battery);
    if (batteryComponent) {
      weights.battery = batteryComponent.weight;
      total += batteryComponent.weight;
    }

    const controllerComponent = COMPONENT_DATABASE.controller.find(c => c.id === components.controller);
    if (controllerComponent) {
      weights.controller = controllerComponent.weight;
      total += controllerComponent.weight;
    }

    const solarComponent = COMPONENT_DATABASE.solarPanel.find(c => c.id === components.solarPanel);
    if (solarComponent) {
      weights.solarPanel = solarComponent.weight;
      total += solarComponent.weight;
    }

    if (components.additionalComponents.length > 0) {
      components.additionalComponents.forEach(compId => {
        const additional = COMPONENT_DATABASE.additional.find(c => c.id === compId);
        if (additional) {
          weights.additional += additional.weight;
          total += additional.weight;
        }
      });
    }

    weights.total = total;
    return weights;
  };

  if (loading) {
    return <div className="p-8 text-center">Loading your Solar Car Challenge...</div>;
  }

  if (!teamData) {
    return <div className="p-8 text-center text-red-500">Failed to load team data</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">☀️</span>
              <div>
                <h1 className="text-3xl font-bold text-white">Solar Car Challenge</h1>
                <p className="text-slate-400">{teamData.teamName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Version {teamData.currentVersion}</p>
              <p className="text-lg font-bold text-amber-400">{teamData.weight.total}g</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 border-t border-slate-700 pt-4">
            <button
              onClick={() => setActiveTab('build')}
              className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
                activeTab === 'build'
                  ? 'bg-amber-500 text-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              ⚙️ Build Prototype
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
                activeTab === 'test'
                  ? 'bg-amber-500 text-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🧪 Test & Iterate
            </button>
            <button
              onClick={() => setActiveTab('compete')}
              className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
                activeTab === 'compete'
                  ? 'bg-amber-500 text-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🏆 Compete
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg m-4">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'build' && (
          <BuildPrototype
            teamData={teamData}
            componentDatabase={COMPONENT_DATABASE}
            onComponentChange={handleComponentChange}
          />
        )}

        {activeTab === 'test' && (
          <TestIterate
            teamData={teamData}
            onImageUpload={handleImageUpload}
            isLoading={loading}
          />
        )}

        {activeTab === 'compete' && (
          <CompeteLeaderboard
            teamData={teamData}
            allTeams={allTeams}
          />
        )}
      </div>
    </div>
  );
};

export default SolarCarActivity;
