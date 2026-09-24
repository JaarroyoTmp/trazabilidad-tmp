/* MC-03 Procedure Builder Engine - TMP
   Utilidades comunes para crear pautas bajo/medio/alto sin mezclar UI con cálculo.
*/

export function lowMidHigh(maxRange) {
  const max = Number(maxRange);
  if (!Number.isFinite(max) || max <= 0) return [];
  const low = Math.max(10, Math.round(max * 0.1));
  const mid = Math.round(max * 0.5);
  const high = Math.round(max);
  return [...new Set([low, mid, high])];
}

export function buildPoints(prefix, label, nominalValues, readings = 5, unit = 'mm') {
  return (nominalValues || []).map((nominal, idx) => ({
    id: `${prefix}_${idx + 1}`,
    etiqueta: `${label} ${nominal} ${unit}`,
    nominal,
    lecturas: readings,
    unidad: unit
  }));
}

export default { lowMidHigh, buildPoints };
