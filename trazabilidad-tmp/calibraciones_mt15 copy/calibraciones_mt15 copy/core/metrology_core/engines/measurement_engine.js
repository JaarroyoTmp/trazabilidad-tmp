/* MC-05 Measurement Engine - TMP
   Cálculos básicos comunes: media, desviación muestral, error y decisión simple.
   No sustituye al Decision Engine oficial; prepara datos normalizados para él.
*/

export function toNumber(v) {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

export function mean(values = []) {
  const nums = values.map(toNumber).filter(Number.isFinite);
  if (!nums.length) return NaN;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function sampleStd(values = []) {
  const nums = values.map(toNumber).filter(Number.isFinite);
  if (nums.length < 2) return 0;
  const m = mean(nums);
  const v = nums.reduce((a, b) => a + Math.pow(b - m, 2), 0) / (nums.length - 1);
  return Math.sqrt(v);
}

export function evaluatePoint({ nominal, readings, tolerance }) {
  const nums = (readings || []).map(toNumber).filter(Number.isFinite);
  const media = mean(nums);
  const s = sampleStd(nums);
  const nom = toNumber(nominal);
  const tol = Math.abs(toNumber(tolerance));
  const error = Number.isFinite(media) && Number.isFinite(nom) ? media - nom : NaN;
  const decision = !nums.length ? 'PENDIENTE' : Math.abs(error) <= tol ? 'APTO' : 'NO_APTO';
  return { nominal: nom, readings: nums, media, s, error, tolerance: tol, decision };
}

export function finalDecision(results = []) {
  if (!results.length) return 'PENDIENTE';
  if (results.some(r => r.decision === 'NO_APTO')) return 'NO_APTO';
  if (results.some(r => r.decision === 'PENDIENTE')) return 'PENDIENTE';
  return 'APTO';
}

export default { mean, sampleStd, evaluatePoint, finalDecision, toNumber };
