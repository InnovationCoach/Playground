/**
 * Decorative floating-island illustrations in the concept's palette. Hand-drawn
 * SVG, not concept screenshots, so they stay sharp at every width and carry no
 * invented names, numbers or achievements. Always hidden from assistive tech:
 * the card text says what each destination is.
 */
import { useId } from 'react';

function Frame({ viewBox = '0 0 320 220', className = '', children }) {
  return <svg className={`ls-art ${className}`} viewBox={viewBox} aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">{children}</svg>;
}

function Cloud({ x, y, s = 1, fill = '#fff' }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill} opacity=".9"><ellipse cx="0" cy="0" rx="22" ry="9" /><circle cx="-8" cy="-6" r="9" /><circle cx="7" cy="-8" r="11" /></g>;
}

/** The rocky underside and grassy top every island shares. */
function Island({ id, top = '#7cc66a', topDark = '#4f9d57', rock = '#9b7a68', rockDark = '#6e5349' }) {
  return <g>
    <defs>
      <linearGradient id={`${id}-top`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={topDark} /></linearGradient>
      <linearGradient id={`${id}-rock`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={rock} /><stop offset="1" stopColor={rockDark} /></linearGradient>
    </defs>
    <path d="M42 138 C70 150 250 150 278 138 L258 164 L236 170 L222 192 L196 184 L176 206 L150 190 L128 200 L108 176 L82 172 L66 154 Z" fill={`url(#${id}-rock)`} />
    <path d="M108 176 L128 200 L134 170 Z M196 184 L176 206 L168 172 Z M82 172 L92 160 L108 176 Z" fill={rockDark} opacity=".45" />
    <ellipse cx="160" cy="134" rx="120" ry="24" fill={`url(#${id}-top)`} />
    <ellipse cx="160" cy="130" rx="112" ry="19" fill={top} opacity=".55" />
  </g>;
}

function Tree({ x, y, s = 1, leaf = '#3f9a5c' }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}><rect x="-2" y="-2" width="4" height="12" rx="1.5" fill="#7a5a44" /><path d="M0 -26 L12 -8 H-12 Z" fill={leaf} /><path d="M0 -16 L14 4 H-14 Z" fill={leaf} opacity=".85" /></g>;
}

export function ScienceIsland() {
  const id = useId();
  return <Frame className="ls-float">
    <Cloud x={46} y={46} /><Cloud x={276} y={70} s={.8} />
    <Island id={id} />
    <Tree x={72} y={124} /><Tree x={92} y={130} s={.75} /><Tree x={252} y={122} s={.85} />
    {/* Observatory */}
    <rect x="132" y="86" width="62" height="42" rx="4" fill="#f5efe6" /><rect x="132" y="118" width="62" height="10" fill="#e3d8c8" />
    <path d="M126 88 A37 37 0 0 1 200 88 Z" fill="#c9c3e8" /><path d="M144 88 A19 26 0 0 1 182 88" fill="#a79fd6" />
    <rect x="158" y="44" width="50" height="12" rx="6" transform="rotate(-28 158 44)" fill="#655a8f" /><circle cx="204" cy="23" r="7" fill="#f3c557" />
    <rect x="156" y="104" width="14" height="24" rx="7" fill="#6f4bd8" />
    {/* Waterfall and solar panel */}
    <path d="M202 138 C206 150 200 170 204 196 L216 196 C212 170 218 150 214 138 Z" fill="#8ed4f4" opacity=".9" />
    <g transform="translate(222 112) skewX(-14)"><rect width="30" height="18" rx="2" fill="#3f4f9a" /><path d="M10 0V18M20 0V18M0 9H30" stroke="#a9b6ee" strokeWidth="1" /></g>
  </Frame>;
}

export function DesignIsland() {
  const id = useId();
  return <Frame className="ls-float ls-float-b">
    <Cloud x={40} y={60} s={.8} /><Cloud x={282} y={44} />
    <Island id={id} top="#f0b6d3" topDark="#c98bb4" rock="#a78aa6" rockDark="#74597a" />
    {/* Blossom tree */}
    <rect x="72" y="88" width="7" height="40" rx="3" fill="#7a5a44" />
    <circle cx="76" cy="76" r="24" fill="#f49ac1" /><circle cx="58" cy="88" r="15" fill="#f7b4d2" /><circle cx="94" cy="88" r="16" fill="#ee86b4" />
    {/* Studio */}
    <path d="M122 128 V84 C122 62 214 54 226 80 V128 Z" fill="#f7e9dc" />
    <path d="M114 88 C128 50 222 42 236 84 L226 82 C208 62 138 68 124 90 Z" fill="#d17ea8" />
    <rect x="138" y="88" width="34" height="40" rx="17" fill="#ffd98a" /><path d="M155 88V128M138 108H172" stroke="#c98a3a" strokeWidth="1.6" />
    {/* Easel and palette */}
    <path d="M196 128 L206 92 L216 128 M206 92 V128" stroke="#8a6545" strokeWidth="3" fill="none" />
    <rect x="190" y="72" width="34" height="28" rx="2" fill="#fff" /><path d="M192 96 L203 84 L212 92 L218 86 L222 96 Z" fill="#a792e8" /><circle cx="216" cy="79" r="3.4" fill="#f3c557" />
    <g transform="translate(248 126) rotate(-14)"><ellipse rx="19" ry="12" fill="#f8efe2" /><circle cx="-8" cy="-3" r="2.8" fill="#ea5d92" /><circle cx="0" cy="-6" r="2.8" fill="#f3c557" /><circle cx="8" cy="-3" r="2.8" fill="#6f4bd8" /><circle cx="9" cy="4" r="2.8" fill="#3fb48f" /></g>
  </Frame>;
}

export function TechnologyIsland() {
  const id = useId();
  return <Frame className="ls-float ls-float-c">
    <Cloud x={52} y={40} s={.85} /><Cloud x={280} y={64} s={.9} />
    <Island id={id} top="#a9dfe6" topDark="#7fb6c9" rock="#8e93ab" rockDark="#5f6480" />
    {/* Lab */}
    <rect x="112" y="78" width="100" height="50" rx="14" fill="#e8e6f6" /><rect x="112" y="112" width="100" height="16" fill="#d0cdea" />
    <rect x="126" y="90" width="36" height="24" rx="5" fill="#2e2a63" /><path d="M136 98 L131 102 L136 106 M152 98 L157 102 L152 106 M146 96 L142 108" stroke="#7fe3f2" strokeWidth="2" fill="none" strokeLinecap="round" />
    <rect x="172" y="92" width="26" height="36" rx="13" fill="#6f4bd8" />
    {/* Dish */}
    <path d="M120 78 L128 60" stroke="#6b6890" strokeWidth="3" /><path d="M110 60 A20 20 0 0 0 146 52 Z" fill="#c9c6e6" />
    {/* Wind turbine */}
    <path d="M250 128 L253 66 L256 128 Z" fill="#f2f1fb" /><g transform="translate(253 64)" fill="#f2f1fb"><path d="M0 0 L5 -26 L-3 -24 Z" /><path d="M0 0 L22 16 L24 8 Z" /><path d="M0 0 L-24 12 L-19 18 Z" /></g><circle cx="253" cy="64" r="3.5" fill="#8c88b4" />
    {/* Robot */}
    <g transform="translate(78 110)"><rect x="-15" y="-16" width="30" height="24" rx="11" fill="#fff" /><rect x="-10" y="-11" width="20" height="12" rx="6" fill="#2e2a63" /><circle cx="-4" cy="-5" r="2.3" fill="#7fe3f2" /><circle cx="4" cy="-5" r="2.3" fill="#7fe3f2" /><rect x="-11" y="8" width="22" height="12" rx="5" fill="#d0cdea" /><path d="M0 -16V-23" stroke="#8c88b4" strokeWidth="2" /><circle cx="0" cy="-25" r="2.6" fill="#f3c557" /></g>
  </Frame>;
}

/** The hero: a learning base, deliberately not any one course or mission. */
export function DiscoveryArt() {
  const id = useId();
  return <Frame viewBox="0 0 420 260" className="ls-float">
    <defs><radialGradient id={`${id}-sun`}><stop offset="0" stopColor="#fff3c4" /><stop offset="1" stopColor="#ffd77a" /></radialGradient></defs>
    <circle cx="96" cy="58" r="30" fill={`url(#${id}-sun)`} /><Cloud x={350} y={52} s={1.1} /><Cloud x={40} y={120} s={.75} />
    <g transform="translate(50 42)"><Island id={id} top="#e79a68" topDark="#c8714a" rock="#b9694a" rockDark="#7d4230" />
      <g transform="translate(112 74)"><path d="M0 54 A50 50 0 0 1 100 54 Z" fill="#dff2f5" opacity=".9" /><path d="M50 4V54M15 19L50 54M85 19L50 54M0 54H100M22 54 A28 50 0 0 1 78 54" stroke="#9ec6d2" strokeWidth="1.5" fill="none" /><circle cx="36" cy="44" r="7" fill="#5ea86d" /><circle cx="58" cy="40" r="9" fill="#4f9d57" /></g>
      <rect x="204" y="94" width="50" height="34" rx="14" fill="#f6efe6" /><rect x="218" y="104" width="20" height="24" rx="10" fill="#ffc861" />
      <path d="M232 94 L240 60" stroke="#7d7a9e" strokeWidth="3" /><path d="M224 62 A18 18 0 0 0 258 54 Z" fill="#efeaf7" />
      <g transform="translate(64 108) skewX(-14)"><rect width="36" height="20" rx="2" fill="#3f4f9a" /><path d="M12 0V20M24 0V20M0 10H36" stroke="#a9b6ee" strokeWidth="1" /></g>
    </g>
  </Frame>;
}

export function IdeaArt() {
  return <Frame viewBox="0 0 150 130" className="ls-spot"><g stroke="#f2b632" strokeWidth="4" strokeLinecap="round"><path d="M75 6V16M36 20L43 28M114 20L107 28M22 56H32M128 56H118" /></g><circle cx="75" cy="52" r="24" fill="#ffe08a" /><path d="M66 72H84V82H66Z" fill="#b9a26f" /><path d="M67 54L75 62L83 54M75 62V72" stroke="#c98a2a" strokeWidth="2.4" fill="none" /><rect x="34" y="88" width="84" height="15" rx="4" fill="#8f73d9" /><rect x="26" y="103" width="98" height="15" rx="4" fill="#d9b48a" /><path d="M32 86C22 76 26 66 18 58C32 58 40 70 38 84Z" fill="#6fb46f" /></Frame>;
}

export function ReflectArt() {
  return <Frame viewBox="0 0 150 130" className="ls-spot"><path d="M42 44C30 44 26 26 42 24C44 8 72 6 78 22C94 14 110 30 98 44Z" fill="#fff" stroke="#b79cf0" strokeWidth="4" strokeLinejoin="round" /><rect x="30" y="58" width="82" height="62" rx="9" fill="#fdf4e2" stroke="#8f73d9" strokeWidth="3" transform="rotate(-6 70 90)" /><path d="M44 78H90M46 90H92M48 102H78" stroke="#c7b4ef" strokeWidth="3.4" strokeLinecap="round" transform="rotate(-6 70 90)" /><path d="M104 104L134 62L144 70L114 112L100 118Z" fill="#8f73d9" /><path d="M134 62L144 70" stroke="#f3c557" strokeWidth="6" /></Frame>;
}

/** The friendly star on the help card. It is a mascot, not an AI assistant. */
export function SparkStar() {
  const id = useId();
  return <Frame viewBox="0 0 120 120" className="ls-spot ls-float-b"><defs><linearGradient id={`${id}-star`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d5c2fb" /><stop offset="1" stopColor="#9a72ec" /></linearGradient></defs><path d="M60 12C66 12 69 20 73 34C75 40 78 42 84 43C98 45 108 48 108 55C108 62 98 69 90 76C86 79 85 83 86 88C89 100 90 108 84 110C78 112 70 104 62 98C60 96.500 60 96.500 58 98C50 104 42 112 36 110C30 108 31 100 34 88C35 83 34 79 30 76C22 69 12 62 12 55C12 48 22 45 36 43C42 42 45 40 47 34C51 20 54 12 60 12Z" fill={`url(#${id}-star)`} /><path d="M46 62C48 58 52 58 54 62M66 62C68 58 72 58 74 62M52 72C56 77 64 77 68 72" stroke="#3a2678" strokeWidth="3" fill="none" strokeLinecap="round" /></Frame>;
}

/** Portfolio card art for work that has no image of its own: the work type, not an invented project. */
export function WorkArt({ kind }) {
  const glyphs = {
    writing: <><rect x="112" y="40" width="96" height="104" rx="9" fill="#fffaf0" stroke="#b79cf0" strokeWidth="4" /><path d="M128 70H192M128 90H192M128 110H170" stroke="#c7b4ef" strokeWidth="6" strokeLinecap="round" /></>,
    code: <><rect x="88" y="44" width="144" height="96" rx="12" fill="#2e2a63" /><path d="M136 76L116 92L136 108M184 76L204 92L184 108M168 70L152 114" stroke="#7fe3f2" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>,
    model: <><path d="M160 34L222 68V128L160 160L98 128V68Z" fill="#cdbdf5" /><path d="M160 96L222 68M160 96L98 68M160 96V160" stroke="#6f4bd8" strokeWidth="5" /></>,
    image: <><rect x="88" y="44" width="144" height="100" rx="12" fill="#fff" stroke="#b79cf0" strokeWidth="4" /><path d="M100 132L142 88L172 118L190 102L222 132Z" fill="#8f73d9" /><circle cx="196" cy="72" r="11" fill="#f3c557" /></>,
    recording: <><rect x="142" y="36" width="36" height="72" rx="18" fill="#6f4bd8" /><path d="M122 86C122 136 198 136 198 86M160 124V150M136 152H184" stroke="#6f4bd8" strokeWidth="7" fill="none" strokeLinecap="round" /></>
  };
  return <Frame viewBox="0 0 320 180" className="ls-work-art"><rect width="320" height="180" fill="#f1eafd" /><circle cx="44" cy="30" r="46" fill="#fff" opacity=".6" /><circle cx="286" cy="160" r="60" fill="#e4d8fb" />{glyphs[kind] || glyphs.writing}</Frame>;
}
