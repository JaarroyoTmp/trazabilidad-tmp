/* ===========================================================
   TMP ISO286 RESOLVER V2
   -----------------------------------------------------------
   Resolver de tolerancias ISO286 desde base interna TMP.

   Flujo:
   Ø8.5 H8
   ↓
   rango 6_10
   ↓
   clase H8
   ↓
   EI / ES o ei / es
   ↓
   límites mm

   V2:
   - Mantiene compatibilidad con V1.
   - Normaliza clases ISO.
   - Devuelve trazabilidad para auditoría.
   - Preparado para fallback a fórmula en plain_limit_gauge_engine.
   =========================================================== */

import { ISO286_DATABASE } from "./iso286_database.js";

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

export function normalizeISOClass(letter, grade) {
  const l = String(letter || "").trim();
  const g = parseInt(grade, 10);

  if (!l || !Number.isFinite(g)) return "";

  return `${l}${g}`;
}

export function getRangeLabel(range = {}) {
  return `${range.min_exclusive}_${range.max_inclusive}`;
}

export function findISO286Range(nominalMm) {
  const nominal = parseNum(nominalMm, NaN);

  if (!Number.isFinite(nominal) || nominal <= 0) {
    return {
      ok: false,
      error: "NOMINAL_INVALIDO",
      message: "Nominal ISO286 inválido."
    };
  }

  for (const [key, range] of Object.entries(ISO286_DATABASE.ranges || {})) {
    const min = parseNum(range.min_exclusive);
    const max = parseNum(range.max_inclusive);

    if (nominal > min && nominal <= max) {
      return {
        ok: true,
        key,
        range,
        nominal
      };
    }
  }

  return {
    ok: false,
    error: "RANGO_ISO286_NO_ENCONTRADO",
    message: `No existe rango ISO286 cargado para nominal ${nominal} mm.`,
    nominal
  };
}

export function getISO286ClassData({ nominal, letter, grade } = {}) {
  const rangeResult = findISO286Range(nominal);

  if (!rangeResult.ok) {
    return rangeResult;
  }

  const isoClass = normalizeISOClass(letter, grade);

  if (!isoClass) {
    return {
      ok: false,
      error: "CLASE_ISO286_INVALIDA",
      message: "No se pudo construir la clase ISO286.",
      nominal,
      letter,
      grade
    };
  }

  const data = rangeResult.range.classes?.[isoClass];

  if (!data) {
    return {
      ok: false,
      error: "CLASE_ISO286_NO_CARGADA",
      message: `La clase ${isoClass} no está cargada en el rango ${rangeResult.key}.`,
      range_key: rangeResult.key,
      iso_class: isoClass,
      nominal: rangeResult.nominal
    };
  }

  return {
    ok: true,
    source: "ISO286_DATABASE",
    database_version: ISO286_DATABASE.meta?.version || "UNKNOWN",
    range_key: rangeResult.key,
    range: rangeResult.range,
    iso_class: isoClass,
    nominal: rangeResult.nominal,
    data
  };
}

export function resolveISO286FromParsed(parsed = {}) {
  if (!parsed?.ok) {
    return {
      ok: false,
      error: "PARSED_INVALIDO",
      message: "No se puede resolver ISO286 porque el parseo no es válido.",
      parsed
    };
  }

  const result = getISO286ClassData({
    nominal: parsed.nominal,
    letter: parsed.letter,
    grade: parsed.grade
  });

  if (!result.ok) return result;

  const d = result.data;
  const nominal = parseNum(parsed.nominal);

  let lowerUm = null;
  let upperUm = null;
  let lowerSymbol = null;
  let upperSymbol = null;

  if (parsed.tipo === "AGUJERO") {
    lowerUm = d.EI;
    upperUm = d.ES;
    lowerSymbol = "EI";
    upperSymbol = "ES";
  } else {
    lowerUm = d.ei;
    upperUm = d.es;
    lowerSymbol = "ei";
    upperSymbol = "es";
  }

  if (lowerUm === undefined || upperUm === undefined) {
    return {
      ok: false,
      error: "DESVIACIONES_INCOMPLETAS",
      message: `La clase ${result.iso_class} existe pero no tiene desviaciones completas.`,
      range_key: result.range_key,
      iso_class: result.iso_class,
      data: d
    };
  }

  const lower = parseNum(lowerUm);
  const upper = parseNum(upperUm);

  return {
    ok: true,
    source: "ISO286_DATABASE",
    database_version: ISO286_DATABASE.meta?.version || "UNKNOWN",

    range_key: result.range_key,
    iso_class: result.iso_class,

    nominal,
    tipo: parsed.tipo,
    letter: parsed.letter,
    grade: parsed.grade,
    tolerance: `${parsed.letter}${parsed.grade}`,

    deviations_um: {
      lower,
      upper
    },

    deviation_symbols: {
      lower: lowerSymbol,
      upper: upperSymbol
    },

    limits_mm: {
      lower: round(nominal + lower / 1000, 6),
      upper: round(nominal + upper / 1000, 6)
    },

    audit: {
      metodo: "Resolución ISO286 desde base interna TMP.",
      source: d.source || ISO286_DATABASE.meta?.source || "ISO 286",
      database_version: ISO286_DATABASE.meta?.version || "UNKNOWN",
      range_key: result.range_key,
      iso_class: result.iso_class,
      deviations_um: {
        [lowerSymbol]: lower,
        [upperSymbol]: upper
      }
    },

    raw: d
  };
}

export function hasISO286ClassLoaded({ nominal, letter, grade } = {}) {
  return getISO286ClassData({ nominal, letter, grade }).ok;
}

export function explainISO286FromParsed(parsed = {}) {
  const r = resolveISO286FromParsed(parsed);

  if (!r.ok) {
    return {
      ok: false,
      message: r.message || r.error,
      debug: r
    };
  }

  return {
    ok: true,
    resumen: `${r.nominal} ${r.tolerance}: ${r.deviation_symbols.lower}=${r.deviations_um.lower} µm / ${r.deviation_symbols.upper}=${r.deviations_um.upper} µm / LI=${r.limits_mm.lower} mm / LS=${r.limits_mm.upper} mm`,
    result: r
  };
}