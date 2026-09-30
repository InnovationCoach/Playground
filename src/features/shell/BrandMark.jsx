import { useState } from 'react';
import { LOGO_URL } from '../../app/brand.js';

/**
 * The WeLearn logo followed by "Growth Hub". The logo already carries the
 * WeLearn name, so the text does not repeat it. It sits on a light rounded badge:
 * its purple lettering all but disappears on the dark header otherwise. If the image
 * cannot load (offline classroom, blocked CDN) the full name is shown instead,
 * so the header is never an empty box.
 */
export function BrandMark({ size = 36 }) {
  const [failed, setFailed] = useState(false);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
      {!failed && (
        <img src={LOGO_URL} alt="WeLearn" height={size}
             style={{ height: size, width: 'auto', display: 'block', borderRadius: 8, background: '#f8fafc', padding: '3px 8px', boxSizing: 'border-box' }}
             onError={() => setFailed(true)} />
      )}
      <span style={{ whiteSpace: 'nowrap' }}>{failed ? 'WeLearn Growth Hub' : 'Growth Hub'}</span>
    </span>
  );
}
