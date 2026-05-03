export function clamp(v, mn, mx) {
  return Math.min(mx, Math.max(mn, v));
}
export function dbToGain(db) {
  return Math.pow(10, db / 20);
}
export function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sc = (s % 60).toFixed(1).padStart(4, '0');
  return `${String(m).padStart(2, '0')}:${sc}`;
}
