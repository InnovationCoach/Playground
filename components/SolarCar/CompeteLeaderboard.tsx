import React, { useMemo } from 'react';

interface CompeteLeaderboardProps {
  teamData: any;
  allTeams: any[];
}

const CompeteLeaderboard: React.FC<CompeteLeaderboardProps> = ({ teamData, allTeams }) => {
  const sortedTeams = useMemo(() => {
    return [...allTeams].sort((a, b) => {
      const scoreA = a.score?.total || 0;
      const scoreB = b.score?.total || 0;
      return scoreB - scoreA;
    });
  }, [allTeams]);

  const userRank = useMemo(() => {
    return sortedTeams.findIndex(t => t.teamId === teamData.teamId) + 1;
  }, [sortedTeams, teamData]);

  const userScore = teamData.score;

  return (
    <div className="space-y-8">
      {/* Your Score Summary */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-8 text-white">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm font-semibold opacity-80 mb-2">YOUR CURRENT SCORE</p>
            <p className="text-5xl font-bold">{userScore?.total || 0}</p>
            <p className="text-sm opacity-80 mt-2">Points</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">#{userRank}</p>
            <p className="text-sm opacity-80">Rank</p>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-xs opacity-80 mb-1">Efficiency</p>
            <p className="text-2xl font-bold">{userScore?.efficiency || 0}</p>
            <p className="text-xs opacity-60">/ 250</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-xs opacity-80 mb-1">Aerodynamics</p>
            <p className="text-2xl font-bold">{userScore?.aerodynamics || 0}</p>
            <p className="text-xs opacity-60">/ 150</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-xs opacity-80 mb-1">Innovation</p>
            <p className="text-2xl font-bold">{userScore?.innovation || 0}</p>
            <p className="text-xs opacity-60">/ 100</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-xs opacity-80 mb-1">Speed Bonus</p>
            <p className="text-2xl font-bold">{userScore?.speed || 0}</p>
            <p className="text-xs opacity-60">/ 50</p>
          </div>
        </div>
      </div>

      {/* Scoring Explanation */}
      <div className="bg-slate-700/50 rounded-xl border border-slate-600 p-6">
        <h3 className="text-xl font-bold text-white mb-4">📊 Scoring Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-amber-400 font-semibold mb-2">⚖️ Efficiency (0–250 pts)</h4>
            <p className="text-slate-300 text-sm">
              Power output ÷ total weight. Minimize weight, maximize solar coverage to boost this score.
            </p>
          </div>
          <div>
            <h4 className="text-cyan-400 font-semibold mb-2">🎯 Aerodynamics (0–150 pts)</h4>
            <p className="text-slate-300 text-sm">
              Drag coefficient from AI analysis. Target &lt;0.15 to achieve full points.
            </p>
          </div>
          <div>
            <h4 className="text-purple-400 font-semibold mb-2">💡 Innovation (0–100 pts)</h4>
            <p className="text-slate-300 text-sm">
              Based on iteration count (3+ rounds) and novel component choices. Experimentation pays off.
            </p>
          </div>
          <div>
            <h4 className="text-green-400 font-semibold mb-2">⚡ Speed Bonus (0–50 pts)</h4>
            <p className="text-slate-300 text-sm">
              Bonus for completing within the time limit. Fast decisions can still score high overall.
            </p>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-4">🏆 Live Leaderboard</h3>
        <div className="bg-slate-700/50 rounded-xl overflow-hidden border border-slate-600">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800 border-b border-slate-600">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Rank</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Team</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Weight</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Efficiency</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Drag</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Total Score</th>
              </tr>
            </thead>
            <tbody>
              {sortedTeams.map((team, idx) => {
                const isUserTeam = team.teamId === teamData.teamId;
                return (
                  <tr
                    key={team.teamId}
                    className={`border-b border-slate-600 transition-colors ${
                      isUserTeam
                        ? 'bg-amber-500/10 hover:bg-amber-500/20'
                        : 'hover:bg-slate-700/50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '#'}
                        </span>
                        <span className="font-bold text-white">{idx + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-white">{team.teamName}</p>
                        <p className="text-xs text-slate-400">
                          {team.currentVersion} iterations
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="font-semibold text-slate-300">
                        {(team.weight?.total || 0) / 1000}kg
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="font-semibold text-amber-400">
                        {team.score?.efficiency || 0}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="font-semibold text-cyan-400">
                        {team.specs?.dragCoefficient?.toFixed(2) || 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p
                        className={`text-lg font-bold ${
                          isUserTeam ? 'text-amber-400' : 'text-white'
                        }`}
                      >
                        {team.score?.total || 0}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Competition Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg border border-green-600 p-6">
          <h4 className="text-lg font-bold text-green-400 mb-3">🎯 Strategy 1: Efficiency Focus</h4>
          <p className="text-slate-300 text-sm">
            Minimize weight (3 kg target) + maximize solar output. Best for teams with strong
            component selection.
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-lg border border-blue-600 p-6">
          <h4 className="text-lg font-bold text-blue-400 mb-3">🚀 Strategy 2: Aerodynamic Pursuit</h4>
          <p className="text-slate-300 text-sm">
            Iterate 3+ times with AI feedback. Drag coefficient &lt;0.15 is your target. Slower but higher total score.
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-600 p-6">
          <h4 className="text-lg font-bold text-purple-400 mb-3">⚡ Strategy 3: Speed Racer</h4>
          <p className="text-slate-300 text-sm">
            Complete fast and lock in early scores. Speed bonus (50 pts) helps even with lower efficiency.
          </p>
        </div>
      </div>

      {/* Challenge Modes */}
      <div className="bg-slate-700/50 rounded-xl border border-slate-600 p-6">
        <h3 className="text-xl font-bold text-white mb-4">⏱️ Challenge Modes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
            <h4 className="text-green-400 font-bold mb-2">🟢 Novice Mode</h4>
            <p className="text-slate-300 text-sm mb-3">22.5 min mission • 6 min timer</p>
            <p className="text-xs text-slate-400">Perfect for first-time designers. Extra time for learning.</p>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg border border-amber-600">
            <h4 className="text-amber-400 font-bold mb-2">🟡 Standard Mode</h4>
            <p className="text-slate-300 text-sm mb-3">15 min mission • 4 min timer</p>
            <p className="text-xs text-slate-400">Balanced challenge. Most competitive teams use this.</p>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg border border-red-600">
            <h4 className="text-red-400 font-bold mb-2">🔴 Expert Mode</h4>
            <p className="text-slate-300 text-sm mb-3">11.25 min mission • 3 min timer</p>
            <p className="text-xs text-slate-400">High-difficulty mode. For experienced teams only.</p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-indigo-900/50 to-blue-900/50 rounded-xl border border-indigo-600 p-6">
        <h3 className="text-xl font-bold text-white mb-4">📋 Your Next Steps</h3>
        <ul className="space-y-3 text-slate-300 text-sm">
          <li className="flex gap-3">
            <span className="text-indigo-400 font-bold">1.</span>
            <span>Return to <strong>Build Prototype</strong> tab to optimize components for efficiency</span>
          </li>
          <li className="flex gap-3">
            <span className="text-indigo-400 font-bold">2.</span>
            <span>Upload prototype image to <strong>Test & Iterate</strong> for AI aerodynamic feedback</span>
          </li>
          <li className="flex gap-3">
            <span className="text-indigo-400 font-bold">3.</span>
            <span>Refine based on Gemini suggestions—aim for 3+ iterations for innovation bonus</span>
          </li>
          <li className="flex gap-3">
            <span className="text-indigo-400 font-bold">4.</span>
            <span>Check this leaderboard to see your rank and strategy gap vs. top teams</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CompeteLeaderboard;
