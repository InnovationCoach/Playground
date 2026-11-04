/**
 * The SPARK wordmark: a four-point spark in WeLearn lime with a purple dot,
 * then "SPARK". It sits beside the WeLearn logo, which already carries the
 * WeLearn name.
 */
export function SparkGlyph({ size = 20 }) {
  return (
    <svg className="sk-glyph" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#96d700" d="M12 1.5c.6 4.7 2.4 6.9 7.1 7.9-4.7 1-6.5 3.2-7.1 7.9-.6-4.7-2.4-6.9-7.1-7.9 4.7-1 6.5-3.2 7.1-7.9Z" />
      <circle cx="19" cy="19" r="2.2" fill="#8250a0" />
    </svg>
  );
}

export function SparkWordmark({ full = false, size = 18 }) {
  return (
    <span className="sk-wordmark">
      <SparkGlyph size={size} />
      {full && <span className="sk-wordmark-we">WeLearn</span>}
      <span className="sk-wordmark-spark">SPARK</span>
    </span>
  );
}
