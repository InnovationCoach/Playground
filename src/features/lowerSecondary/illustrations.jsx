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

function Cloud({ x, y, s = 1, fill = '#fff', opacity = 0.92 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      <ellipse cx="2" cy="4" rx="24" ry="8" fill="#d9cef2" opacity=".35" />
      <ellipse cx="0" cy="0" rx="23" ry="9" fill={fill} />
      <circle cx="-9" cy="-6" r="10" fill={fill} />
      <circle cx="6" cy="-8" r="12" fill={fill} />
      <circle cx="16" cy="-2" r="7" fill={fill} />
    </g>
  );
}

function Sparkle({ x, y, s = 1, color = '#f6c453' }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 -8 C1.5 -2 2 -1.5 8 0 C2 1.5 1.5 2 0 8 C-1.5 2 -2 1.5 -8 0 C-2 -1.5 -1.5 -2 0 -8 Z"
      fill={color}
    />
  );
}

/** The rocky underside, crystal facets, and layered grassy top every island shares. */
function Island({ id, top = '#7ed175', topDark = '#459c56', rock = '#9d7967', rockDark = '#62463d', accent = '#a8e89c' }) {
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={topDark} />
        </linearGradient>
        <linearGradient id={`${id}-rock`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={rock} />
          <stop offset="1" stopColor={rockDark} />
        </linearGradient>
        <radialGradient id={`${id}-shadow`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#43238f" stopOpacity=".16" />
          <stop offset="1" stopColor="#43238f" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Floating ambient shadow */}
      <ellipse cx="160" cy="210" rx="76" ry="7" fill={`url(#${id}-shadow)`} />
      {/* Floating mini-pebbles */}
      <polygon points="64,174 72,182 60,185" fill={rock} opacity=".8" />
      <polygon points="252,178 262,184 254,190" fill={rockDark} opacity=".75" />
      <polygon points="154,208 164,213 158,217" fill={rockDark} opacity=".6" />
      {/* Mainfaceted rock base */}
      <path
        d="M40 136 C70 150 250 150 280 136 L262 165 L238 172 L222 194 L194 186 L174 206 L148 191 L126 201 L106 177 L80 173 L62 155 Z"
        fill={`url(#${id}-rock)`}
      />
      {/* Low-poly rock facet shading */}
      <path
        d="M106 177 L126 201 L136 162 Z M194 186 L174 206 L166 164 Z M62 155 L80 173 L96 154 Z M238 172 L222 194 L208 162 Z"
        fill={rockDark}
        opacity=".48"
      />
      <path
        d="M136 162 L148 191 L166 164 Z M96 154 L106 177 L136 162 Z"
        fill="#fff"
        opacity=".08"
      />
      {/* Grass rim and sunlit plateau */}
      <ellipse cx="160" cy="134" rx="122" ry="25" fill={`url(#${id}-top)`} />
      <ellipse cx="160" cy="129" rx="113" ry="19" fill={top} opacity=".75" />
      <ellipse cx="152" cy="126" rx="88" ry="12" fill={accent} opacity=".45" />
    </g>
  );
}

function Tree({ x, y, s = 1, leaf = '#3f9a5c', highlight = '#74d17c' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="10" rx="8" ry="3" fill="#255c39" opacity=".25" />
      <rect x="-2.2" y="-2" width="4.4" height="12" rx="1.8" fill="#7a5a44" />
      <path d="M0 -28 L13 -8 H-13 Z" fill={leaf} />
      <path d="M0 -28 L0 -8 H-13 Z" fill={highlight} opacity=".45" />
      <path d="M0 -17 L15 4 H-15 Z" fill={leaf} opacity=".92" />
      <path d="M0 -17 L0 4 H-15 Z" fill={highlight} opacity=".35" />
    </g>
  );
}

export function ScienceIsland() {
  const id = useId();
  return (
    <Frame className="ls-float">
      <defs>
        <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b3ecff" />
          <stop offset="1" stopColor="#48a9e6" />
        </linearGradient>
        <linearGradient id={`${id}-dome`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e2ddfa" />
          <stop offset="1" stopColor="#a799e6" />
        </linearGradient>
      </defs>
      <Sparkle x={62} y={26} s={0.75} color="#ffd166" />
      <Sparkle x={246} y={32} s={0.6} color="#8ecae6" />
      <Cloud x={46} y={48} />
      <Cloud x={274} y={68} s={0.82} />
      <Island id={id} top="#6fd08c" topDark="#359268" rock="#88747c" rockDark="#564754" accent="#aef2c0" />
      <Tree x={68} y={122} leaf="#2d8a61" highlight="#6ee0a5" />
      <Tree x={90} y={129} s={0.78} leaf="#3ca374" highlight="#88f0b9" />
      <Tree x={256} y={120} s={0.85} leaf="#2d8a61" highlight="#6ee0a5" />
      {/* Observatory base & dome */}
      <rect x="128" y="84" width="68" height="44" rx="6" fill="#fbf7f0" stroke="#dfd5c6" strokeWidth="1.5" />
      <rect x="128" y="116" width="68" height="12" rx="3" fill="#e6dccf" />
      <path d="M122 86 A40 38 0 0 1 202 86 Z" fill={`url(#${id}-dome)`} />
      <path d="M142 86 A20 28 0 0 1 182 86" fill="#8c7cd4" opacity=".6" />
      {/* Telescope & lens glow */}
      <g transform="rotate(-26 164 56)">
        <rect x="160" y="44" width="52" height="13" rx="6.5" fill="#4f437a" />
        <rect x="198" y="42" width="14" height="17" rx="4" fill="#6f5fa6" />
        <circle cx="212" cy="50.5" r="5.5" fill="#90e0ef" />
      </g>
      <circle cx="206" cy="24" r="7" fill="#ffd166" />
      <circle cx="206" cy="24" r="12" fill="#ffd166" opacity=".25" />
      {/* Archway & windows */}
      <rect x="154" y="100" width="16" height="28" rx="8" fill="#5a2fd0" />
      <circle cx="141" cy="100" r="5" fill="#8ecae6" />
      <circle cx="183" cy="100" r="5" fill="#8ecae6" />
      {/* Sparkling waterfall & lagoon */}
      <ellipse cx="206" cy="136" rx="16" ry="5" fill="#72ddf7" />
      <path d="M198 136 C202 152 196 172 200 198 L216 198 C212 172 218 152 214 136 Z" fill={`url(#${id}-water)`} />
      <path d="M204 142 V192 M210 148 V186" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity=".7" />
      <circle cx="202" cy="198" r="4" fill="#fff" opacity=".8" />
      <circle cx="212" cy="199" r="5" fill="#fff" opacity=".8" />
      {/* Solar array */}
      <g transform="translate(220 110) skewX(-14)">
        <rect width="32" height="19" rx="3" fill="#2c3e8f" stroke="#c8d6ff" strokeWidth="1.2" />
        <path d="M11 0V19M21 0V19M0 9.5H32" stroke="#8fa8ff" strokeWidth="1" />
      </g>
    </Frame>
  );
}

export function DesignIsland() {
  const id = useId();
  return (
    <Frame className="ls-float ls-float-b">
      <Sparkle x={54} y={32} s={0.7} color="#f49ac1" />
      <Sparkle x={264} y={26} s={0.75} color="#ffd166" />
      <Cloud x={40} y={60} s={0.82} />
      <Cloud x={280} y={44} />
      <Island id={id} top="#f3b2d2" topDark="#c77fb0" rock="#9e7f9d" rockDark="#674b6e" accent="#ffd6eb" />
      {/* Sculpted blossom tree */}
      <ellipse cx="76" cy="128" rx="14" ry="4" fill="#7c4768" opacity=".25" />
      <path d="M73 128 V90 C73 84 66 78 62 74 M77 128 V88 C77 82 84 78 88 74" stroke="#755240" strokeWidth="5" strokeLinecap="round" fill="none" />
      <circle cx="76" cy="72" r="24" fill="#f28db9" />
      <circle cx="57" cy="84" r="15" fill="#f9b4d2" />
      <circle cx="95" cy="84" r="16" fill="#e673a7" />
      <circle cx="72" cy="64" r="14" fill="#ffd0e5" opacity=".7" />
      {/* Curved Design Pavilion */}
      <path d="M118 128 V82 C118 58 216 50 228 78 V128 Z" fill="#fff5eb" stroke="#edd8c7" strokeWidth="1.5" />
      <path d="M110 86 C126 46 224 38 238 82 L228 80 C210 58 136 64 120 88 Z" fill="#cf6ba0" />
      <rect x="134" y="84" width="38" height="44" rx="19" fill="#ffe094" stroke="#d99748" strokeWidth="1.8" />
      <path d="M153 84V128M134 106H172" stroke="#d99748" strokeWidth="1.6" />
      {/* Outdoor easel & canvas */}
      <path d="M194 128 L206 90 L218 128 M206 90 V128" stroke="#8a6545" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <rect x="188" y="68" width="36" height="30" rx="3.5" fill="#fff" stroke="#e2d4f0" strokeWidth="1.5" />
      <path d="M191 94 L202 80 L211 89 L217 82 L222 94 Z" fill="#9a7df0" />
      <circle cx="215" cy="76" r="3.8" fill="#ffb703" />
      {/* Artist color palette */}
      <g transform="translate(248 124) rotate(-12)">
        <ellipse rx="20" ry="12.5" fill="#fff8ee" stroke="#decbb6" strokeWidth="1.2" />
        <circle cx="-8" cy="-3" r="3" fill="#ea5d92" />
        <circle cx="0" cy="-6" r="3" fill="#ffb703" />
        <circle cx="8" cy="-3" r="3" fill="#5a2fd0" />
        <circle cx="9" cy="4" r="3" fill="#2bb673" />
      </g>
    </Frame>
  );
}

export function TechnologyIsland() {
  const id = useId();
  return (
    <Frame className="ls-float ls-float-c">
      <Sparkle x={58} y={24} s={0.65} color="#7fe3f2" />
      <Sparkle x={236} y={28} s={0.75} color="#a992fa" />
      <Cloud x={50} y={42} s={0.85} />
      <Cloud x={280} y={64} s={0.9} />
      <Island id={id} top="#88d9e6" topDark="#4ea3bd" rock="#7f87a6" rockDark="#4f5675" accent="#c2f2fa" />
      {/* Clean-tech Robotics Lab */}
      <rect x="110" y="76" width="104" height="52" rx="14" fill="#f0effa" stroke="#d5d1f0" strokeWidth="1.5" />
      <rect x="110" y="112" width="104" height="16" rx="4" fill="#d8d4f2" />
      {/* Code terminal window */}
      <rect x="122" y="88" width="42" height="26" rx="6" fill="#231c4c" />
      <path d="M134 97 L128 101 L134 105 M152 97 L158 101 L152 105 M145 95 L141 107" stroke="#64dfdf" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Portal door */}
      <rect x="174" y="90" width="26" height="38" rx="13" fill="#5a2fd0" />
      <circle cx="194" cy="110" r="2" fill="#ffd166" />
      {/* Telemetry dish & signal waves */}
      <path d="M122 76 L130 58" stroke="#5f5b8a" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M112 58 A20 20 0 0 0 148 50 Z" fill="#cbc7eb" />
      <circle cx="132" cy="48" r="2.8" fill="#64dfdf" />
      <path d="M136 42 A10 10 0 0 1 144 50" stroke="#64dfdf" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* Wind turbine */}
      <path d="M249 128 L252 62 L255 128 Z" fill="#f7f6fd" />
      <g transform="translate(252 62)" fill="#fff" stroke="#cbc7eb" strokeWidth="0.8">
        <path d="M0 0 L5 -27 L-3 -25 Z" />
        <path d="M0 0 L23 16 L25 8 Z" />
        <path d="M0 0 L-25 12 L-20 18 Z" />
      </g>
      <circle cx="252" cy="62" r="4" fill="#6f4bd8" />
      {/* Friendly Companion Rover */}
      <g transform="translate(76 110)">
        <ellipse cx="0" cy="21" rx="14" ry="3.5" fill="#2b586e" opacity=".25" />
        <rect x="-16" y="-17" width="32" height="24" rx="11" fill="#fff" stroke="#d5d1f0" strokeWidth="1.5" />
        <rect x="-11" y="-12" width="22" height="13" rx="6.5" fill="#231c4c" />
        <circle cx="-4.5" cy="-5.5" r="2.5" fill="#64dfdf" />
        <circle cx="4.5" cy="-5.5" r="2.5" fill="#64dfdf" />
        <rect x="-11" y="7" width="22" height="12" rx="5" fill="#d8d4f2" />
        <path d="M0 -17V-24" stroke="#7f7aa8" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="0" cy="-26" r="3.2" fill="#ffb703" />
      </g>
    </Frame>
  );
}

/** The hero: a learning base, deliberately not any one course or mission. */
export function DiscoveryArt() {
  const id = useId();
  return (
    <Frame viewBox="0 0 420 260" className="ls-float">
      <defs>
        <radialGradient id={`${id}-sun`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff8d6" />
          <stop offset="0.55" stopColor="#ffd66b" />
          <stop offset="1" stopColor="#ffb703" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-dome`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".92" />
          <stop offset="0.5" stopColor="#d9f4fa" stopOpacity=".85" />
          <stop offset="1" stopColor="#b8e2f4" stopOpacity=".9" />
        </linearGradient>
      </defs>
      {/* Sun & corona */}
      <circle cx="92" cy="58" r="46" fill={`url(#${id}-sun)`} />
      <circle cx="92" cy="58" r="26" fill="#ffdf7c" />
      <Sparkle x={156} y={34} s={0.85} color="#f6c453" />
      <Sparkle x={316} y={38} s={0.7} color="#b392f0" />
      <Sparkle x={54} y={96} s={0.6} color="#f6c453" />
      <Cloud x={348} y={50} s={1.08} />
      <Cloud x={42} y={124} s={0.78} />
      <g transform="translate(50 40)">
        <Island id={id} top="#f2a672" topDark="#cc704b" rock="#b36146" rockDark="#753928" accent="#ffd1ad" />
        {/* Botanical Geodesic Biodome */}
        <g transform="translate(108 70)">
          <path d="M0 58 A54 54 0 0 1 108 58 Z" fill={`url(#${id}-dome)`} />
          <circle cx="38" cy="46" r="9" fill="#52b788" />
          <circle cx="62" cy="40" r="12" fill="#2d936c" />
          <circle cx="76" cy="48" r="7" fill="#74c69d" />
          <path d="M54 4V58M16 20L54 58M92 20L54 58M0 58H108M24 58 A30 54 0 0 1 84 58" stroke="#8ecae6" strokeWidth="1.6" fill="none" />
          <path d="M18 36 A44 44 0 0 1 50 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".8" />
        </g>
        {/* Research Pod & Dish */}
        <rect x="206" y="92" width="54" height="36" rx="15" fill="#fff8f0" stroke="#e5d4c0" strokeWidth="1.5" />
        <rect x="221" y="102" width="22" height="26" rx="11" fill="#ffb703" />
        <circle cx="248" cy="106" r="4" fill="#8ecae6" />
        <path d="M234 92 L242 58" stroke="#6c698d" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M226 60 A18 18 0 0 0 260 52 Z" fill="#e9e3f8" />
        <circle cx="245" cy="50" r="2.8" fill="#5a2fd0" />
        {/* Solar Array */}
        <g transform="translate(58 106) skewX(-14)">
          <rect width="40" height="22" rx="3" fill="#324396" stroke="#c8d6ff" strokeWidth="1.2" />
          <path d="M13 0V22M27 0V22M0 11H40" stroke="#99b2ff" strokeWidth="1.1" />
        </g>
      </g>
    </Frame>
  );
}

export function IdeaArt() {
  return (
    <Frame viewBox="0 0 150 130" className="ls-spot">
      <g stroke="#f4b428" strokeWidth="4" strokeLinecap="round">
        <path d="M75 6V16M36 20L43 28M114 20L107 28M22 56H32M128 56H118" />
      </g>
      <circle cx="75" cy="52" r="25" fill="#ffe17d" stroke="#f2b632" strokeWidth="2" />
      <circle cx="67" cy="44" r="6" fill="#fff" opacity=".65" />
      <path d="M66 72H84V83A4 4 0 0 1 80 87H70A4 4 0 0 1 66 83Z" fill="#9e8c6c" />
      <path d="M67 54L75 62L83 54M75 62V72" stroke="#c98a2a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <rect x="34" y="88" width="84" height="15" rx="4.5" fill="#7c56e0" />
      <rect x="26" y="103" width="98" height="15" rx="4.5" fill="#e0b684" />
      <path d="M32 86C22 76 26 66 18 58C32 58 40 70 38 84Z" fill="#58b368" />
    </Frame>
  );
}

export function ReflectArt() {
  return (
    <Frame viewBox="0 0 150 130" className="ls-spot">
      <path d="M42 44C30 44 26 26 42 24C44 8 72 6 78 22C94 14 110 30 98 44Z" fill="#fff" stroke="#a685ec" strokeWidth="4" strokeLinejoin="round" />
      <rect x="30" y="58" width="82" height="62" rx="10" fill="#fff7e8" stroke="#7c56e0" strokeWidth="3" transform="rotate(-6 70 90)" />
      <path d="M44 78H90M46 90H92M48 102H78" stroke="#bda5f0" strokeWidth="3.6" strokeLinecap="round" transform="rotate(-6 70 90)" />
      <path d="M104 104L134 62L144 70L114 112L100 118Z" fill="#7c56e0" />
      <path d="M134 62L144 70" stroke="#ffb703" strokeWidth="6" strokeLinecap="round" />
    </Frame>
  );
}

/** The friendly star on the help card. It is a mascot, not an AI assistant. */
export function SparkStar() {
  const id = useId();
  return (
    <Frame viewBox="0 0 120 120" className="ls-spot ls-float-b">
      <defs>
        <linearGradient id={`${id}-star`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e5d4ff" />
          <stop offset="0.5" stopColor="#b892f7" />
          <stop offset="1" stopColor="#7e4eea" />
        </linearGradient>
      </defs>
      <Sparkle x={18} y={24} s={0.55} color="#ffd166" />
      <Sparkle x={104} y={22} s={0.45} color="#b892f7" />
      <path
        d="M60 12C66 12 69 20 73 34C75 40 78 42 84 43C98 45 108 48 108 55C108 62 98 69 90 76C86 79 85 83 86 88C89 100 90 108 84 110C78 112 70 104 62 98C60 96.5 60 96.5 58 98C50 104 42 112 36 110C30 108 31 100 34 88C35 83 34 79 30 76C22 69 12 62 12 55C12 48 22 45 36 43C42 42 45 40 47 34C51 20 54 12 60 12Z"
        fill={`url(#${id}-star)`}
        stroke="#8d62ec"
        strokeWidth="1.5"
      />
      <ellipse cx="43" cy="67" rx="4.5" ry="2.5" fill="#f49ac1" opacity=".55" />
      <ellipse cx="77" cy="67" rx="4.5" ry="2.5" fill="#f49ac1" opacity=".55" />
      <path d="M46 61C48 57 52 57 54 61M66 61C68 57 72 57 74 61M52 72C56 77 64 77 68 72" stroke="#2d1963" strokeWidth="3" fill="none" strokeLinecap="round" />
    </Frame>
  );
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
