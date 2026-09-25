/* ============================================================
   TMP METROLOGY CORE - THREAD REFERENCE CALCULATOR V1
   Calculos de referencia para roscas medidas sobre varillas.
   ============================================================ */

export function parseNum(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (v === null || v === undefined) return 0;
  const n = Number(String(v).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function mean(values = []) {
  const nums = values.map(parseNum).filter(Number.isFinite);
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function sampleStd(values = []) {
  const nums = values.map(parseNum).filter(Number.isFinite);
  if (nums.length < 2) return 0;
  const m = mean(nums);
  return Math.sqrt(nums.reduce((acc, x) => acc + Math.pow(x - m, 2), 0) / (nums.length - 1));
}

export function bestWireDiameterMetric60(pitch) {
  const p = parseNum(pitch);
  if (p <= 0) return 0;
  return p / (2 * Math.cos(Math.PI / 6));
}

export function measurementOverWiresFromPitchDiameterMetric60({ pitchDiameter, wireDiameter, pitch }) {
  const d2 = parseNum(pitchDiameter);
  const d = parseNum(wireDiameter);
  const p = parseNum(pitch);
  return d2 + (3 * d) - (0.8660254037844386 * p);
}

export function pitchDiameterFromMeasurementOverWiresMetric60({ measurementOverWires, wireDiameter, pitch, correction = 0 }) {
  const M = parseNum(measurementOverWires) + parseNum(correction);
  const d = parseNum(wireDiameter);
  const p = parseNum(pitch);
  return M - (3 * d) + (0.8660254037844386 * p);
}

export function evaluateLimit(value, min, max) {
  const v = parseNum(value);
  const lo = parseNum(min);
  const hi = parseNum(max);
  if (v < lo) return 'NO_APTO_BAJO_MINIMO';
  if (v > hi) return 'NO_APTO_SOBRE_MAXIMO';
  return 'APTO';
}