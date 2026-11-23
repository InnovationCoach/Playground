import React, { useState } from 'react';
import { Sparkles, SquareTerminal, Camera, Minus, Smartphone } from 'lucide-react';
import { evaluateLocalGeoNodes } from './GeoNodesPanel.jsx';

const EXAMPLE_PROMPTS = [
  'Create a ring of 12 pillars',
  'Add a bevel with 3 segments',
  'Add a 30mm starter block'
];

export function generateLocalCopilotResult(prompt) {
  const lower = String(prompt || '').toLowerCase();
  const countMatch = lower.match(/\b(\d{1,2})\b/);
  const count = countMatch ? Math.max(3, Math.min(24, Number(countMatch[1]))) : 12;

  if (lower.includes('pillar') || lower.includes('ring') || lower.includes('circle')) {
    const code = [
      `# AI Co-Pilot: Create a ring of ${count} pillars`,
      'import bpy, bmesh, math',
      `count = ${count}`,
      'radius = 0.04  # 40 mm',
      'for i in range(count):',
      '    angle = (i / count) * math.tau',
      '    bm = bmesh.new()',
      '    bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=0.005, radius2=0.005, depth=0.03)',
      '    mesh = bpy.data.meshes.new(f"Pillar_{i}")',
      '    bm.to_mesh(mesh); bm.free()',
      '    obj = bpy.data.objects.new(f"Pillar_{i}", mesh)',
      '    obj.location = (math.cos(angle) * radius, 0.015, math.sin(angle) * radius)',
      '    bpy.context.scene.collection.objects.link(obj)'
    ].join('\n');
    return {
      code,
      shapes: evaluateLocalGeoNodes({ Socket_2: count, Socket_3: 40, Socket_4: 30, Socket_5: false, Socket_6: 'cylinder' })
    };
  }

  return {
    code: [
      `# AI Co-Pilot: "${String(prompt).slice(0, 60)}"`,
      'import bpy, bmesh',
      'bm = bmesh.new()',
      'bmesh.ops.create_cube(bm, size=0.03)',
      'mesh = bpy.data.meshes.new("AI_Block")',
      'bm.to_mesh(mesh); bm.free()',
      'obj = bpy.data.objects.new("AI_Block", mesh)',
      'bpy.context.scene.collection.objects.link(obj)'
    ].join('\n'),
    shapes: null
  };
}

/**
 * Floating AI Co-Pilot command bar, docked bottom-centre of the 3D viewport.
 * The prompt row is always visible; the live bpy code terminal and the
 * cloud render controls open above it on demand.
 */
export function AiCopilotDrawer({ liveCode, onRunPrompt, onExportGlb, onCloudRender }) {
  const [prompt, setPrompt] = useState('');
  const [renderEngine, setRenderEngine] = useState('EEVEE');
  const [renderStatus, setRenderStatus] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [showRender, setShowRender] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const submitPrompt = (text) => {
    const q = (text ?? prompt).trim();
    if (!q) return;
    const res = generateLocalCopilotResult(q);
    if (onRunPrompt) onRunPrompt(q, res);
    setPrompt('');
  };

  const triggerRender = (engine) => {
    setRenderEngine(engine);
    setRenderStatus(`Rendering via ${engine}${engine === 'CYCLES' ? ' + OpenImageDenoise' : ''}…`);
    if (onCloudRender) onCloudRender(engine);
    setTimeout(() => setRenderStatus(`✓ ${engine} render complete (960×540)`), 900);
  };

  if (minimized) {
    return (
      <div className="tks-ai-mini">
        <button
          type="button"
          className="tks-btn tks-btn--primary"
          onClick={() => setMinimized(false)}
          title="Open the AI Co-Pilot command bar"
        >
          <Sparkles size={15} /> Ask AI to model
        </button>
      </div>
    );
  }

  return (
    <div className="tks-ai" role="region" aria-label="AI Co-Pilot">
      {showCode && (
        <div className="tks-section">
          <div className="tks-terminal-head">
            <span><SquareTerminal size={12} style={{ verticalAlign: '-2px' }} /> Live bpy / bmesh code</span>
            <span className="tks-status-pill">AST Sandboxed</span>
          </div>
          <pre className="tks-terminal">
            {liveCode || '# Live bpy / bmesh Python code will appear here as you model.'}
          </pre>
          {onExportGlb && (
            <div className="tks-inline">
              <button type="button" className="tks-btn tks-btn--outline tks-btn--sm" onClick={() => onExportGlb('glb')}>
                <Smartphone size={13} /> Export .GLB (AR)
              </button>
              <button type="button" className="tks-btn tks-btn--outline tks-btn--sm" onClick={() => onExportGlb('usdz')}>
                Export .USDZ
              </button>
            </div>
          )}
        </div>
      )}

      {showRender && (
        <div className="tks-inline">
          <span className="tks-hint" style={{ whiteSpace: 'nowrap' }}>Cloud render:</span>
          <button type="button" className="tks-btn tks-btn--outline tks-btn--sm" onClick={() => triggerRender('EEVEE')}>
            EEVEE preview
          </button>
          <button type="button" className="tks-btn tks-btn--outline tks-btn--sm" onClick={() => triggerRender('CYCLES')}>
            Cycles + OIDN
          </button>
          {renderStatus && (
            <span className={`tks-ai-status${renderEngine === 'CYCLES' ? ' is-cycles' : ''}`}>{renderStatus}</span>
          )}
        </div>
      )}

      <div className="tks-ai-row">
        <span className="tks-ai-icon" aria-hidden="true"><Sparkles size={16} /></span>
        <input
          type="text"
          className="tks-ai-input"
          value={prompt}
          aria-label="Ask AI to model or edit"
          placeholder="Ask AI to model or edit (e.g. 'Create a ring of 12 pillars')…"
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submitPrompt(); }}
        />
        <button
          type="button"
          className="tks-btn tks-btn--primary"
          onClick={() => submitPrompt()}
          disabled={!prompt.trim()}
        >
          Generate
        </button>
      </div>

      <div className="tks-ai-row">
        <div className="tks-ai-chips">
          {EXAMPLE_PROMPTS.map((ex) => (
            <button key={ex} type="button" className="tks-chip" onClick={() => submitPrompt(ex)}>
              {ex}
            </button>
          ))}
        </div>
        <div className="tks-ai-tools">
          <button
            type="button"
            className="tks-btn tks-btn--sm tks-btn--toggle"
            aria-pressed={showCode}
            onClick={() => setShowCode((v) => !v)}
            title="Show the live bpy Python code"
          >
            <SquareTerminal size={13} /> Code
          </button>
          <button
            type="button"
            className="tks-btn tks-btn--sm tks-btn--toggle"
            aria-pressed={showRender}
            onClick={() => setShowRender((v) => !v)}
            title="Cloud render with EEVEE or Cycles"
          >
            <Camera size={13} /> Render
          </button>
          <button
            type="button"
            className="tks-btn tks-btn--sm tks-btn--icon"
            onClick={() => { setMinimized(true); setShowCode(false); setShowRender(false); }}
            title="Minimise the command bar"
            aria-label="Minimise the AI command bar"
          >
            <Minus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
