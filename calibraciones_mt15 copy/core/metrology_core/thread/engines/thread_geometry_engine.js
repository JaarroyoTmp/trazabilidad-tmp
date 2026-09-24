/* ===========================================================
   TMP THREAD GEOMETRY ENGINE V2
   -----------------------------------------------------------
   Motor geométrico normativo para roscas.

   Cambio V2:
   - Para rosca métrica ISO, toma D2/D1 desde ISO724.
   - Ya no duplica las fórmulas dentro del motor geométrico.
   - ISO724 queda como fuente normativa de dimensiones básicas.

   Requiere:
   - ../data/thread_iso724_database.js
   - ./thread_parser_engine.js
   =========================================================== */

import { parseThreadGaugeDesignation } from "./thread_parser_engine.js";
import { calculateISO724BasicDimensions } from "../data/thread_iso724_database.js";

export const TMP_THREAD_GEOMETRY_ENGINE_VERSION = "TMP_THREAD_GEOMETRY_ENGINE_V2_ISO724";

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

export function degToRad(deg) {
  return (parseNum(deg) * Math.PI) / 180;
}

export function tpiToPitchMm(tpi) {
  const n = parseNum(tpi);
  if (!n) return null;
  return round(25.4 / n, 9);
}

export function calculateFundamentalTriangleHeight({ pitch_mm, angle_deg = 60 } = {}) {
  const p = parseNum(pitch_mm);
  const a = parseNum(angle_deg, 60);

  if (!p || !a) {
    return {
      ok: false,
      error: "DATOS_INSUFICIENTES_ALTURA_FUNDAMENTAL"
    };
  }

  const h = p / (2 * Math.tan(degToRad(a / 2)));

  return {
    ok: true,
    pitch_mm: p,
    angle_deg: a,
    H_mm: round(h, 9)
  };
}

export function resolvePitchFromParsed(parsed = {}) {
  if (parsed.pitch_mm) return parseNum(parsed.pitch_mm);
  if (parsed.tpi) return tpiToPitchMm(parsed.tpi);
  return null;
}

export function resolveNominalFromParsed(parsed = {}) {
  return parseNum(parsed.nominal_mm);
}

export function isMetricFamily(parsed = {}) {
  const family = String(parsed.family || parsed.thread_type || "").toUpperCase();
  return family.includes("M") || family.includes("METRIC");
}

export function isUnified60Family(parsed = {}) {
  const family = String(parsed.family || parsed.thread_type || "").toUpperCase();
  return (
    family.includes("UNC") ||
    family.includes("UNF") ||
    family.includes("UNEF") ||
    family === "UN" ||
    family.includes("UNIFIED")
  );
}

export function isWhitworth55Family(parsed = {}) {
  const family = String(parsed.family || parsed.thread_type || "").toUpperCase();
  return (
    family.includes("BSW") ||
    family.includes("BSF") ||
    family.includes("BSP") ||
    family.includes("G") ||
    family.includes("R")
  );
}

/*
  Métrica ISO:
  fuente normativa de D2/D1 = ISO724.
*/
export function calculateMetricISOGeometryFromISO724({
  nominal_mm,
  pitch_mm,
  thread_class = null
} = {}) {
  const iso724 = calculateISO724BasicDimensions({
    nominal_mm,
    pitch_mm
  });

  if (!iso724.ok) {
    return {
      ok: false,
      error: iso724.error,
      message: iso724.message,
      iso724
    };
  }

  return {
    ok: true,
    engine: TMP_THREAD_GEOMETRY_ENGINE_VERSION,
    family: "METRIC_ISO",
    standard: "ISO 68 / ISO 724",
    angle_deg: 60,
    thread_class,
    nominal_mm: iso724.nominal_mm,
    pitch_mm: iso724.pitch_mm,
    H_mm: iso724.basic_mm.H,

    basic_mm: {
      major_diameter: iso724.basic_mm.major_diameter_D_d,
      pitch_diameter: iso724.basic_mm.pitch_diameter_D2_d2,
      minor_diameter: iso724.basic_mm.minor_diameter_D1_d1
    },

    table_rounded_mm: iso724.table_rounded_mm,

    formulae: {
      H: iso724.formulae.H,
      D2: iso724.formulae.D2,
      D1: iso724.formulae.D1
    },

    normative_sources: [
      "ISO 68",
      "ISO 724"
    ],

    pitch_combination: iso724.pitch_combination,

    warnings: [
      ...(iso724.warnings || []),
      "Geometría básica calculada por ISO724. Tolerancias ISO965 e ISO1502 se aplican en motores separados."
    ]
  };
}

/*
  Unified 60°:
  cálculo geométrico básico por perfil 60°.
  Pendiente de mover a fuente ASME B1.1.
*/
export function calculateBasic60ThreadGeometry({
  nominal_mm,
  pitch_mm,
  family = "THREAD_60",
  standard = "ASME/ANSI pendiente",
  thread_class = null
} = {}) {
  const D = parseNum(nominal_mm);
  const P = parseNum(pitch_mm);

  if (!D || !P) {
    return {
      ok: false,
      error: "DATOS_INSUFICIENTES_GEOMETRIA_60",
      message: "Faltan diámetro nominal o paso."
    };
  }

  const H = calculateFundamentalTriangleHeight({ pitch_mm: P, angle_deg: 60 });

  const D2 = D - 0.75 * H.H_mm;
  const D1 = D - 1.25 * H.H_mm;

  return {
    ok: true,
    engine: TMP_THREAD_GEOMETRY_ENGINE_VERSION,
    family,
    standard,
    angle_deg: 60,
    thread_class,
    nominal_mm: round(D, 6),
    pitch_mm: round(P, 9),
    H_mm: round(H.H_mm, 9),
    basic_mm: {
      major_diameter: round(D, 6),
      pitch_diameter: round(D2, 6),
      minor_diameter: round(D1, 6)
    },
    formulae: {
      H: "H = P / (2 * tan(alpha/2))",
      D2: "D2 = D - 0.75 * H",
      D1: "D1 = D - 1.25 * H"
    },
    warnings: [
      "Cálculo 60° provisional para familia no métrica. Para UNC/UNF usar ASME B1.1 en siguiente fase."
    ]
  };
}

/*
  Whitworth/BSP 55°:
  geometría fundamental provisional.
*/
export function calculateBasic55ThreadGeometry({
  nominal_mm,
  pitch_mm,
  family = "THREAD_55",
  standard = "BS84 / ISO 228 / ISO 7 pendiente",
  thread_class = null
} = {}) {
  const D = parseNum(nominal_mm);
  const P = parseNum(pitch_mm);

  if (!D || !P) {
    return {
      ok: false,
      error: "DATOS_INSUFICIENTES_GEOMETRIA_55",
      message: "Faltan diámetro nominal o paso."
    };
  }

  const H = calculateFundamentalTriangleHeight({ pitch_mm: P, angle_deg: 55 });

  return {
    ok: true,
    engine: TMP_THREAD_GEOMETRY_ENGINE_VERSION,
    family,
    standard,
    angle_deg: 55,
    thread_class,
    nominal_mm: round(D, 6),
    pitch_mm: round(P, 9),
    H_mm: round(H.H_mm, 9),
    basic_mm: {
      major_diameter: round(D, 6),
      pitch_diameter_theoretical: round(D - 0.5 * H.H_mm, 6)
    },
    formulae: {
      H: "H = P / (2 * tan(55/2))"
    },
    warnings: [
      "Geometría 55° fundamental. Para decisión metrológica se necesita ISO228/ISO7/BSW específico."
    ]
  };
}

export function calculateThreadGeometryFromParsed(parsed = {}) {
  if (!parsed?.ok) {
    return {
      ok: false,
      error: "PARSED_INVALIDO",
      parsed
    };
  }

  const nominal = resolveNominalFromParsed(parsed);
  const pitch = resolvePitchFromParsed(parsed);
  const angle = parseNum(parsed.angle_deg, isWhitworth55Family(parsed) ? 55 : 60);

  if (!nominal || !pitch) {
    return {
      ok: false,
      error: "DATOS_GEOMETRICOS_INCOMPLETOS",
      message: "La rosca se ha parseado, pero falta diámetro nominal o paso/TPI.",
      parsed
    };
  }

  if (isMetricFamily(parsed)) {
    return calculateMetricISOGeometryFromISO724({
      nominal_mm: nominal,
      pitch_mm: pitch,
      thread_class: parsed.tolerance_class || null
    });
  }

  if (isUnified60Family(parsed) || angle === 60) {
    return calculateBasic60ThreadGeometry({
      nominal_mm: nominal,
      pitch_mm: pitch,
      family: parsed.family || parsed.thread_type || "THREAD_60",
      standard: parsed.standard || "ASME/ANSI pendiente",
      thread_class: parsed.tolerance_class || null
    });
  }

  if (isWhitworth55Family(parsed) || angle === 55) {
    return calculateBasic55ThreadGeometry({
      nominal_mm: nominal,
      pitch_mm: pitch,
      family: parsed.family || parsed.thread_type || "THREAD_55",
      standard: parsed.standard || "BS/ISO pendiente",
      thread_class: parsed.tolerance_class || null
    });
  }

  return {
    ok: false,
    error: "FAMILIA_GEOMETRIA_NO_IMPLEMENTADA",
    message: `No hay motor geométrico implementado para familia ${parsed.family || parsed.thread_type}.`,
    parsed
  };
}

export function calculateThreadGeometry(input = {}) {
  const parsed = input.parsed?.ok
    ? input.parsed
    : parseThreadGaugeDesignation(input);

  if (!parsed.ok) {
    return {
      ok: false,
      source: "thread_geometry_engine",
      stage: "parse",
      parsed,
      error: parsed.error,
      message: parsed.message
    };
  }

  const geometry = calculateThreadGeometryFromParsed(parsed);

  return {
    ok: geometry.ok,
    source: "thread_geometry_engine",
    engine: TMP_THREAD_GEOMETRY_ENGINE_VERSION,
    parsed,
    geometry,
    ready_for: {
      tolerances: "thread_tolerance_engine.js",
      gauges: "thread_gauge_limits_engine.js",
      trimos: "thread_trimos_engine.js"
    }
  };
}

export function compareGeometryWithHistorical({ input, historical_d2_mm } = {}) {
  const result = calculateThreadGeometry(input);

  if (!result.ok) return result;

  const calcD2 =
    result.geometry.basic_mm.pitch_diameter ??
    result.geometry.basic_mm.pitch_diameter_theoretical ??
    null;

  const hist = parseNum(historical_d2_mm, NaN);

  if (!Number.isFinite(calcD2) || !Number.isFinite(hist)) {
    return {
      ok: false,
      error: "DATOS_COMPARACION_INVALIDOS",
      result
    };
  }

  return {
    ok: true,
    input,
    calculated_d2_mm: calcD2,
    historical_d2_mm: round(hist, 6),
    difference_mm: round(calcD2 - hist, 6),
    difference_um: round((calcD2 - hist) * 1000, 3),
    result
  };
}
