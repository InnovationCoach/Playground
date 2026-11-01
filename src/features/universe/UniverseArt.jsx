import { useEffect, useRef, useState } from 'react';
import { PALETTES, gravityPose } from './universeModel.js';

export function AssetArt({ type }) {
  switch (type) {
    case 'fern': return <g><path d="M0 0v-65" stroke="#3d7482" strokeWidth="5"/><path d="M-1-20c-42 0-48-25-42-36 27-1 40 13 42 36Zm2-17c38 2 43-27 37-39-27 2-39 17-37 39Zm-2-13c-30-5-32-24-27-32 19 1 28 12 27 32Z" fill="#a8d76f"/><path d="m-30-48 28 26m26-42L2-38" stroke="#5f9c80" strokeWidth="2"/><ellipse cy="2" rx="18" ry="5" fill="#829e96" opacity=".3"/></g>;
    case 'tree': return <g><path d="M0 0v-96m0 48-22-24m22 11 24-24" stroke="#786681" strokeWidth="7" strokeLinecap="round"/><circle cx="-26" cy="-92" r="31" fill="#b4dba8"/><circle cx="26" cy="-100" r="33" fill="#a0c9bf"/><circle cy="-119" r="32" fill="#c5e4a8"/><circle cx="8" cy="-135" r="5" fill="#e9f5d1"/></g>;
    case 'mushroom': return <g><path d="m-15-4 8-58h17l10 58Z" fill="#efe4d5"/><path d="M-53-52c2-57 100-63 106 0-29 14-76 13-106 0Z" fill="#b79ccd"/><path d="M-49-51c27-12 68-9 98 0-33 13-69 12-98 0Z" fill="#d8c3e4"/><circle cx="-22" cy="-73" r="7" fill="#f7e9dc"/><circle cx="12" cy="-85" r="9" fill="#f7e9dc"/><circle cx="31" cy="-66" r="5" fill="#f7e9dc"/></g>;
    case 'flower': return <g>{[-24, 0, 24].map((x, i) => <g key={x} transform={`translate(${x} ${i === 1 ? -15 : 0})`}><path d="M0 0v-25" stroke="#6f9b7f" strokeWidth="3"/><path d="m0-45 5 12 12 5-12 5-5 12-5-12-12-5 12-5Z" fill={i === 1 ? '#e2bd77' : '#d6a7c8'}/><circle cy="-28" r="4" fill="#fff7d2"/></g>)}</g>;
    case 'crystal': return <g><path d="m-35-8 2-45 18-17 18 23-2 44Z" fill="#91cbdc"/><path d="m-12-1 1-88 22-28 24 30 1 80Z" fill="#c6b3ef"/><path d="m11-117 2 109 23 1-1-80Z" fill="#a18bce"/><path d="m28-3 1-48 17-14 18 18-8 40Z" fill="#afe4da"/><path d="m-11-89 24 16 22-14" fill="none" stroke="#e4d7fc" strokeWidth="2"/><path d="m-44-91 4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" fill="#f5edff"/></g>;
    case 'rock': return <g><path d="m-50-6 9-23 22-14 25 7 11 30Z" fill="#b6b6c7"/><path d="m-19-43 4 36 32 1L6-36Z" fill="#8e91ac"/><path d="m9-3 7-24 22-10 25 29-9 10Z" fill="#cec7d6"/></g>;
    case 'pond': return <g><ellipse cy="-8" rx="62" ry="26" fill="#8e9abf"/><ellipse cy="-12" rx="55" ry="21" fill="#9cdbec"/><path d="M-28-13h33m-5 9h27" stroke="#e7fbff" strokeWidth="3" strokeLinecap="round"/><ellipse cx="29" cy="-20" rx="11" ry="5" fill="#badca3"/></g>;
    case 'dome': return <g><ellipse cy="-3" rx="74" ry="19" fill="#8f8eaf"/><path d="M-68-15v-29a68 68 0 0 1 136 0v29Z" fill="#d8d4ee" stroke="#858ba7" strokeWidth="3"/><path d="M-61-30a61 61 0 0 1 122 0" fill="#afcee4"/><path d="M-45-64c13-27 33-35 54-35" fill="none" stroke="#e8f3ff" strokeWidth="8" strokeLinecap="round" opacity=".7"/><path d="M-68-22c40 16 96 16 136 0" fill="none" stroke="#8999be" strokeWidth="3"/><path d="M-13-8v-38a13 13 0 0 1 26 0v38" fill="#6c7196"/><path d="M-14 0h28l9 14h-46Z" fill="#c2b5d0"/><circle cx="43" cy="-36" r="6" fill="#d6f4a5"/></g>;
    case 'observatory': return <g><path d="M-38-4v-73h76v73Z" fill="#bcc7df"/><path d="M-48-72a48 48 0 0 1 96 0Z" fill="#b29acb"/><path d="M-12-75v-45" stroke="#e6dcef" strokeWidth="11"/><g transform="translate(10 -112) rotate(-27)"><rect x="-13" y="-9" width="65" height="18" rx="4" fill="#7d779e"/><rect x="42" y="-13" width="12" height="26" rx="3" fill="#d6d9e9"/><path d="m3 10-18 23m35-23 4 23" stroke="#7d779e" strokeWidth="4"/></g><rect x="-10" y="-35" width="20" height="31" rx="9" fill="#8389ae"/><circle cx="-25" cy="-56" r="7" fill="#e0f1b9"/></g>;
    case 'arch': return <g><path d="M-44 0v-65a44 44 0 0 1 88 0v65H24v-65a24 24 0 0 0-48 0V0Z" fill="#c1b5d0" stroke="#9e92b1" strokeWidth="2"/><path d="M-44-42h20m48 0h20M-44-18h20m48 0h20M-18-101l7 18m27-18-7 18" stroke="#e2d8eb" strokeWidth="2"/></g>;
    case 'bridge': return <g><path d="m-75-10 25-20h100l25 20H-75Z" fill="#c5b1ce"/>{[-58, -30, 0, 30, 58].map(x => <path key={x} d={`M${x}-11v-23`} stroke="#9182a5" strokeWidth="3"/>)}<path d="M-62-35h124M-70 0h140" stroke="#aa97b7" strokeWidth="4"/></g>;
    case 'solar': return <g><path d="m-54-34 17-44h78l17 44h-112Z" fill="#6d8cb8" stroke="#c4d8e9" strokeWidth="3"/><path d="m-12-76-4 40m28-40 5 40M-43-56h91" stroke="#a8c3e1" strokeWidth="2"/><path d="M0-33v31m-26 0h52" stroke="#a5a3bb" strokeWidth="5"/></g>;
    case 'beacon': return <g><path d="m-24 0 12-68h24L24 0Z" fill="#a7adc9"/><path d="M0-69v-28" stroke="#c3bfda" strokeWidth="4"/><circle cy="-101" r="10" fill="#d4ef9d"/><circle cy="-101" r="19" fill="none" stroke="#e4f5c4" opacity=".5"/><path d="m-12-43 24 15m-29 13 34-23" stroke="#d7d9e9" strokeWidth="3"/></g>;
    case 'portal': return <g><ellipse cy="-54" rx="36" ry="54" fill="#9b88c4" stroke="#cbbbe8" strokeWidth="8"/><ellipse cy="-54" rx="25" ry="42" fill="#cec2ed"/><path d="m0-76 6 17 15 5-15 5-6 17-6-17-15-5 15-5Z" fill="#f1edff"/><path d="M-44 0h88" stroke="#aaa1be" strokeWidth="8" strokeLinecap="round"/></g>;
    case 'bench': return <g><path d="M-35-6v-32h70v26M-43-10h86M-35-34v-20h70v20m-60 24V3m50-13V3" stroke="#aa8faf" strokeWidth="7" strokeLinecap="round"/><path d="M-34-51h68" stroke="#d6c0d5" strokeWidth="4"/></g>;
    case 'flag': return <g><path d="M-13 0v-102" stroke="#a3a9be" strokeWidth="4"/><path d="M-11-101h61l-14 23 14 20h-61Z" fill="#c2de8b"/><path d="m9-92 4 9 9 4-9 4-4 9-4-9-9-4 9-4Z" fill="#65835a"/></g>;
    case 'lamp': return <g><path d="M0 0v-91" stroke="#8e92af" strokeWidth="5"/><ellipse cy="1" rx="16" ry="5" fill="#9ca2b7"/><circle cy="-100" r="17" fill="#edf3c7"/><ellipse cy="-100" rx="28" ry="8" transform="rotate(-25 0 -100)" fill="none" stroke="#b4a6cf" strokeWidth="4"/><circle cy="-100" r="30" fill="#f3f5d5" opacity=".09"/></g>;
    case 'terrarium': return <g><path d="M-30-5v-52a30 30 0 0 1 60 0v52Z" fill="#c8e0e6" fillOpacity=".6" stroke="#9bb8ca" strokeWidth="3"/><ellipse cy="-5" rx="30" ry="8" fill="#b8c7a3"/><path d="M0-9v-37m0 17c-17 1-20-13-18-16 13 0 18 5 18 16Zm0-10c16 0 20-12 18-17-14 0-20 7-18 17Z" stroke="#85ab7a" strokeWidth="3" fill="#b2d291"/><path d="M-20-38v-15" stroke="#f3ffff" strokeWidth="4" strokeLinecap="round"/></g>;
    case 'moon': return <g><ellipse cy="-5" rx="31" ry="8" fill="#aaa3c1" opacity=".3"/><circle cy="-72" r="39" fill="#e2d9ef"/><circle cx="13" cy="-80" r="9" fill="#c7bcd8"/><circle cx="-13" cy="-57" r="6" fill="#c7bcd8"/><circle cx="-14" cy="-90" r="4" fill="#c7bcd8"/><ellipse cy="-72" rx="53" ry="15" transform="rotate(-20 0 -72)" fill="none" stroke="#bbcce2" strokeWidth="5"/></g>;
    case 'waterfall': return <g><path d="m-44-5 10-85 26-15 35 13 20 87Z" fill="#afa7c6"/><path d="m-10-96-4 82h31l-5-80Z" fill="#b6e3f2"/><path d="m-3-82-2 62m11-64 2 64" stroke="#e2f9ff" strokeWidth="3" strokeLinecap="round"/><ellipse cy="-2" rx="51" ry="16" fill="#a4d5e6"/><path d="M-29-2h22m14 4h21" stroke="#d4f7fc" strokeWidth="3"/></g>;
    default: return null;
  }
}

export function CreatureArt({ creature }) {
  const color = PALETTES.find(p => p.id === creature.palette)?.color || '#a58bd4';
  return <g>
    {creature.body === 'mushroom' ? <><path d="M-23-4c-10-18-9-44 0-55h46c9 11 10 37 0 55Z" fill="#f1e5d7"/><path d="M-46-53c0-58 92-58 92 0-24 14-68 14-92 0Z" fill={color}/><circle cx="-20" cy="-72" r="7" fill="#fff5e6"/><circle cx="10" cy="-80" r="9" fill="#fff5e6"/><circle cx="29" cy="-62" r="4" fill="#fff5e6"/></> : creature.body === 'robot' ? <><rect x="-30" y="-70" width="60" height="62" rx="17" fill={color}/><rect x="-23" y="-58" width="46" height="30" rx="11" fill="#edf0f5"/><path d="M0-72v-12" stroke={color} strokeWidth="4"/><circle cy="-87" r="6" fill="#d6ef9e"/><path d="m-29-29-14 10m72-10 14 10" stroke={color} strokeWidth="7" strokeLinecap="round"/></> : <><path d="M-37-11c-15-36-6-74 30-72 42-4 63 62 29 76-14 7-47 6-59-4Z" fill={color}/><path d="M-19-65c3-6 9-8 14-7" stroke="#ffffff70" strokeWidth="5" strokeLinecap="round"/></>}
    {creature.trait === 'sleepy' ? <path d="m-17-39 10 2m14 0 10-2" stroke="#424663" strokeWidth="3" strokeLinecap="round"/> : <><ellipse cx="-12" cy="-38" rx="3.5" ry={creature.trait === 'energetic' ? 6 : 5} fill="#424663"/><ellipse cx="12" cy="-38" rx="3.5" ry={creature.trait === 'energetic' ? 6 : 5} fill="#424663"/></>}
    <path d="M-5-26q5 5 10 0" stroke="#715d77" strokeWidth="2" fill="none" strokeLinecap="round"/><ellipse cx="-22" cy="-28" rx="5" ry="3" fill="#efb7ba" opacity=".7"/><ellipse cx="22" cy="-28" rx="5" ry="3" fill="#efb7ba" opacity=".7"/>
    {creature.accessory === 'boots' ? <><path d="M-23-11v12h20v-12m6 0V1h20v-12" fill="#666386"/><path d="M-25 1h23M2 1h24" stroke="#b7acda" strokeWidth="4" strokeLinecap="round"/></> : <><ellipse cx="-12" cy="-4" rx="9" ry="5" fill="#7c7294"/><ellipse cx="12" cy="-4" rx="9" ry="5" fill="#7c7294"/></>}
    {creature.accessory === 'backpack' && <><rect x="21" y="-46" width="18" height="30" rx="6" fill="#a2bf89"/><path d="m23-41-10 15" stroke="#78936c" strokeWidth="3"/></>}
    {creature.accessory === 'headphones' && <><path d="M-37-40v-17a37 37 0 0 1 74 0v17" fill="none" stroke="#68748e" strokeWidth="6"/><rect x="-43" y="-47" width="12" height="24" rx="5" fill="#c6e29c"/><rect x="31" y="-47" width="12" height="24" rx="5" fill="#c6e29c"/></>}
    {creature.accessory === 'star-hat' && <path d="m0-114 8 18 20 2-15 13 4 20L0-71l-17 10 4-20-15-13 20-2Z" fill="#f1d887" stroke="#dfbd68" strokeWidth="2"/>}
  </g>;
}

export function CreatureMotion({ creature, gravity, running, calm, resetTick, stepTick }) {
  const elapsed = useRef(0), [pose, setPose] = useState({ height: 0, rotation: 0 });
  useEffect(() => { elapsed.current = 0; setPose({ height: 0, rotation: 0 }); }, [resetTick]);
  useEffect(() => { if (stepTick) { elapsed.current += .5; setPose(gravityPose(elapsed.current, gravity, creature.trait)); } }, [stepTick]);
  useEffect(() => {
    if (!running || calm) return;
    let frame, last = null, lastPaint = 0;
    const tick = time => {
      if (last !== null && !document.hidden) elapsed.current += Math.min((time - last) / 1000, .05);
      last = time;
      if (!document.hidden && time - lastPaint > 32) { setPose(gravityPose(elapsed.current, gravity, creature.trait)); lastPaint = time; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, calm, gravity, creature.trait]);
  return <g data-creature-height={Math.round(pose.height)} transform={`translate(0 ${-pose.height}) rotate(${pose.rotation})`}><CreatureArt creature={creature}/></g>;
}

export function WorldBackdrop({ theme, prefix }) {
  return <>
    <defs><linearGradient id={`${prefix}-sky`} x2="0" y2="1"><stop stopColor={theme === 'neon' ? '#292e55' : theme === 'orbital' ? '#cadceb' : '#dedbf0'}/><stop offset="1" stopColor={theme === 'neon' ? '#656083' : '#f0edf5'}/></linearGradient><linearGradient id={`${prefix}-land`} x2=".2" y2="1"><stop stopColor={theme === 'neon' ? '#8a83aa' : theme === 'orbital' ? '#c9d0de' : '#c7d2cb'}/><stop offset="1" stopColor={theme === 'neon' ? '#51516f' : '#999eb7'}/></linearGradient><radialGradient id={`${prefix}-glow`}><stop stopColor="#e6f1c5" stopOpacity=".9"/><stop offset="1" stopColor="#e6f1c5" stopOpacity="0"/></radialGradient></defs>
    <rect width="1000" height="600" fill={`url(#${prefix}-sky)`}/>
    {Array.from({ length: 38 }, (_, i) => { const x = (i * 137 + 43) % 1000, y = (i * 67 + 19) % 290; return <g key={i} opacity={theme === 'neon' ? .8 : .55}><circle cx={x} cy={y} r={i % 5 === 0 ? 2.2 : 1.1} fill="#fff"/>{i % 9 === 0 && <path d={`M${x - 5} ${y}h10m-5-5v10`} stroke="#fff" strokeWidth="1"/>}</g>; })}
    <circle cx="810" cy="104" r="78" fill={theme === 'neon' ? '#a796c8' : '#eee7f3'}/><circle cx="790" cy="83" r="14" fill="#c7bddc" opacity=".5"/><circle cx="837" cy="126" r="21" fill="#c7bddc" opacity=".45"/><ellipse cx="810" cy="104" rx="117" ry="26" transform="rotate(-26 810 104)" fill="none" stroke={theme === 'neon' ? '#d4c4ec' : '#c4b9d9'} strokeWidth="5"/>
    <circle cx="165" cy="150" r="25" fill="#c4d6e7"/><ellipse cx="165" cy="150" rx="43" ry="10" transform="rotate(23 165 150)" fill="none" stroke="#f1eff9" strokeWidth="3"/>
    <path d="M-35 272c61-35 77 12 123-8 43-21 76-11 111 13m530-45c54-34 90-12 119-21 38-13 64 13 111 8" fill="none" stroke="#ffffff" strokeWidth="24" strokeLinecap="round" opacity=".14"/>
    <ellipse cx="500" cy="535" rx="280" ry="23" fill="#686988" opacity=".13"/>
    <path d="M91 367q31 85 133 128l109 52 140 23 130-19 128-59 135-75 46-55Z" fill={`url(#${prefix}-land)`}/>
    <path d="m137 406 87 89 87 21-37-89m182 20 18 122 113-30 49-99m75-19-58 129 87-58 135-75" fill="#888ba5" opacity=".28"/>
    <path d="M91 367c18-92 170-151 409-151 228 0 389 53 412 146-21 92-199 128-412 130-213-2-389-39-409-125Z" fill={theme === 'neon' ? '#a1a5be' : theme === 'orbital' ? '#dde3e7' : '#d9e1d3'}/>
    <path d="M108 360c77-70 198-98 383-98 154 0 304 15 393 90" stroke={theme === 'neon' ? '#bcc1d0' : '#edf0e6'} strokeWidth="4" fill="none"/>
    <path d="M226 376c108-29 142 47 238 20 103-28 101-69 207-59" stroke={theme === 'neon' ? '#b9b7d1' : '#edf0e8'} strokeWidth="28" fill="none" strokeLinecap="round" opacity=".7"/>
    {[[130, 450, 45], [870, 476, 33], [760, 558, 24]].map(([x,y,s]) => <g key={x} transform={`translate(${x} ${y})`}><ellipse rx={s} ry={s * .26} fill="#cad1cf"/><path d={`M${-s} 0 0 ${s * .8} ${s} 0Z`} fill="#b0adc6"/></g>)}
    <circle cx="500" cy="440" r="200" fill={`url(#${prefix}-glow)`} opacity=".18"/>
  </>;
}
