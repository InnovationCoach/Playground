import React, { useState } from 'react';
import BuildPrototype from './BuildPrototype';
import TestIterate from './TestIterate';
import CompeteLeaderboard from './CompeteLeaderboard';

interface MobileResponsiveProps {
  teamData: any;
  componentDatabase: any;
  onComponentChange: (category: string, componentId: string) => void;
  onImageUpload: (file: File) => Promise<void>;
  allTeams: any[];
  isLoading: boolean;
}

/**
 * Mobile-optimized wrapper for Solar Car Activity
 * Provides responsive design and mobile-specific UX enhancements
 */
const SolarCarMobileResponsive: React.FC<MobileResponsiveProps> = ({
  teamData,
  componentDatabase,
  onComponentChange,
  onImageUpload,
  allTeams,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'build' | 'test' | 'compete'>('build');
  const [showTabMenu, setShowTabMenu] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      {/* Mobile Header with Sticky Tab Bar */}
      <div className="sticky top-0 z-40 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">☀️</span>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-white truncate">Solar Car</h1>
                <p className="text-xs text-slate-400">{teamData?.teamName}</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="text-amber-400 font-bold">{teamData?.weight?.total || 0}g</p>
              <p className="text-xs text-slate-400">V{teamData?.currentVersion}</p>
            </div>
          </div>
        </div>

        {/* Mobile Tab Buttons - Horizontal Scroll on small screens */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('build')}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'build'
                ? 'bg-amber-500 text-black'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            ⚙️ Build
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'test'
                ? 'bg-amber-500 text-black'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            🧪 Test
          </button>
          <button
            onClick={() => setActiveTab('compete')}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'compete'
                ? 'bg-amber-500 text-black'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            🏆 Compete
          </button>
        </div>
      </div>

      {/* Content Area with Mobile-Optimized Spacing */}
      <div className="px-3 md:px-4 py-6 md:py-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Mobile-specific adjustments for Build Tab */}
          {activeTab === 'build' && (
            <div className="space-y-6 md:space-y-8">
              {/* Compact Weight Display for Mobile */}
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl md:rounded-2xl p-4 md:p-8 text-black shadow-xl">
                <div className="grid grid-cols-2 gap-4 md:gap-0">
                  <div>
                    <p className="text-xs md:text-sm font-semibold opacity-80 mb-1">WEIGHT</p>
                    <p className="text-2xl md:text-5xl font-bold">{(teamData?.weight?.total / 1000).toFixed(2)}kg</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs md:text-sm opacity-80 mb-1">EFFICIENCY</p>
                    <p className="text-xl md:text-3xl font-bold">8.5 W/kg</p>
                  </div>
                </div>

                {/* Mobile Weight Progress Bar */}
                <div className="mt-4">
                  <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black/40"
                      style={{ width: '68%' }}
                    />
                  </div>
                  <p className="text-xs opacity-80 mt-2">68% of recommended 5kg</p>
                </div>
              </div>

              {/* Mobile Component Grid - Stack on small screens */}
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-3">🔧 Chassis</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {componentDatabase.chassis?.map((component: any) => (
                    <button
                      key={component.id}
                      onClick={() => onComponentChange('chassis', component.id)}
                      className={`p-3 md:p-4 rounded-lg border-2 transition-all text-left text-sm md:text-base ${
                        teamData?.components?.chassis === component.id
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-slate-600 bg-slate-700/30'
                      }`}
                    >
                      <p className="font-bold text-white">{component.name}</p>
                      <p className="text-xs md:text-sm text-slate-300">{component.weight}g</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Similar sections for Motor, Battery, Solar Panel */}
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-3">⚡ Motor</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {componentDatabase.motor?.map((component: any) => (
                    <button
                      key={component.id}
                      onClick={() => onComponentChange('motor', component.id)}
                      className={`p-3 md:p-4 rounded-lg border-2 transition-all text-left text-sm md:text-base ${
                        teamData?.components?.motor === component.id
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-slate-600 bg-slate-700/30'
                      }`}
                    >
                      <p className="font-bold text-white">{component.name}</p>
                      <p className="text-xs md:text-sm text-slate-300">{component.powerOutput}W</p>
                    </button>
                  ))}
                </div>
              </div>

              <BuildPrototype
                teamData={teamData}
                componentDatabase={componentDatabase}
                onComponentChange={onComponentChange}
              />
            </div>
          )}

          {/* Test & Iterate Tab - Optimize for image uploads on mobile */}
          {activeTab === 'test' && (
            <div className="space-y-6">
              {/* Large Touch Target for Upload */}
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-3">📸 Upload Prototype</h3>
                <button className="w-full border-2 border-dashed border-slate-600 rounded-xl md:rounded-2xl p-8 md:p-12 text-center hover:border-amber-500 hover:bg-amber-500/5 transition-all">
                  <div className="text-5xl md:text-6xl mb-3">📷</div>
                  <p className="text-white font-semibold">Tap to upload photo</p>
                  <p className="text-slate-500 text-sm mt-2">PNG, JPG • Max 10MB</p>
                </button>
              </div>

              <TestIterate
                teamData={teamData}
                onImageUpload={onImageUpload}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Compete Tab - Leaderboard optimized for mobile */}
          {activeTab === 'compete' && (
            <CompeteLeaderboard
              teamData={teamData}
              allTeams={allTeams}
            />
          )}
        </div>
      </div>

      {/* Mobile-specific scroll indicator */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Mobile-specific spacing */
        @media (max-width: 640px) {
          .component-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          }

          .metric-card {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SolarCarMobileResponsive;
