const MAX_RAW = 64;
const UNIT_ALIASES = Object.freeze({
  h: ['h', 'hour', 'hours'], s: ['s', 'second', 'seconds'],
  days: ['d', 'day', 'days'], kg: ['kg'], 'm²': ['m²', 'm2', 'm^2'], dimensionless: []
});

/** Parse only authored units. Grouping must be complete, never silently repaired. */
export function parseNumber(rawText, step = {}) {
  if (typeof rawText !== 'string' || rawText.length > MAX_RAW) return null;
  let text = rawText.trim().replace(/[\u00a0\u202f]/g, ' ');
  if (!text) return null;
  let percent = false;
  if (text.endsWith('%')) {
    if (step.unit !== 'dimensionless') return null;
    percent = true;
    text = text.slice(0, -1).trim();
  } else {
    const aliases = UNIT_ALIASES[step.unit] || (step.unit ? [step.unit] : []);
    const suffix = [...aliases].sort((a, b) => b.length - a.length)
      .find(unit => text.toLowerCase().endsWith(unit.toLowerCase()));
    if (suffix) text = text.slice(0, -suffix.length).trim();
  }
  // Optional thousands grouping uses one separator consistently.
  if (/[ ,]/.test(text)) {
    if (!/^[+-]?\d{1,3}(,\d{3})+(\.\d*)?([eE][+-]?\d{1,3})?$/.test(text) &&
        !/^[+-]?\d{1,3}( \d{3})+(\.\d*)?([eE][+-]?\d{1,3})?$/.test(text)) return null;
    text = text.replace(/[ ,]/g, '');
  }
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d{1,3})?$/.test(text)) return null;
  const value = Number(text) / (percent ? 100 : 1);
  return Number.isFinite(value) ? value : null;
}

function decimalRatio(value) {
  const match = String(value).match(/^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);
  if (!match) throw new TypeError('Finite number required.');
  const exponent = Number(match[4] || 0) - (match[3] || '').length;
  if (Math.abs(exponent) > 400) throw new RangeError('Number exceeds rounding bounds.');
  const sign = match[1] === '-' ? -1n : 1n;
  const digits = BigInt(match[2] + (match[3] || ''));
  return exponent >= 0
    ? [sign * digits * 10n ** BigInt(exponent), 1n]
    : [sign * digits, 10n ** BigInt(-exponent)];
}

function roundedQuotient(numerator, denominator) {
  const negative = numerator < 0n;
  const n = negative ? -numerator : numerator;
  const quotient = n / denominator + (2n * (n % denominator) >= denominator ? 1n : 0n);
  return negative ? -quotient : quotient;
}

/** Decimal half away from zero, returned as a fixed decimal string. */
export function roundDecimal(value, format) {
  if (!Number.isFinite(value)) throw new TypeError('Finite number required.');
  const places = format.decimalPlaces;
  if (!Number.isInteger(places) || places < 0 || places > 8) throw new RangeError('Unsupported decimal places.');
  let [n, d] = decimalRatio(value);
  if (format.roundingMultiple != null) {
    const multiple = format.roundingMultiple;
    if (!Number.isSafeInteger(multiple) || multiple < 1 || multiple > 1e9) throw new RangeError('Unsupported rounding multiple.');
    n = roundedQuotient(n, d * BigInt(multiple)) * BigInt(multiple);
    d = 1n;
  }
  const rounded = roundedQuotient(n * 10n ** BigInt(places), d);
  const sign = rounded < 0n ? '-' : '';
  const digits = String(rounded < 0n ? -rounded : rounded).padStart(places + 1, '0');
  return sign + (places ? digits.slice(0, -places) + '.' + digits.slice(-places) : digits);
}

export function displayAnswer(step) {
  let text = roundDecimal(step.answer, step.answerFormat);
  if (step.answerFormat.showGrouping) {
    const [integer, fraction] = text.split('.');
    text = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (fraction === undefined ? '' : '.' + fraction);
  }
  return text + (step.unit && step.unit !== 'dimensionless' ? ' ' + step.unit : '');
}

/** Practice only. Never an approval, score, entitlement or submission gate. */
export function checkNumber(step, rawText) {
  const value = parseNumber(rawText, step);
  if (value === null) return 'invalid';
  const error = Math.abs(value - step.answer);
  if (roundDecimal(value, step.answerFormat) === roundDecimal(step.answer, step.answerFormat) ||
      error <= step.answerCheck.absoluteTolerance) return 'correct';
  if (error / Math.max(Math.abs(step.answer), 1e-9) <= step.answerCheck.closeRelativeTolerance) return 'close';
  return 'incorrect';
}
