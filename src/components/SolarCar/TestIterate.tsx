import React, { useRef, useState } from 'react';

interface TestIterateProps {
  teamData: any;
  onImageUpload: (file: File) => Promise<void>;
  isLoading: boolean;
}

const TestIterate: React.FC<TestIterateProps> = ({ teamData, onImageUpload, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      await onImageUpload(file);
    } finally {
      setUploading(false);
    }
  };

  const latestImage = teamData.images?.[teamData.images.length - 1];
  const aiAnalysis = latestImage?.aiAnalysis;

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-4">📸 Upload Prototype Image</h3>
        <p className="text-slate-400 text-sm mb-6">
          Take a photo of your physical prototype or submit a CAD render. Gemini AI will analyze aerodynamics, drag, panel placement, and weight distribution.
        </p>

        {/* Upload Zone */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-slate-600 rounded-xl p-12 text-center hover:border-amber-500 hover:bg-amber-500/5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <div className="text-5xl mb-4">📷</div>
          <p className="text-slate-300 font-semibold">Click to upload or drag and drop</p>
          <p className="text-slate-500 text-sm mt-2">PNG, JPG up to 10MB</p>
          {uploading && <p className="text-amber-400 text-sm mt-4">Uploading and analyzing...</p>}
        </button>

        {/* Image Preview */}
        {preview && (
          <div className="mt-6">
            <img
              src={preview}
              alt="Prototype preview"
              className="w-full max-h-96 object-cover rounded-lg border border-slate-600"
            />
          </div>
        )}
      </div>

      {/* AI Analysis Results */}
      {aiAnalysis && (
        <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 rounded-xl border border-blue-600 p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🤖</span>
            <div>
              <h3 className="text-2xl font-bold text-white">Gemini AI Expert Feedback</h3>
              <p className="text-slate-400 text-sm">Iteration Round {teamData.currentVersion}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Aerodynamics */}
            <div className="bg-slate-800/50 rounded-lg p-6">
              <h4 className="text-slate-300 text-sm font-semibold mb-2">AERODYNAMIC SHAPE</h4>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">
                  {aiAnalysis.aerodynamics === 'excellent'
                    ? '⭐'
                    : aiAnalysis.aerodynamics === 'good'
                    ? '✅'
                    : aiAnalysis.aerodynamics === 'fair'
                    ? '⚠️'
                    : '❌'}
                </span>
                <span
                  className={`text-xl font-bold capitalize ${
                    aiAnalysis.aerodynamics === 'excellent'
                      ? 'text-green-400'
                      : aiAnalysis.aerodynamics === 'good'
                      ? 'text-green-400'
                      : aiAnalysis.aerodynamics === 'fair'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}
                >
                  {aiAnalysis.aerodynamics}
                </span>
              </div>
            </div>

            {/* Drag Coefficient */}
            <div className="bg-slate-800/50 rounded-lg p-6">
              <h4 className="text-slate-300 text-sm font-semibold mb-2">DRAG COEFFICIENT (Cd)</h4>
              <div className="mb-3">
                <p className="text-3xl font-bold text-white">{aiAnalysis.dragCoefficient.toFixed(2)}</p>
                <p className="text-xs text-slate-400 mt-1">Target: &lt;0.15</p>
              </div>
              <div className="w-full h-2 bg-slate-600 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    aiAnalysis.dragCoefficient < 0.15 ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{
                    width: `${Math.min((aiAnalysis.dragCoefficient / 0.25) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Solar Coverage */}
            <div className="bg-slate-800/50 rounded-lg p-6">
              <h4 className="text-slate-300 text-sm font-semibold mb-2">SOLAR PANEL COVERAGE</h4>
              <div className="mb-3">
                <p className="text-3xl font-bold text-amber-400">{aiAnalysis.solarCoverage}%</p>
                <p className="text-xs text-slate-400 mt-1">Panel efficiency area</p>
              </div>
              <div className="w-full h-2 bg-slate-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${aiAnalysis.solarCoverage}%` }}
                />
              </div>
            </div>

            {/* Weight Balance */}
            <div className="bg-slate-800/50 rounded-lg p-6">
              <h4 className="text-slate-300 text-sm font-semibold mb-2">WEIGHT DISTRIBUTION</h4>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {aiAnalysis.weightBalance === 'balanced'
                    ? '✅'
                    : aiAnalysis.weightBalance === 'slight'
                    ? '⚠️'
                    : '❌'}
                </span>
                <span className="text-white font-semibold capitalize">{aiAnalysis.weightBalance}</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Motor center, battery balanced left-right</p>
            </div>
          </div>

          {/* Suggestions */}
          <div className="mt-6 bg-slate-800/30 rounded-lg p-4 border-l-4 border-cyan-500">
            <h4 className="text-white font-semibold mb-3">💡 Improvement Suggestions</h4>
            <ul className="space-y-2">
              {aiAnalysis.suggestions?.map((suggestion: string, idx: number) => (
                <li key={idx} className="text-slate-300 text-sm flex gap-2">
                  <span className="text-cyan-400">→</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Iteration History */}
      {teamData.images.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-white mb-4">📈 Refinement History</h3>
          <div className="space-y-4">
            {teamData.images.map((image: any, idx: number) => (
              <div
                key={idx}
                className="bg-slate-700/50 rounded-lg overflow-hidden border border-slate-600 hover:border-slate-500 transition-colors"
              >
                <div className="flex gap-4 p-4">
                  <img
                    src={image.url}
                    alt={`Iteration ${image.iteration}`}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-white">Refinement Round {image.iteration}</h4>
                      <span className="text-xs text-slate-400">
                        {new Date(image.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    {image.aiAnalysis && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-slate-400 text-xs">Drag Coeff.</p>
                          <p className="text-white font-semibold">{image.aiAnalysis.dragCoefficient.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Panel Coverage</p>
                          <p className="text-amber-400 font-semibold">{image.aiAnalysis.solarCoverage}%</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Aerodynamics</p>
                          <p className="text-green-400 font-semibold capitalize">
                            {image.aiAnalysis.aerodynamics}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Balance</p>
                          <p className="text-blue-400 font-semibold capitalize">
                            {image.aiAnalysis.weightBalance}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl border border-purple-600 p-6">
        <h3 className="text-xl font-bold text-white mb-4">🎖️ Achievements Unlocked</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamData.currentVersion >= 2 && (
            <div className="flex gap-3 bg-slate-800/50 p-4 rounded-lg">
              <span className="text-2xl">🔄</span>
              <div>
                <p className="font-bold text-white">Iteration Master</p>
                <p className="text-xs text-slate-400">Completed multiple refinement rounds</p>
              </div>
            </div>
          )}
          {teamData.images.length > 0 && (
            <div className="flex gap-3 bg-slate-800/50 p-4 rounded-lg">
              <span className="text-2xl">📸</span>
              <div>
                <p className="font-bold text-white">Prototype Documented</p>
                <p className="text-xs text-slate-400">Uploaded prototype images for AI analysis</p>
              </div>
            </div>
          )}
          {aiAnalysis?.dragCoefficient && aiAnalysis.dragCoefficient < 0.15 && (
            <div className="flex gap-3 bg-slate-800/50 p-4 rounded-lg">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-bold text-white">Aerodynamic Expert</p>
                <p className="text-xs text-slate-400">Achieved drag coefficient &lt; 0.15</p>
              </div>
            </div>
          )}
          {aiAnalysis?.solarCoverage && aiAnalysis.solarCoverage > 75 && (
            <div className="flex gap-3 bg-slate-800/50 p-4 rounded-lg">
              <span className="text-2xl">☀️</span>
              <div>
                <p className="font-bold text-white">Solar Maximized</p>
                <p className="text-xs text-slate-400">Optimized panel placement (75%+ coverage)</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestIterate;
