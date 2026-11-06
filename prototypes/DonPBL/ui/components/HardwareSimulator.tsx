import React, { useState, useEffect } from 'react';
import { 
  X, 
  Thermometer, 
  Droplets, 
  Sun, 
  ShieldCheck, 
  RotateCw, 
  Check, 
  AlertTriangle,
  Zap,
  Activity
} from 'lucide-react';

interface HardwareSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HardwareSimulator: React.FC<HardwareSimulatorProps> = ({ isOpen, onClose }) => {
  const [ambientTemp, setAmbientTemp] = useState<number>(34); // °C
  const [soilMoisture, setSoilMoisture] = useState<number>(35); // %
  const [waterReservoir, setWaterReservoir] = useState<number>(85); // %
  const [servoSleepEnabled, setServoSleepEnabled] = useState<boolean>(true);
  const [antiSiphonEnabled, setAntiSiphonEnabled] = useState<boolean>(true);
  const [serialLogs, setSerialLogs] = useState<string[]>([]);

  // Simulation derived states
  const isCanopyTriggered = ambientTemp >= 31;
  const isPumpTriggered = soilMoisture < 45;

  // Simulate serial telemetry logs
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      const timestamp = new Date().toLocaleTimeString();
      const rawAdc = Math.round(810 - (soilMoisture / 100) * 470);
      const canopyState = isCanopyTriggered ? 'DEPLOYED (115°)' : 'RETRACTED (0°)';
      const pumpState = isPumpTriggered ? 'PUMPING (Pin2 HIGH)' : 'IDLE';
      const servoStatus = isCanopyTriggered && !servoSleepEnabled ? 'PWM 50Hz ACTIVE (MOTOR BUZZ)' : 'PWM OFF (SLEEP OK)';

      const logEntry = `[${timestamp}] Temp: ${ambientTemp}°C | ADC: ${rawAdc} (${soilMoisture}%) | Canopy: ${canopyState} | Relay: ${pumpState} | Servo: ${servoStatus}`;
      
      setSerialLogs((prev) => [logEntry, ...prev.slice(0, 7)]);
    }, 2500);

    return () => clearInterval(timer);
  }, [isOpen, ambientTemp, soilMoisture, isCanopyTriggered, isPumpTriggered, servoSleepEnabled]);

  if (!isOpen) return null;

  // micro:bit 5x5 LED Matrix visualizer
  const renderLedMatrix = () => {
    // Determine 5x5 pattern: Happy face, Sun, or Droplet arrow
    let matrix: number[][] = [
      [0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0],
      [0, 0, 0, 0, 0],
      [1, 0, 0, 0, 1],
      [0, 1, 1, 1, 0]
    ]; // Happy face

    if (isCanopyTriggered && !isPumpTriggered) {
      // Sun icon
      matrix = [
        [0, 1, 0, 1, 0],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [0, 1, 0, 1, 0]
      ];
    } else if (isPumpTriggered) {
      // Down arrow (pumping water)
      matrix = [
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [1, 0, 1, 0, 1],
        [0, 1, 1, 1, 0],
        [0, 0, 1, 0, 0]
      ];
    }

    return (
      <div className="grid grid-cols-5 gap-1 p-2 bg-stone-900 rounded border border-stone-700 w-28 h-28 mx-auto shadow-inner">
        {matrix.flat().map((pixel, i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-colors duration-200 ${
              pixel === 1
                ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                : 'bg-stone-800'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-0.5">
              <span>Physical Computing Interactive Workbench</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-emerald-700 font-semibold">BBC micro:bit V2 Simulation</span>
            </div>
            <h2 className="text-lg font-bold text-stone-900">
              EcoCool Smart Canopy & Drip Irrigation Test-Bed
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Environmental Inputs & Hardware Controls */}
          <div className="space-y-5">
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-4">
              <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-700" />
                Live Sensor Simulation Controls
              </h3>

              {/* Temperature Slider */}
              <div>
                <div className="flex justify-between text-xs text-stone-700 mb-1">
                  <span className="flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                    Ambient Temperature (DS18B20 / Thermistor)
                  </span>
                  <span className="font-bold text-stone-900 font-mono">{ambientTemp}°C</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="44"
                  value={ambientTemp}
                  onChange={(e) => setAmbientTemp(Number(e.target.value))}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
                <div className="flex justify-between text-[11px] text-stone-600 mt-1">
                  <span>20°C (Mild)</span>
                  <span className="font-medium text-amber-800">Threshold: ≥31°C deploys canopy</span>
                  <span>44°C (Severe Heatwave)</span>
                </div>
              </div>

              {/* Moisture Slider */}
              <div>
                <div className="flex justify-between text-xs text-stone-700 mb-1">
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-600" />
                    Volumetric Soil Moisture (Capacitive Pin0)
                  </span>
                  <span className="font-bold text-stone-900 font-mono">
                    {soilMoisture}% (ADC ~{Math.round(810 - (soilMoisture / 100) * 470)})
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={soilMoisture}
                  onChange={(e) => setSoilMoisture(Number(e.target.value))}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] text-stone-600 mt-1">
                  <span>10% (Bone dry)</span>
                  <span className="font-medium text-blue-800">Threshold: &lt;45% triggers pump</span>
                  <span>90% (Saturated)</span>
                </div>
              </div>
            </div>

            {/* Engineering Improvement Toggles (Testing student discoveries) */}
            <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-200 space-y-3">
              <div className="text-xs font-semibold text-emerald-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Team EcoCool Iterative Improvements (Session 20 Verification)
              </div>

              {/* Toggle 1: Servo Sleep */}
              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={servoSleepEnabled}
                  onChange={(e) => setServoSleepEnabled(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-semibold text-stone-900">
                    Software Servo Sleep (<code className="font-mono text-[11px]">write_analog(0)</code>)
                  </span>
                  <p className="text-stone-600 text-[11px] leading-tight">
                    {servoSleepEnabled
                      ? '✓ Eliminates high-frequency buzzing and cuts quiescent power drain by 65%.'
                      : '⚠️ Servo motor continuously hums, heats up, and drains battery.'}
                  </p>
                </div>
              </label>

              {/* Toggle 2: Anti-Siphon Break */}
              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={antiSiphonEnabled}
                  onChange={(e) => setAntiSiphonEnabled(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-semibold text-stone-900">
                    Mechanical Pinhole Siphon Break
                  </span>
                  <p className="text-stone-600 text-[11px] leading-tight">
                    {antiSiphonEnabled
                      ? '✓ Prevents gravity siphoning when pump stops. 0mL water leakage.'
                      : '⚠️ Gravity siphons reservoir water continuously, flooding tomato roots.'}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Right Column: Physical & Visual Status Simulator */}
          <div className="space-y-4">
            <div className="bg-stone-900 text-stone-100 p-4 rounded-lg border border-stone-800 shadow-md">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-3 border-b border-stone-800 pb-2">
                <span>micro:bit V2 Display & Actuators</span>
                <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                  <Zap className="w-3 h-3" />
                  3.3V Logic / 5V Rail
                </span>
              </div>

              {/* 5x5 LED Matrix */}
              <div className="text-center mb-4">
                {renderLedMatrix()}
                <div className="text-[11px] text-stone-400 mt-2 font-mono">
                  Icon:{' '}
                  {isCanopyTriggered && !isPumpTriggered
                    ? '☀️ SUN (High Heat)'
                    : isPumpTriggered
                    ? '⬇️ DROPLET ARROW (Pumping)'
                    : '😊 HAPPY (Optimal)'}
                </div>
              </div>

              {/* Physical Actuator Status */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-2.5 rounded border ${
                  isCanopyTriggered 
                    ? 'bg-amber-950/60 border-amber-600 text-amber-200' 
                    : 'bg-stone-800 border-stone-700 text-stone-300'
                }`}>
                  <div className="font-semibold mb-1 flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5" />
                    Canopy Servo (Pin 1)
                  </div>
                  <div className="text-[11px] font-mono">
                    {isCanopyTriggered ? 'DEPLOYED (115°)' : 'RETRACTED (0°)'}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    {isCanopyTriggered ? 'Reflective Mylar shading root bed' : 'Direct daylight exposure'}
                  </div>
                </div>

                <div className={`p-2.5 rounded border ${
                  isPumpTriggered 
                    ? 'bg-blue-950/60 border-blue-600 text-blue-200' 
                    : 'bg-stone-800 border-stone-700 text-stone-300'
                }`}>
                  <div className="font-semibold mb-1 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5" />
                    5V Relay Pump (Pin 2)
                  </div>
                  <div className="text-[11px] font-mono">
                    {isPumpTriggered ? 'ACTIVE (Pulsing 2.5s)' : 'STANDBY'}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    {isPumpTriggered ? 'Delivering targeted root drip' : 'Soil moisture within band'}
                  </div>
                </div>
              </div>
            </div>

            {/* MicroPython Serial REPL Console */}
            <div className="bg-stone-950 text-emerald-400 p-3 rounded-lg font-mono text-[11px] border border-stone-800 h-36 overflow-y-auto">
              <div className="text-stone-500 mb-1 flex items-center justify-between border-b border-stone-800 pb-1">
                <span>SERIAL REPL (115200 baud)</span>
                <span>team-ecocool-v2.4.py</span>
              </div>
              {serialLogs.length === 0 ? (
                <div className="text-stone-600 italic">Waiting for sensor stream...</div>
              ) : (
                serialLogs.map((log, idx) => (
                  <div key={idx} className="leading-tight py-0.5 truncate text-[10px]">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-600">
          <span>
            Demonstrates physical computing integration without live serial ports or cloud hardware.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 text-white font-medium rounded-md hover:bg-stone-800 transition-colors"
          >
            Close Workbench
          </button>
        </div>
      </div>
    </div>
  );
};
