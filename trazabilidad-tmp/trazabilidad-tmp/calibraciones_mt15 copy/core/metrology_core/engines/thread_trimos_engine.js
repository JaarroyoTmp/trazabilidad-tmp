/* ===========================================================
   TMP THREAD TRIMOS ENGINE V1
   Motor Trimos inicial para MT16.
   =========================================================== */

import { parseThreadGaugeDesignation } from "./thread_parser_engine.js";
import { calculateThreadGeometry } from "./thread_geometry_engine.js";
import { resolveThreadWireFromParsed } from "../data/thread_wire_database.js";

export const TMP_THREAD_TRIMOS_ENGINE_VERSION = "TMP_THREAD_TRIMOS_ENGINE_V1";

export function parseNum(value, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function round(value, decimals = 6) {
  const f = Math.pow(10, decimals);
  return Math.round(parseNum(value) * f) / f;
}

export function calculateTrimosCorrection60({ pitch_mm, wire_mm } = {}) {
  const p = parseNum(pitch_mm);
  const d = parseNum(wire_mm);
  if (!p || !d) return { ok: false, error: "DATOS_INSUFICIENTES_CORRECCION_TRIMOS" };

  const c = 3 * d - 0.866025 * p;

  return {
    ok: true,
    formula: "C = 3d - 0.866025 * P",
    pitch_mm: p,
    wire_mm: d,
    correction_mm: round(c, 9)
  };
}

export function trimosTargetFromD2({ d2_mm, correction_mm } = {}) {
  const d2 = parseNum(d2_mm, NaN);
  const c = parseNum(correction_mm, NaN);
  if (!Number.isFinite(d2) || !Number.isFinite(c)) return { ok: false, error: "DATOS_INSUFICIENTES_OBJETIVO" };

  return {
    ok: true,
    formula: "M = D2 + C",
    d2_mm: round(d2, 6),
    correction_mm: round(c, 9),
    target_trimos_mm: round(d2 + c, 6)
  };
}

export function d2FromTrimosReading({ reading_mm, correction_mm } = {}) {
  const m = parseNum(reading_mm, NaN);
  const c = parseNum(correction_mm, NaN);
  if (!Number.isFinite(m) || !Number.isFinite(c)) return { ok: false, error: "LECTURA_O_CORRECCION_INVALIDA" };

  return {
    ok: true,
    formula: "D2 = M - C",
    reading_mm: round(m, 6),
    correction_mm: round(c, 9),
    d2_mm: round(m - c, 6)
  };
}

export function buildThreadTrimosSetup(input = {}, options = {}) {
  const parsed = input.parsed?.ok ? input.parsed : parseThreadGaugeDesignation(input);

  if (!parsed.ok) {
    return { ok: false, source: "thread_trimos_engine", stage: "parse", parsed, error: parsed.error, message: parsed.message };
  }

  const geometryResult = input.geometry?.ok ? { ok: true, geometry: input.geometry, parsed } : calculateThreadGeometry({ parsed });

  if (!geometryResult.ok || !geometryResult.geometry?.ok) {
    return {
      ok: false,
      source: "thread_trimos_engine",
      stage: "geometry",
      parsed,
      geometryResult,
      error: geometryResult.geometry?.error || geometryResult.error,
      message: geometryResult.geometry?.message || geometryResult.message
    };
  }

  const wire = resolveThreadWireFromParsed(parsed, options);

  if (!wire.ok) {
    return {
      ok: false,
      source: "thread_trimos_engine",
      stage: "wire",
      parsed,
      geometry: geometryResult.geometry,
      error: wire.error,
      message: wire.message || "No se pudo resolver rodillo."
    };
  }

  const angle = parseNum(parsed.angle_deg, geometryResult.geometry.angle_deg || 60);

  if (angle !== 60) {
    return {
      ok: false,
      source: "thread_trimos_engine",
      stage: "angle",
      parsed,
      geometry: geometryResult.geometry,
      wire,
      error: "FORMULA_TRIMOS_ANGULO_NO_IMPLEMENTADA_V1",
      message: "V1 sólo calcula corrección Trimos para perfil 60 grados."
    };
  }

  const correction =
    wire.correction_mm !== null && wire.correction_mm !== undefined
      ? { ok: true, formula: "C historical override", pitch_mm: wire.pitch_mm, wire_mm: wire.wire_mm, correction_mm: round(wire.correction_mm, 9), source: wire.source }
      : calculateTrimosCorrection60({ pitch_mm: parsed.pitch_mm, wire_mm: wire.wire_mm });

  if (!correction.ok) {
    return { ok: false, source: "thread_trimos_engine", stage: "correction", parsed, geometry: geometryResult.geometry, wire, error: correction.error };
  }

  return {
    ok: true,
    source: "thread_trimos_engine",
    engine: TMP_THREAD_TRIMOS_ENGINE_VERSION,
    parsed,
    geometry: geometryResult.geometry,
    setup: {
      banco: "TRIMOS",
      adaptadores: "Adaptadores rosca TMP",
      angle_deg: angle,
      pitch_mm: parsed.pitch_mm,
      wire_mm: wire.wire_mm,
      correction_mm: correction.correction_mm,
      historical_override: Boolean(wire.historical_override),
      instruction: `Montar rodillos Ø${wire.wire_mm} mm, montar adaptadores de rosca, poner a cero el Trimos y tomar lecturas.`
    },
    wire,
    correction,
    formulae: {
      correction: correction.formula,
      target: "M = D2 + C",
      measured: "D2 = M - C"
    },
    warnings: [wire.note || null, ...(parsed.warnings || [])].filter(Boolean)
  };
}

export function convertTrimosReadingsToD2({ readings = [], correction_mm } = {}) {
  const c = parseNum(correction_mm, NaN);
  const nums = readings.map(v => parseNum(v, NaN)).filter(Number.isFinite);

  if (!Number.isFinite(c)) return { ok: false, error: "CORRECCION_INVALIDA" };
  if (!nums.length) return { ok: false, error: "SIN_LECTURAS" };

  const converted = nums.map(v => d2FromTrimosReading({ reading_mm: v, correction_mm: c }).d2_mm);
  const meanTrimos = nums.reduce((a, b) => a + b, 0) / nums.length;
  const meanD2 = converted.reduce((a, b) => a + b, 0) / converted.length;

  return {
    ok: true,
    readings_trimos_mm: nums.map(v => round(v, 6)),
    readings_d2_mm: converted.map(v => round(v, 6)),
    mean_trimos_mm: round(meanTrimos, 6),
    mean_d2_mm: round(meanD2, 6),
    correction_mm: round(c, 9)
  };
}
