/* ===========================================================
   TMP THREAD TOLERANCE ENGINE V1
   -----------------------------------------------------------
   Motor inicial de tolerancias ISO 965 para MT16.

   Flujo:
   parser -> geometry -> ISO965 database -> límites de rosca

   V1:
   - Integra geometría básica.
   - Integra base ISO965.
   - Resuelve de forma segura sólo lo cargado.
   - No inventa datos si falta tabla.
   =========================================================== */

import { calculateThreadGeometry } from "./thread_geometry_engine.js";
import { resolveISO965Class } from "../data/thread_iso965_database.js";

export const TMP_THREAD_TOLERANCE_ENGINE_VERSION = "TMP_THREAD_TOLERANCE_ENGINE_V1";

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

export function resolveThreadTolerance(input = {}) {
  const geoResult = input.geometry?.ok ? input : calculateThreadGeometry(input);

  const parsed = geoResult.parsed;
  const geometry = geoResult.geometry;

  if (!geoResult.ok || !geometry?.ok) {
    return {
      ok: false,
      source: "thread_tolerance_engine",
      stage: "geometry",
      geoResult,
      error: geometry?.error || geoResult.error,
      message: geometry?.message || geoResult.message
    };
  }

  if (!String(parsed.thread_type || parsed.family || "").toUpperCase().includes("METRIC")) {
    return {
      ok: false,
      source: "thread_tolerance_engine",
      stage: "family",
      parsed,
      geometry,
      error: "SOLO_METRICA_ISO_IMPLEMENTADA_V1",
      message: "V1 de tolerancias sólo implementa rosca métrica ISO."
    };
  }

  if (!parsed.tolerance_class) {
    return {
      ok: false,
      source: "thread_tolerance_engine",
      stage: "class",
      parsed,
      geometry,
      error: "CLASE_TOLERANCIA_NO_INDICADA",
      message: "No se puede resolver ISO 965 sin clase de tolerancia."
    };
  }

  const iso = resolveISO965Class({
    nominal_mm: parsed.nominal_mm,
    pitch_mm: parsed.pitch_mm,
    tolerance_class: parsed.tolerance_class
  });

  if (!iso.ok) {
    return {
      ok: false,
      source: "thread_tolerance_engine",
      stage: "iso965",
      parsed,
      geometry,
      iso,
      error: iso.error,
      message: iso.message || "No se pudo resolver ISO 965 para esta rosca/clase.",
      warnings: iso.warnings || []
    };
  }

  const basicD2 = geometry.basic_mm.pitch_diameter;
  const pitchTol = iso.pitch_diameter;

  const d2_min = basicD2 + pitchTol.EI_um / 1000;
  const d2_max = basicD2 + pitchTol.ES_um / 1000;

  return {
    ok: true,
    source: "thread_tolerance_engine",
    engine: TMP_THREAD_TOLERANCE_ENGINE_VERSION,
    parsed,
    geometry,
    iso965: iso,
    limits: {
      pitch_diameter_D2: {
        basic_mm: round(basicD2, 6),
        min_mm: round(d2_min, 6),
        max_mm: round(d2_max, 6),
        EI_um: pitchTol.EI_um,
        ES_um: pitchTol.ES_um,
        tolerance_um: pitchTol.tolerance_um
      },
      minor_diameter_D1: {
        basic_mm: geometry.basic_mm.minor_diameter,
        min_mm: null,
        max_mm: null,
        status: "PENDIENTE_TABLA_TD1"
      }
    },
    warnings: [
      ...(iso.warnings || []),
      "V1 calcula D2 cuando TD2 está cargada. D1 queda pendiente hasta cargar TD1."
    ]
  };
}
