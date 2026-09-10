import React, { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import {
  collection,
  query,
  getDocs,
  updateDoc,
  doc,
  where,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

interface TeamData {
  teamId: string;
  teamName: string;
  userId: string;
  currentVersion: number;
  weight: { total: number };
  score?: { total: number };
  images: Array<{ timestamp: number; aiAnalysis?: any }>;
  specs: any;
}

const TeacherDashboard: React.FC = () => {
  const [user] = useAuthState(auth);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedTeam, setSelectedTeam] = useState<TeamData | null>(null);

  // Load all teams for this teacher's class
  useEffect(() => {
    if (!user) return;

    const loadTeams = async () => {
      try {
        const snapshot = await getDocs(
          collection(db, 'solarCar_prototypes')
        );

        const teamsData = snapshot.docs.map(doc => doc.data() as TeamData);
        setTeams(teamsData.sort((a, b) => (b.score?.total || 0) - (a.score?.total || 0)));
      } catch (error) {
        console.error('Failed to load teams:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, [user]);

  const filteredTeams = teams.filter(team => {
    if (filterMode === 'active') return team.images.length === 0;
    if (filterMode === 'completed') return team.images.length > 0 && team.score;
    return true;
  });

  const stats = {
    totalTeams: teams.length,
    avgScore: Math.round(teams.reduce((sum, t) => sum + (t.score?.total || 0), 0) / teams.length),
    avgIterations: Math.round(teams.reduce((sum, t) => sum + t.currentVersion, 0) / teams.length),
    avgWeight: Math.round(teams.reduce((sum, t) => sum + t.weight.total, 0) / teams.length / 1000 * 10) / 10,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-white mb-2">☀️ Teacher Dashboard</h1>
          <p className="text-slate-400">Monitor student solar car prototypes and provide feedback</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-lg border border-blue-600 p-6">
            <p className="text-slate-400 text-sm font-semibold mb-2">Total Teams</p>
            <p className="text-3xl font-bold text-white">{stats.totalTeams}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-900/50 to-orange-900/50 rounded-lg border border-amber-600 p-6">
            <p className="text-slate-400 text-sm font-semibold mb-2">Avg Score</p>
            <p className="text-3xl font-bold text-amber-400">{stats.avgScore}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-lg border border-purple-600 p-6">
            <p className="text-slate-400 text-sm font-semibold mb-2">Avg Iterations</p>
            <p className="text-3xl font-bold text-purple-400">{stats.avgIterations}</p>
          </div>
          <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-lg border border-green-600 p-6">
            <p className="text-slate-400 text-sm font-semibold mb-2">Avg Weight</p>
            <p className="text-3xl font-bold text-green-400">{stats.avgWeight}kg</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filterMode === 'all'
                ? 'bg-white text-black'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            All Teams ({teams.length})
          </button>
          <button
            onClick={() => setFilterMode('active')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filterMode === 'active'
                ? 'bg-white text-black'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            In Progress ({teams.filter(t => t.images.length === 0).length})
          </button>
          <button
            onClick={() => setFilterMode('completed')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filterMode === 'completed'
                ? 'bg-white text-black'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Completed ({teams.filter(t => t.images.length > 0 && t.score).length})
          </button>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map(team => (
            <div
              key={team.teamId}
              onClick={() => setSelectedTeam(team)}
              className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 cursor-pointer hover:bg-slate-700 hover:border-slate-500 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg">{team.teamName}</h3>
                  <p className="text-xs text-slate-400">ID: {team.teamId.slice(0, 12)}...</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-amber-400">{team.score?.total || 0}</p>
                  <p className="text-xs text-slate-400">Score</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-slate-400 text-xs">Iterations</p>
                  <p className="text-white font-semibold">{team.currentVersion}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Weight</p>
                  <p className="text-white font-semibold">{(team.weight.total / 1000).toFixed(2)}kg</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Drag Coeff.</p>
                  <p className="text-white font-semibold">
                    {team.specs?.dragCoefficient?.toFixed(2) || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Images</p>
                  <p className="text-white font-semibold">{team.images.length}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                  {team.images.length === 0 ? '🔨 Building' : '✅ Completed'}
                </span>
                {team.specs?.aerodynamicRating && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    team.specs.aerodynamicRating === 'excellent'
                      ? 'bg-green-600 text-white'
                      : team.specs.aerodynamicRating === 'good'
                      ? 'bg-blue-600 text-white'
                      : 'bg-yellow-600 text-white'
                  }`}>
                    {team.specs.aerodynamicRating.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Team Details Modal */}
        {selectedTeam && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-xl border border-slate-600 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-slate-800 border-b border-slate-600 px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedTeam.teamName}</h2>
                  <p className="text-slate-400 text-sm">Detailed Team Analysis</p>
                </div>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Overview */}
                <div className="bg-slate-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">📊 Overview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm">Total Score</p>
                      <p className="text-2xl font-bold text-amber-400">{selectedTeam.score?.total || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Iterations</p>
                      <p className="text-2xl font-bold text-white">{selectedTeam.currentVersion}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Weight</p>
                      <p className="text-2xl font-bold text-white">{(selectedTeam.weight.total / 1000).toFixed(2)}kg</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Images Uploaded</p>
                      <p className="text-2xl font-bold text-white">{selectedTeam.images.length}</p>
                    </div>
                  </div>
                </div>

                {/* AI Analysis Results */}
                {selectedTeam.images.length > 0 && selectedTeam.images[selectedTeam.images.length - 1].aiAnalysis && (
                  <div className="bg-slate-700/50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-white mb-4">🤖 Latest AI Analysis</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400 text-sm">Aerodynamics</p>
                        <p className="text-lg font-bold capitalize text-green-400">
                          {selectedTeam.images[selectedTeam.images.length - 1].aiAnalysis.aerodynamics}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Drag Coefficient</p>
                        <p className="text-lg font-bold text-cyan-400">
                          {selectedTeam.images[selectedTeam.images.length - 1].aiAnalysis.dragCoefficient.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Solar Coverage</p>
                        <p className="text-lg font-bold text-amber-400">
                          {selectedTeam.images[selectedTeam.images.length - 1].aiAnalysis.solarCoverage}%
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Weight Balance</p>
                        <p className="text-lg font-bold capitalize text-blue-400">
                          {selectedTeam.images[selectedTeam.images.length - 1].aiAnalysis.weightBalance}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Score Breakdown */}
                {selectedTeam.score && (
                  <div className="bg-slate-700/50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-white mb-4">🏆 Score Breakdown</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-300">Efficiency</span>
                          <span className="font-bold text-amber-400">{selectedTeam.score.efficiency}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500"
                            style={{ width: `${Math.min((selectedTeam.score.efficiency / 250) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-300">Aerodynamics</span>
                          <span className="font-bold text-cyan-400">{selectedTeam.score.aerodynamics}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500"
                            style={{ width: `${Math.min((selectedTeam.score.aerodynamics / 150) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-300">Innovation</span>
                          <span className="font-bold text-purple-400">{selectedTeam.score.innovation}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500"
                            style={{ width: `${Math.min((selectedTeam.score.innovation / 100) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-300">Speed Bonus</span>
                          <span className="font-bold text-green-400">{selectedTeam.score.speed}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${Math.min((selectedTeam.score.speed / 50) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Prototype Images */}
                {selectedTeam.images.length > 0 && (
                  <div className="bg-slate-700/50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-white mb-4">📸 Prototype Images</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedTeam.images.map((image, idx) => (
                        <img
                          key={idx}
                          src={image.url}
                          alt={`Iteration ${image.timestamp}`}
                          className="w-full h-32 object-cover rounded-lg border border-slate-600"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback Section */}
                <div className="bg-slate-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">💬 Teacher Feedback</h3>
                  <textarea
                    placeholder="Add personalized feedback for this team..."
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                    rows={4}
                  />
                  <button className="mt-3 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                    Save Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
