/* ===========================================================
   TMP THREAD UNCERTAINTY ENGINE V1
   -----------------------------------------------------------
   Motor de incertidumbre para MT16 - Tampón roscado P/NP.

   Componentes V1:
   - Repetibilidad de lecturas.
   - Banco Trimos.
   - Rodillos.
   - Patrón de ajuste/verificación.
   - Resolución.
   - Temperatura.
   =========================================================== */

export const TMP_THREAD_UNCERTAINTY_VERSION =
  "TMP_THREAD_UNCERTAINTY_ENGINE_V1";

export function parseNum(value, fallback = null) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function round(value, decimals = 9) {
  const n = parseNum(value, NaN);
  if (!Number.isFinite(n)) return null;
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

export function mean(values = []) {
  const nums = values.map(v => parseNum(v, NaN)).filter(Number.isFinite);
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function sampleStd(values = []) {
  const nums = values.map(v => parseNum(v, NaN)).filter(Number.isFinite);
  if (nums.length < 2) return 0;
  const m = mean(nums);
  const variance = nums.reduce((s, v) => s + Math.pow(v - m, 2), 0) / (nums.length - 1);
  return Math.sqrt(variance);
}

export function resolutionUncertainty(resolution) {
  const r = parseNum(resolution, 0);
  return r / Math.sqrt(12);
}

export function standardUncertaintyFromExpanded(U, k = 2) {
  const expanded = parseNum(U, 0);
  const factor = parseNum(k, 2) || 2;
  return expanded / factor;
}

export function calculateThreadUncertainty({
  readings = [],
  u_trimos = 0.0005,
  u_wire = 0.0003,
  u_pattern = 0,
  resolution = 0.001,
  u_temperature = 0,
  k = 2
} = {}) {
  const numeric = readings.map(v => parseNum(v, NaN)).filter(Number.isFinite);

  if (numeric.length < 2) {
    return {
      ok: false,
      source: "thread_uncertainty_engine",
      version: TMP_THREAD_UNCERTAINTY_VERSION,
      error: "NOT_ENOUGH_READINGS",
      message: "Se necesitan al menos 2 lecturas para calcular repetibilidad."
    };
  }

  const avg = mean(numeric);
  const stdev = sampleStd(numeric);
  const u_repeatability = stdev / Math.sqrt(numeric.length);
  const u_resolution = resolutionUncertainty(resolution);

  const components = {
    repeatability: round(u_repeatability),
    trimos: round(u_trimos),
    wire: round(u_wire),
    pattern: round(u_pattern),
    resolution: round(u_resolution),
    temperature: round(u_temperature)
  };

  const uc = Math.sqrt(
    Math.pow(components.repeatability || 0, 2) +
    Math.pow(components.trimos || 0, 2) +
    Math.pow(components.wire || 0, 2) +
    Math.pow(components.pattern || 0, 2) +
    Math.pow(components.resolution || 0, 2) +
    Math.pow(components.temperature || 0, 2)
  );

  const u_expanded = uc * k;

  return {
    ok: true,
    source: "thread_uncertainty_engine",
    version: TMP_THREAD_UNCERTAINTY_VERSION,
    n: numeric.length,
    readings: numeric.map(v => round(v, 9)),
    mean: round(avg, 9),
    stdev: round(stdev, 9),
    components,
    uc: round(uc, 9),
    k,
    u_expanded: round(u_expanded, 9),
    note: "Incertidumbre V1. u_trimos, u_wire y u_pattern deben venir de certificados reales antes de emitir certificado."
  };
}

export function calculateThreadUncertaintyByPoint({
  point_id,
  lado,
  readings_d2_mm = [],
  uncertainty_model = {}
} = {}) {
  const result = calculateThreadUncertainty({ readings: readings_d2_mm, ...uncertainty_model });
  return { point_id, lado, ...result };
}

export function calculateThreadCalibrationUncertainty({
  results = [],
  uncertainty_model = {}
} = {}) {
  const perPoint = results.map(r => {
    if (!r?.ok) {
      return { point_id: r?.point_id, lado: r?.lado, ok: false, error: r?.error || "POINT_NOT_OK" };
    }
    return calculateThreadUncertaintyByPoint({
      point_id: r.point_id,
      lado: r.lado,
      readings_d2_mm: r.readings_d2_mm || [],
      uncertainty_model
    });
  });

  return {
    ok: perPoint.length > 0 && perPoint.every(p => p.ok),
    source: "thread_uncertainty_engine",
    version: TMP_THREAD_UNCERTAINTY_VERSION,
    model: { ...uncertainty_model },
    points: perPoint
  };
}

export default {
  TMP_THREAD_UNCERTAINTY_VERSION,
  calculateThreadUncertainty,
  calculateThreadUncertaintyByPoint,
  calculateThreadCalibrationUncertainty,
  resolutionUncertainty,
  standardUncertaintyFromExpanded
};
