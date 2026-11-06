/* ===========================================================
   TMP PROCEDURE RULES SHARED V1
   =========================================================== */

export const TMP_DEFAULT_REPETITIONS = 5;

export function parseNum(value, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function round3(value) {
  return Math.round(parseNum(value) * 1000) / 1000;
}

export function uniqueSorted(values = []) {
  return [...new Set(values.map(round3).filter((x) => Number.isFinite(x) && x > 0))].sort((a, b) => a - b);
}

export function createPoint({ id, nominal, unidad = "mm", repeticiones = TMP_DEFAULT_REPETITIONS, patron_tipo, etiqueta, funcion, extra = {} }) {
  return {
    id,
    etiqueta: etiqueta || id,
    funcion: funcion || null,
    nominal: round3(nominal),
    unidad,
    repeticiones,
    patron_tipo,
    valor_referencia_esperado: null,
    lecturas_requeridas: Array.from({ length: repeticiones }, (_, i) => ({
      ordinal: i + 1,
      valor: null
    })),
    ...extra
  };
}

export function rangePoints(max, fractions = [0.1, 0.5, 0.9]) {
  const m = parseNum(max);
  if (!m) return [];
  return uniqueSorted(fractions.map((f) => m * f));
}

export function clampPoints(points = [], max = 0) {
  const m = parseNum(max);
  if (!m) return uniqueSorted(points);
  return uniqueSorted(points.filter((p) => p <= m));
}
