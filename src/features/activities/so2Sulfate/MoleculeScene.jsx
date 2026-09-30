/**
 * 3D-style molecular view: SO₂ in on the left, the Au/TiO₂ active region in
 * the middle, SO₄²⁻ out on the right.
 *
 * Molecule counts are driven by the model state at the current clock, so the
 * picture and the graphs always tell the same story. It is a schematic: atom
 * sizes, spacings and molecule counts are not to scale, and the picture says so.
 *
 * Colours are fixed by the brief and used consistently: S yellow, O red,
 * H white, Au metallic gold, Ti grey, support muted grey-blue.
 */
import { useMemo } from 'react';

const VB_W = 900;
const VB_H = 340;

const FEED_SLOTS = 14;
const PRODUCT_SLOTS = 14;
const SURFACE_SLOTS = 10;

// Deterministic scatter so molecules do not jump around between renders.
function scatter(n, seed, x0, x1, y0, y1) {
  let s = seed;
  const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const out = [];
  const cols = Math.ceil(Math.sqrt(n * ((x1 - x0) / (y1 - y0))));
  const rows = Math.ceil(n / cols);
  for (let i = 0; i < n; i++) {
    const cx = x0 + ((i % cols) + 0.5) * ((x1 - x0) / cols) + (rnd() - 0.5) * 18;
    const cy = y0 + (Math.floor(i / cols) + 0.5) * ((y1 - y0) / rows) + (rnd() - 0.5) * 14;
    out.push({ x: cx, y: cy, delay: rnd() * 4 });
  }
  return out;
}
const FEED = scatter(FEED_SLOTS, 7, 26, 196, 70, 236);
const PRODUCT = scatter(PRODUCT_SLOTS, 11, 716, 884, 70, 236);

const Atom = ({ x, y, r, el }) => <circle cx={x} cy={y} r={r} fill={`url(#so2g-${el})`} />;

function SO2({ x, y }) {
  return (
    <g>
      <Atom x={x - 12} y={y + 5} r={7} el="O" />
      <Atom x={x + 12} y={y + 5} r={7} el="O" />
      <Atom x={x} y={y} r={9} el="S" />
    </g>
  );
}

function SO3({ x, y }) {
  return (
    <g>
      <Atom x={x} y={y - 13} r={6} el="O" />
      <Atom x={x - 13} y={y + 5} r={6} el="O" />
      <Atom x={x + 13} y={y + 5} r={6} el="O" />
      <Atom x={x} y={y} r={9} el="S" />
    </g>
  );
}

function SO4({ x, y, charge }) {
  return (
    <g>
      <Atom x={x} y={y - 14} r={6} el="O" />
      <Atom x={x - 13} y={y + 6} r={6} el="O" />
      <Atom x={x + 13} y={y + 6} r={6} el="O" />
      <Atom x={x} y={y} r={9} el="S" />
      <Atom x={x + 5} y={y + 6} r={6} el="O" />
      {charge && <text x={x + 17} y={y - 10} className="so2-charge">2−</text>}
    </g>
  );
}

function SOther({ x, y }) {
  return (
    <g>
      <circle cx={x} cy={y} r={12} fill="none" stroke="#94a3b8" strokeDasharray="3 3" />
      <Atom x={x} y={y} r={8} el="S" />
    </g>
  );
}

function O2({ x, y }) {
  return (
    <g>
      <Atom x={x - 6} y={y} r={7} el="O" />
      <Atom x={x + 6} y={y} r={7} el="O" />
    </g>
  );
}

function H2O({ x, y }) {
  return (
    <g>
      <Atom x={x - 8} y={y + 6} r={4} el="H" />
      <Atom x={x + 8} y={y + 6} r={4} el="H" />
      <Atom x={x} y={y} r={7} el="O" />
    </g>
  );
}

function Hplus({ x, y }) {
  return (
    <g>
      <Atom x={x} y={y} r={5} el="H" />
      <text x={x + 6} y={y - 4} className="so2-charge">+</text>
    </g>
  );
}

function Electron({ x, y }) {
  return (
    <g>
      <circle cx={x} cy={y} r={6} fill="#38bdf8" stroke="#e0f2fe" strokeWidth="1" />
      <text x={x} y={y + 3} className="so2-e" textAnchor="middle">e⁻</text>
    </g>
  );
}

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * @param {object} props
 * @param {'surface'|'electrochemical'} props.mode
 * @param {object} props.state         model sample at the clock (see so2Model.stateAt)
 * @param {object} props.parameters
 * @param {number} props.peakElectron  peak electron-transfer rate of the run, for scaling
 * @param {boolean} props.playing
 * @param {string} [props.caption]
 */
export function MoleculeScene({ mode, state, parameters, peakElectron, playing, caption }) {
  const reduced = useMemo(prefersReducedMotion, []);
  const animate = playing && !reduced;
  const c0 = parameters.so2Initial;

  // Au cluster grows with the particle-size parameter; no loading, no cluster.
  const rows = parameters.auLoading > 0
    ? Math.max(3, Math.min(7, 3 + Math.round((parameters.particleSizeNm - 2) / 4.5)))
    : 0;
  const cx = 455;
  const baseY = 244;
  const halfBase = rows * 11;

  const auAtoms = [];
  for (let i = 0; i < rows; i++) {
    const n = rows - i;
    for (let j = 0; j < n; j++) {
      auAtoms.push({ x: cx - (n - 1) * 11 + j * 22, y: baseY - 10 - i * 17 });
    }
  }

  // Adsorption slots hug the Au/TiO₂ perimeter, nearest the interface first.
  const edge = Math.max(halfBase, 18);
  const surfaceSlots = [];
  for (let k = 0; k < SURFACE_SLOTS / 2; k++) {
    const off = edge + 16 + k * 27;
    surfaceSlots.push({ x: cx - off, y: baseY - 12 }, { x: cx + off, y: baseY - 12 });
  }

  const count = (frac, slots) => Math.max(0, Math.min(slots, Math.round(frac * slots)));
  const nFeed = count(state.so2 / c0, FEED_SLOTS);
  const nProduct = count(state.sulfate / c0, PRODUCT_SLOTS);

  const adsorbed = [];
  const push = (n, kind) => { for (let i = 0; i < n && adsorbed.length < SURFACE_SLOTS; i++) adsorbed.push(kind); };
  push(count(state.thetaSO2, SURFACE_SLOTS), 'SO2');
  push(count(state.thetaSO3, SURFACE_SLOTS), 'SO3');
  push(count(state.thetaSulfate, SURFACE_SLOTS), 'SO4');
  push(count(state.thetaOther, SURFACE_SLOTS), 'X');

  const eFrac = peakElectron > 0 ? state.electronTransfer / peakElectron : 0;
  const nElectrons = state.electronTransfer > 1e-6 ? Math.max(1, Math.round(eFrac * 4)) : 0;
  const echem = mode === 'electrochemical';
  const nO2 = echem ? 0 : Math.round(parameters.o2Availability * 3);

  const leftIface = cx - edge;
  const rightIface = cx + edge;

  return (
    <figure className="so2-scene">
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} role="img" aria-label={`Schematic of ${echem ? 'electrochemical' : 'surface-catalytic'} SO₂ oxidation on Au/TiO₂: ${nFeed} SO₂ shown entering, ${adsorbed.length} adsorbed species, ${nProduct} sulfate ions shown leaving. Simulated / illustrative model output.`}>
        <defs>
          {[
            ['S', '#fef08a', '#eab308', '#854d0e'],
            ['O', '#fecaca', '#ef4444', '#7f1d1d'],
            ['H', '#ffffff', '#e2e8f0', '#94a3b8'],
            ['Au', '#fff7cc', '#d4a017', '#7a5200'],
            ['Ti', '#e2e8f0', '#94a3b8', '#475569']
          ].map(([el, a, b, c]) => (
            <radialGradient key={el} id={`so2g-${el}`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor={a} />
              <stop offset="55%" stopColor={b} />
              <stop offset="100%" stopColor={c} />
            </radialGradient>
          ))}
          <linearGradient id="so2g-slab-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#4b5d78" />
          </linearGradient>
          <linearGradient id="so2g-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b1a33" />
            <stop offset="100%" stopColor="#081224" />
          </linearGradient>
          <marker id="so2-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#64748b" />
          </marker>
        </defs>

        <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#so2g-bg)" />

        {/* zone headers */}
        <text x="111" y="26" className="so2-zone" textAnchor="middle">SO₂ in</text>
        <text x="111" y="42" className="so2-zone-sub" textAnchor="middle">S oxidation state +4</text>
        <text x={cx} y="26" className="so2-zone" textAnchor="middle">Au/TiO₂ active region</text>
        <text x={cx} y="42" className="so2-zone-sub" textAnchor="middle">{echem ? 'electrode at applied potential' : 'O₂ as electron acceptor'}</text>
        <text x="800" y="26" className="so2-zone" textAnchor="middle">SO₄²⁻ out</text>
        <text x="800" y="42" className="so2-zone-sub" textAnchor="middle">S oxidation state +6</text>
        <line x1="218" x2="218" y1="56" y2="300" className="so2-divider" />
        <line x1="700" x2="700" y1="56" y2="300" className="so2-divider" />

        {/* feed */}
        {FEED.slice(0, nFeed).map((m, i) => (
          <g key={`f${i}`} className={animate ? 'so2-drift' : undefined} style={{ animationDelay: `${-m.delay}s` }}>
            <SO2 x={m.x} y={m.y} />
          </g>
        ))}
        <path d={`M200,150 C260,150 ${leftIface - 70},170 ${leftIface - 40},${baseY - 36}`} className="so2-flow" markerEnd="url(#so2-arrow)" />
        <path d={`M${rightIface + 40},${baseY - 36} C${rightIface + 90},150 660,150 712,150`} className="so2-flow" markerEnd="url(#so2-arrow)" />

        {/* TiO₂ support slab: top, front and side faces */}
        <polygon points="232,262 648,262 690,226 274,226" fill="url(#so2g-slab-top)" stroke="#94a3b8" strokeOpacity="0.35" />
        <polygon points="232,262 648,262 648,306 232,306" fill="#3b4a60" />
        <polygon points="648,262 690,226 690,270 648,306" fill="#2c384a" />
        {Array.from({ length: 3 }).map((_, r) =>
          Array.from({ length: 13 }).map((__, c) => {
            const t = (r + 0.5) / 3;
            const x = 250 + c * 31 + t * 42;
            const y = 262 - t * 36;
            return (c + r) % 2 === 0
              ? <Atom key={`l${r}-${c}`} x={x} y={y} r={5} el="Ti" />
              : <Atom key={`l${r}-${c}`} x={x} y={y} r={3.5} el="O" />;
          })
        )}
        <text x="440" y="290" className="so2-slab-label" textAnchor="middle">TiO₂ support</text>

        {/* Au/TiO₂ interface ring */}
        {rows > 0 && (
          <ellipse cx={cx} cy={baseY + 2} rx={edge + 10} ry="9" className="so2-interface" />
        )}

        {/* Au nanoparticle */}
        {auAtoms.map((a, i) => <Atom key={`au${i}`} x={a.x} y={a.y} r={11} el="Au" />)}
        {rows > 0 ? (
          <text x={cx} y={baseY - 22 - rows * 17} className="so2-np-label" textAnchor="middle">
            Auₙ (~{parameters.particleSizeNm} nm, model)
          </text>
        ) : (
          <text x={cx} y={baseY - 40} className="so2-np-label" textAnchor="middle">no Au loaded - bare TiO₂</text>
        )}

        {/* adsorbed species */}
        {adsorbed.map((kind, i) => {
          const s = surfaceSlots[i];
          if (kind === 'SO2') return <SO2 key={`a${i}`} x={s.x} y={s.y} />;
          if (kind === 'SO3') return <SO3 key={`a${i}`} x={s.x} y={s.y} />;
          if (kind === 'SO4') return <SO4 key={`a${i}`} x={s.x} y={s.y} />;
          return <SOther key={`a${i}`} x={s.x} y={s.y} />;
        })}

        {/* oxidant / electron path */}
        {echem ? (
          <>
            <H2O x={leftIface - 22} y={baseY - 52} />
            <H2O x={leftIface - 52} y={baseY - 62} />
            {state.sulfate > 0 && <Hplus x={rightIface + 24} y={baseY - 58} />}
            {state.sulfate > 0.25 * c0 && <Hplus x={rightIface + 44} y={baseY - 70} />}
            <rect x="232" y="312" width="458" height="12" rx="3" fill="#1e293b" stroke="#475569" />
            <text x="240" y="336" className="so2-zone-sub">electrode / current collector (conceptual)</text>
            <path id={`so2-epath-${mode}`} d={`M${cx},${baseY} L${cx},318 L880,318`} fill="none" stroke="#38bdf8" strokeOpacity="0.25" strokeDasharray="4 4" />
            <text x="880" y="336" className="so2-zone-sub" textAnchor="end">to external circuit →</text>
            {animate
              ? Array.from({ length: nElectrons }).map((_, i) => (
                  <g key={`e${i}`}>
                    <circle r="6" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="1">
                      <animateMotion dur="2.4s" repeatCount="indefinite" begin={`${-i * 0.6}s`}>
                        <mpath href={`#so2-epath-${mode}`} />
                      </animateMotion>
                    </circle>
                  </g>
                ))
              : nElectrons > 0 && <Electron x={cx + 40} y={318} />}
          </>
        ) : (
          <>
            {Array.from({ length: nO2 }).map((_, i) => (
              <O2 key={`o${i}`} x={rightIface + 30 + i * 30} y={baseY - 64 - (i % 2) * 14} />
            ))}
            {nO2 === 0 && (
              <text x={rightIface + 20} y={baseY - 60} className="so2-zone-sub">no O₂ - no acceptor</text>
            )}
            {nElectrons > 0 && nO2 > 0 && (animate ? (
              <circle r="6" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="1">
                <animateMotion dur="1.6s" repeatCount="indefinite" path={`M${rightIface + 14},${baseY - 14} Q${rightIface + 24},${baseY - 50} ${rightIface + 30},${baseY - 64}`} />
              </circle>
            ) : (
              <Electron x={rightIface + 22} y={baseY - 40} />
            ))}
          </>
        )}

        {/* products */}
        {PRODUCT.slice(0, nProduct).map((m, i) => (
          <g key={`p${i}`} className={animate ? 'so2-bob' : undefined} style={{ animationDelay: `${-m.delay}s` }}>
            <SO4 x={m.x} y={m.y} charge />
          </g>
        ))}

      </svg>
      <figcaption>
        {caption ? <b>{caption} · </b> : null}
        Simplified mechanistic visualization · not to scale · molecule counts follow the simulated / illustrative model output
      </figcaption>
    </figure>
  );
}

export function SceneLegend() {
  const chip = (el, label) => (
    <span className="so2-atom-key"><svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill={`url(#so2g-${el})`} /></svg>{label}</span>
  );
  return (
    <div className="so2-scene-legend">
      {chip('S', 'S')}{chip('O', 'O')}{chip('H', 'H')}{chip('Au', 'Au')}{chip('Ti', 'Ti')}
      <span className="so2-atom-key"><i className="so2-swatch-support" />TiO₂ support</span>
      <span className="so2-atom-key"><i className="so2-swatch-e" />e⁻</span>
      <span className="so2-legend-sep" />
      <span>Adsorbed: SO₂* (S +4) · SO₃* (S +6) · SO₄* (S +6) · <span className="so2-dashed">S*</span> other adsorbed S (state not modelled)</span>
    </div>
  );
}
