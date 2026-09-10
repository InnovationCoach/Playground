import React, { useMemo } from 'react';

interface BuildPrototypeProps {
  teamData: any;
  componentDatabase: any;
  onComponentChange: (category: string, componentId: string) => void;
}

const BuildPrototype: React.FC<BuildPrototypeProps> = ({
  teamData,
  componentDatabase,
  onComponentChange,
}) => {
  const selectedComponents = useMemo(() => {
    return {
      chassis: componentDatabase.chassis.find((c: any) => c.id === teamData.components.chassis),
      motor: componentDatabase.motor.find((c: any) => c.id === teamData.components.motor),
      battery: componentDatabase.battery.find((c: any) => c.id === teamData.components.battery),
      controller: componentDatabase.controller.find((c: any) => c.id === teamData.components.controller),
      solarPanel: componentDatabase.solarPanel.find((c: any) => c.id === teamData.components.solarPanel),
    };
  }, [teamData.components, componentDatabase]);

  const efficiency = useMemo(() => {
    const panelPower = selectedComponents.solarPanel?.powerOutput || 20;
    return (panelPower / (teamData.weight.total / 1000)).toFixed(1);
  }, [selectedComponents, teamData.weight.total]);

  const recommendedMaxWeight = 5000;
  const weightPercentage = (teamData.weight.total / recommendedMaxWeight) * 100;
  const weightColor =
    weightPercentage <= 80 ? 'bg-green-500' : weightPercentage <= 100 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-8">
      {/* Weight Display */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-8 text-black shadow-2xl">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold opacity-80 mb-2">TOTAL PROTOTYPE WEIGHT</p>
            <p className="text-5xl font-bold">{(teamData.weight.total / 1000).toFixed(2)} kg</p>
            <p className="text-sm opacity-80 mt-2">Power Efficiency: {efficiency} W/kg</p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-80 mb-2">Recommended: &lt;5 kg</div>
            <div className="w-48 h-3 bg-black/20 rounded-full overflow-hidden">
              <div
                className={`h-full ${weightColor} transition-all`}
                style={{ width: `${Math.min(weightPercentage, 100)}%` }}
              />
            </div>
            <p className="text-sm mt-2 font-semibold">{weightPercentage.toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Component Breakdown Table */}
      <div className="bg-slate-700/50 rounded-xl overflow-hidden border border-slate-600">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-600">
              <th className="px-4 py-3 text-left font-semibold text-slate-300">Component</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-300">Weight</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-300">Specs</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(selectedComponents).map(([key, component]: [string, any]) => (
              <tr key={key} className="border-b border-slate-600 hover:bg-slate-700/50 transition-colors">
                <td className="px-4 py-3 text-slate-200">{component?.name || key}</td>
                <td className="px-4 py-3 text-right text-amber-400 font-semibold">
                  {component?.weight || 0}g
                </td>
                <td className="px-4 py-3 text-right text-slate-400 text-xs">
                  {component?.powerOutput && `Power: ${component.powerOutput}W`}
                  {component?.capacity && `Capacity: ${component.capacity}mAh`}
                  {component?.dragFactor && `Drag: ${component.dragFactor.toFixed(2)}`}
                </td>
              </tr>
            ))}
            <tr className="bg-slate-800 font-bold text-amber-400">
              <td className="px-4 py-3">TOTAL WEIGHT</td>
              <td className="px-4 py-3 text-right">{teamData.weight.total}g</td>
              <td className="px-4 py-3 text-right">Efficiency: {efficiency}W/kg</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Chassis Selection */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">🔧 Chassis Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {componentDatabase.chassis.map((component: any) => (
            <button
              key={component.id}
              onClick={() => onComponentChange('chassis', component.id)}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                selectedComponents.chassis?.id === component.id
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
              }`}
            >
              <h4 className="font-bold text-white mb-2">{component.name}</h4>
              <p className="text-sm text-slate-300 mb-3">{component.weight}g • ${component.cost}</p>
              <p className="text-xs text-slate-400">Drag factor: {component.dragFactor.toFixed(2)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Motor Selection */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">⚡ Motor & Gearbox</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {componentDatabase.motor.map((component: any) => (
            <button
              key={component.id}
              onClick={() => onComponentChange('motor', component.id)}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                selectedComponents.motor?.id === component.id
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
              }`}
            >
              <h4 className="font-bold text-white mb-2">{component.name}</h4>
              <p className="text-sm text-slate-300 mb-3">{component.weight}g • ${component.cost}</p>
              <p className="text-xs text-slate-400">Power: {component.powerOutput}W</p>
            </button>
          ))}
        </div>
      </div>

      {/* Battery Selection */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">🔋 Battery System</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {componentDatabase.battery.map((component: any) => (
            <button
              key={component.id}
              onClick={() => onComponentChange('battery', component.id)}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                selectedComponents.battery?.id === component.id
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
              }`}
            >
              <h4 className="font-bold text-white mb-2">{component.name}</h4>
              <p className="text-sm text-slate-300 mb-3">{component.weight}g • ${component.cost}</p>
              <p className="text-xs text-slate-400">Capacity: {component.capacity}mAh</p>
            </button>
          ))}
        </div>
      </div>

      {/* Solar Panel Selection */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">☀️ Solar Panel Placement</h3>
        <p className="text-slate-400 text-sm mb-4">
          Larger panels = more power but heavier and higher drag. Choose based on your racing strategy.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {componentDatabase.solarPanel.map((component: any) => (
            <button
              key={component.id}
              onClick={() => onComponentChange('solarPanel', component.id)}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                selectedComponents.solarPanel?.id === component.id
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
              }`}
            >
              <h4 className="font-bold text-white mb-2">{component.name}</h4>
              <p className="text-sm text-slate-300 mb-3">{component.weight}g • ${component.cost}</p>
              <p className="text-xs text-slate-400">
                Power: {component.powerOutput}W • Drag: {component.dragFactor.toFixed(2)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Additional Components */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">📡 Optional Components</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {componentDatabase.additional.map((component: any) => (
            <button
              key={component.id}
              className="p-4 rounded-lg border-2 border-slate-600 bg-slate-700/30 hover:border-amber-500 hover:bg-amber-500/10 transition-all text-left"
            >
              <h4 className="font-bold text-white text-sm mb-1">{component.name}</h4>
              <p className="text-xs text-slate-400">{component.weight}g • ${component.cost}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Design Tips */}
      <div className="bg-green-900/30 border border-green-700 rounded-lg p-6">
        <h4 className="text-white font-bold mb-3">💡 Design Tips</h4>
        <ul className="text-slate-200 text-sm space-y-2">
          <li>• Keep total weight between 3–5 kg for optimal performance</li>
          <li>• Carbon fiber chassis reduces weight but increases cost</li>
          <li>• Larger solar panels improve endurance but affect aerodynamics</li>
          <li>• BLDC motors are more efficient than brushed DC motors</li>
          <li>• Each additional component adds weight and power draw</li>
        </ul>
      </div>
    </div>
  );
};

export default BuildPrototype;
