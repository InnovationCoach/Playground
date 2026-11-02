/** sorted-key-json-ecmascript-v1. No environment, I/O or crypto dependency. */
export function canonicalStringify(value) {
  const ancestors = new Set();
  function encode(v) {
    if (v === null || typeof v === 'boolean' || typeof v === 'string') return JSON.stringify(v);
    if (typeof v === 'number' && Number.isFinite(v)) return JSON.stringify(v);
    if (typeof v !== 'object' || ancestors.has(v)) throw new TypeError('Finite acyclic JSON required.');
    const proto = Object.getPrototypeOf(v);
    if (!Array.isArray(v) && proto !== Object.prototype && proto !== null) throw new TypeError('Plain JSON required.');
    ancestors.add(v);
    const result = Array.isArray(v)
      ? '[' + Array.from(v, encode).join(',') + ']'
      : '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + encode(v[k])).join(',') + '}';
    ancestors.delete(v);
    return result;
  }
  return encode(value);
}

export function getBundleHashInputs(bundle) {
  function target(kind, id, object, field) {
    const { [field]: expected, ...content } = object;
    return { kind, id, expected, canonical: canonicalStringify(content) };
  }
  return [
    ...bundle.datasets.map(d => target('dataset', d.id, d, 'sha256')),
    ...bundle.missions.map(m => target('mission', m.id, m, 'contentSha256')),
    target('bundle', bundle.releaseId, bundle, 'bundleContentSha256')
  ];
}
