// Hand-rolled SVG chart math, ported verbatim from the .dc.html Component class.
export function spark(seed) {
  const n = 8, w = 72, h = 26, arr = [];
  for (let i = 0; i < n; i++) arr.push(30 + ((Math.sin((i + seed) * 1.7) + 1) / 2) * 60 + i * 3);
  const mx = Math.max.apply(null, arr), mn = Math.min.apply(null, arr);
  return 'M' + arr.map((v, i) => ((i / (n - 1)) * w).toFixed(1) + ' ' + (h - 2 - ((v - mn) / (mx - mn || 1)) * (h - 5)).toFixed(1)).join(' L');
}

export function line(vals, close) {
  const max = 150, w = 720;
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * w, 198 - (v / max) * 194]);
  let d = 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
  if (close) d += ' L720 198 L0 198 Z';
  return d;
}
