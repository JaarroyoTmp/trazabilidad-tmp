import { resolveISO286FromParsed } from "./iso286_resolver.js";

/* ===========================================================
   TMP PLAIN LIMIT GAUGE ENGINE V5.1
   Motor para tampones/calibres lisos P/NP.

   Objetivo:
   - Mantiene compatibilidad con V1.
   - Lee textos tipo: Ø8.5 H8, D 12 h7, diametro 25 g6.
   - Calcula PASA / NO PASA.
   - Añade base ISO286 estructurada.
   - Añade trazabilidad de cálculo.
   - Evita inventar límites si la desviación fundamental no está soportada.
   - Conectado a iso286_resolver.js / iso286_database.js.
   - Primero busca datos tabulados en ISO286_DATABASE.
   - Si no encuentra clase cargada, usa el cálculo por fórmula V3.

   Nota técnica:
   - H, h y js/JS están implementados de forma directa.
   - e, f, g, k, m, n, p, r y s se calculan mediante fórmulas TMP/ISO286
     para desviación fundamental de ejes.
   - Las posiciones de agujero distintas de H/JS pueden resolverse desde
     ISO286_DATABASE cuando estén cargadas por rangos.
   - Si no hay dato tabulado, se mantiene el comportamiento V3.
   =========================================================== */

export function parseNum(value, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;

  const cleaned = String(value)
    .replace(",", ".")
    .replace(/[^\d.+\-eE]/g, "")
    .trim();

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

export function round(value, decimals = 6) {
  const f = Math.pow(10, decimals);
  return Math.round(parseNum(value) * f) / f;
}

export function normalizeText(value) {
  /*
    V5.1:
    Conserva mayúsculas/minúsculas para diferenciar:
    - H / JS = agujero
    - h / js / g / k / m / p... = eje
  */
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[Ø⌀]/g, " Ø")
    .replace(/\bdiametro\b/gi, " Ø ")
    .replace(/\bdiam\b/gi, " Ø ")
    .replace(/\bdia\b/gi, " Ø ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeLetter(value = "") {
  return String(value || "").trim();
}

export function isUpperCaseLetter(value = "") {
  const s = String(value || "");
  return s === s.toUpperCase();
}

export const ISO286_IT_FACTORS = {
  5: 7,
  6: 10,
  7: 16,
  8: 25,
  9: 40,
  10: 64,
  11: 100,
  12: 160
};

export const ISO286_SUPPORTED_POSITIONS = {
  HOLE: ["H", "JS"],
  SHAFT: ["h", "js", "g", "f", "e", "k", "m", "n", "p", "r", "s"]
};

export const ISO286_PENDING_POSITIONS = {
  HOLE: ["G", "F", "E", "K", "M", "N", "P", "R", "S"],
  SHAFT: ["a", "b", "c", "cd", "d", "ef", "fg", "j", "t", "u", "v", "x", "y", "z", "za", "zb", "zc"]
};

export const ISO286_DATABASE = {
  meta: {
    version: "TMP_ISO286_INTERNAL_FALLBACK_V4_COMPAT",
    status: "PARCIAL_VALIDABLE",
    units: "micrometros",
    note: "Fallback interno conservado por compatibilidad. La fuente principal es iso286_database.js."
  },
  ranges: []
};

export function iso286UnitI(nominalMm) {
  const D = parseNum(nominalMm);
  if (!D || D <= 0) return 0;
  return 0.45 * Math.cbrt(D) + 0.001 * D;
}

export function iso286ITWidthUm(nominalMm, grade) {
  const i = iso286UnitI(nominalMm);
  const g = parseInt(grade, 10);
  const factor = ISO286_IT_FACTORS[g];

  if (!factor) {
    return {
      ok: false,
      error: "GRADO_IT_NO_IMPLEMENTADO",
      grade: g,
      supported: Object.keys(ISO286_IT_FACTORS)
    };
  }

  return {
    ok: true,
    grade: g,
    i_um: round(i, 6),
    factor,
    width_um: round(i * factor, 3),
    width_mm: round((i * factor) / 1000, 6)
  };
}

export function parsePlainLimitDesignation(input = {}) {
  const raw = [
    input.designacion,
    input.rango,
    input.descripcion,
    input.nombre,
    input.modelo,
    input.observaciones
  ].filter(Boolean).join(" ");

  const txt = normalizeText(raw);

  const match = txt.match(/(?:Ø|D|DIAM(?:ETRO)?\.?)?\s*(\d+(?:[\.,]\d+)?)\s*([A-Z]{1,2})\s*(\d{1,2})/i);

  if (!match) {
    return {
      ok: false,
      raw,
      normalized: txt,
      error: "NO_SE_PUDO_PARSEAR_DESIGNACION",
      message: "No se pudo detectar nominal y tolerancia tipo Ø8.5 H8."
    };
  }

  const nominal = parseNum(match[1]);
  const letterRaw = normalizeLetter(match[2]);
  const grade = parseInt(match[3], 10);
  const isHole = isUpperCaseLetter(letterRaw);

  return {
    ok: true,
    raw,
    normalized: txt,
    nominal,
    letter: letterRaw,
    grade,
    tolerance: `${letterRaw}${grade}`,
    tipo: isHole ? "AGUJERO" : "EJE",
    system: "ISO_286"
  };
}


export function resolveShaftFundamentalDeviationEiUm(letter = "", nominalMm = 0) {
  const D = parseNum(nominalMm);
  const l = String(letter || "");

  if (!D || D <= 0) {
    return {
      ok: false,
      error: "DIAMETRO_INVALIDO_DESVIACION_EJE"
    };
  }

  /*
    Fórmulas TMP/ISO286 para desviación fundamental de ejes.
    Para e, f, g se calcula es y la zona queda por debajo del nominal.
    Para k, m, n, p, r, s se calcula ei y la zona queda por encima del nominal.

    Nota:
    k/m/n/p/r/s deben validarse finalmente contra ISO286_DATABASE por escalón dimensional
    cuando se cargue la tabla interna aprobada.
  */
  const formulas = {
    g: {
      kind: "es",
      value: -2.5 * Math.pow(D, 0.34),
      formula: "Eje g: es = -2.5 * D^0.34 µm; ei = es - IT"
    },
    f: {
      kind: "es",
      value: -5.5 * Math.pow(D, 0.41),
      formula: "Eje f: es = -5.5 * D^0.41 µm; ei = es - IT"
    },
    e: {
      kind: "es",
      value: -11 * Math.pow(D, 0.41),
      formula: "Eje e: es = -11 * D^0.41 µm; ei = es - IT"
    },
    k: {
      kind: "ei",
      value: 0.6 * Math.cbrt(D),
      formula: "Eje k: ei = +0.6 * D^(1/3) µm; es = ei + IT"
    },
    m: {
      kind: "ei",
      value: 2.8 * Math.pow(D, 0.34),
      formula: "Eje m: ei = +2.8 * D^0.34 µm; es = ei + IT"
    },
    n: {
      kind: "ei",
      value: 5 * Math.pow(D, 0.34),
      formula: "Eje n: ei = +5 * D^0.34 µm; es = ei + IT"
    },
    p: {
      kind: "ei",
      value: 5.6 * Math.pow(D, 0.41),
      formula: "Eje p: ei = +5.6 * D^0.41 µm; es = ei + IT"
    },
    r: {
      kind: "ei",
      value: 10 * Math.pow(D, 0.41),
      formula: "Eje r: ei = +10 * D^0.41 µm; es = ei + IT"
    },
    s: {
      kind: "ei",
      value: 14 * Math.pow(D, 0.44),
      formula: "Eje s: ei = +14 * D^0.44 µm; es = ei + IT"
    }
  };

  const f = formulas[l];

  if (!f) {
    return {
      ok: false,
      error: "FORMULA_EJE_NO_IMPLEMENTADA",
      position: l
    };
  }

  return {
    ok: true,
    position: l,
    kind: f.kind,
    value_um: round(f.value, 3),
    formula: f.formula,
    validation: "TMP_FORMULA_VALIDABLE_CONTRA_ISO286_DATABASE"
  };
}

export function resolveFundamentalDeviationUm(parsed = {}, it = {}) {
  if (!parsed?.ok) {
    return {
      ok: false,
      error: "PARSED_INVALIDO"
    };
  }

  const nominal = parseNum(parsed.nominal);
  const letter = String(parsed.letter || "");
  const upperLetter = letter.toUpperCase();
  const width = parseNum(it.width_um);

  if (!nominal || nominal <= 0 || !width) {
    return {
      ok: false,
      error: "DATOS_INSUFICIENTES_DESVIACION"
    };
  }

  if (parsed.tipo === "AGUJERO" && upperLetter === "H") {
    return {
      ok: true,
      source: "ISO286_DIRECT_HOLE_H",
      position: "H",
      lower_um: 0,
      upper_um: width,
      EI_um: 0,
      ES_um: width,
      formula: "Agujero H: EI = 0; ES = IT"
    };
  }

  if (parsed.tipo === "EJE" && letter === "h") {
    return {
      ok: true,
      source: "ISO286_DIRECT_SHAFT_h",
      position: "h",
      lower_um: -width,
      upper_um: 0,
      ei_um: -width,
      es_um: 0,
      formula: "Eje h: es = 0; ei = -IT"
    };
  }

  if (upperLetter === "JS") {
    const half = width / 2;

    return {
      ok: true,
      source: parsed.tipo === "AGUJERO" ? "ISO286_CENTERED_HOLE_JS" : "ISO286_CENTERED_SHAFT_js",
      position: parsed.tipo === "AGUJERO" ? "JS" : "js",
      lower_um: -half,
      upper_um: half,
      formula: "JS/js: zona de tolerancia centrada; desviaciones = ±IT/2"
    };
  }

  if (parsed.tipo === "EJE") {
    const shaftDeviation = resolveShaftFundamentalDeviationEiUm(letter, nominal);

    if (shaftDeviation.ok) {
      let lower_um;
      let upper_um;

      if (shaftDeviation.kind === "es") {
        upper_um = round(shaftDeviation.value_um, 3);
        lower_um = round(shaftDeviation.value_um - width, 3);
      } else {
        lower_um = round(shaftDeviation.value_um, 3);
        upper_um = round(shaftDeviation.value_um + width, 3);
      }

      return {
        ok: true,
        source: `ISO286_FORMULA_SHAFT_${letter}`,
        position: letter,
        lower_um,
        upper_um,
        ei_um: lower_um,
        es_um: upper_um,
        formula: shaftDeviation.formula,
        validation: shaftDeviation.validation
      };
    }
  }

  return {
    ok: false,
    error: "DESVIACION_FUNDAMENTAL_NO_IMPLEMENTADA",
    position: letter,
    tipo: parsed.tipo,
    message: `La desviación fundamental ${letter}${parsed.grade} no está implementada todavía en la base ISO286 TMP.`,
    supported_now: parsed.tipo === "AGUJERO" ? ISO286_SUPPORTED_POSITIONS.HOLE : ISO286_SUPPORTED_POSITIONS.SHAFT,
    pending: parsed.tipo === "AGUJERO" ? ISO286_PENDING_POSITIONS.HOLE : ISO286_PENDING_POSITIONS.SHAFT
  };
}

export function calculateISO286Limits(parsed) {
  if (!parsed?.ok) return parsed;

  /* ======================================================
     PRIORIDAD 1:
     Buscar en ISO286_DATABASE mediante iso286_resolver.js
     ====================================================== */

  const databaseResult = resolveISO286FromParsed(parsed);

  if (databaseResult?.ok) {
    const warnings = [
      `Datos obtenidos desde ISO286_DATABASE (${databaseResult.range_key}).`,
      "Fuente prioritaria: tabla interna TMP ISO286."
    ];

    return {
      ok: true,
      system: "ISO_286_DATABASE",
      source: "ISO286_DATABASE",
      parsed,
      nominal: parsed.nominal,
      tipo: parsed.tipo,
      tolerance: `${parsed.letter}${parsed.grade}`,

      IT: null,

      deviation: {
        ok: true,
        source: "ISO286_DATABASE",
        position: parsed.letter,
        lower_um: databaseResult.deviations_um.lower,
        upper_um: databaseResult.deviations_um.upper,
        formula: "ISO286_DATABASE",
        database_version: databaseResult.database_version,
        range_key: databaseResult.range_key
      },

      deviations_um: {
        lower: round(databaseResult.deviations_um.lower, 3),
        upper: round(databaseResult.deviations_um.upper, 3)
      },

      limits_mm: {
        lower: round(databaseResult.limits_mm.lower, 6),
        upper: round(databaseResult.limits_mm.upper, 6)
      },

      audit_formula: {
        it: null,
        deviation: "ISO286_DATABASE"
      },

      audit_database: databaseResult.audit || null,

      warnings
    };
  }

  /* ======================================================
     PRIORIDAD 2:
     Fallback V3 por fórmula
     ====================================================== */

  const it = iso286ITWidthUm(parsed.nominal, parsed.grade);

  if (!it.ok) {
    return {
      ok: false,
      parsed,
      error: it.error,
      message: `Grado IT${parsed.grade} no implementado.`,
      IT: it
    };
  }

  const deviation = resolveFundamentalDeviationUm(parsed, it);

  if (!deviation.ok) {
    return {
      ok: false,
      parsed,
      IT: it,
      deviation,
      error: deviation.error,
      message: deviation.message || `La desviación fundamental ${parsed.letter}${parsed.grade} debe completarse con tabla ISO 286 validada.`
    };
  }

  const lower_mm = parsed.nominal + deviation.lower_um / 1000;
  const upper_mm = parsed.nominal + deviation.upper_um / 1000;

  const warnings = [
    "No se encontró clase cargada en ISO286_DATABASE. Se usa fallback V3 por fórmula.",
    "V4 calcula IT mediante fórmula ISO 286 y desviación fundamental soportada por motor TMP.",
    "Para auditoría final externa, validar contra tabla ISO 286 oficial o base interna aprobada."
  ];

  if (
    parsed.grade === 8 &&
    Math.abs(parsed.nominal - 8.5) < 0.000001 &&
    parsed.tipo === "AGUJERO" &&
    parsed.letter.toUpperCase() === "H"
  ) {
    warnings.push("Referencia TMP: para Ø8.5 H8 se espera PASA 8.500 mm y NO PASA aprox. 8.522 mm.");
  }

  return {
    ok: true,
    system: "ISO_286_FORMULA_FALLBACK",
    source: "FORMULA_FALLBACK_V3",
    parsed,
    nominal: parsed.nominal,
    tipo: parsed.tipo,
    tolerance: `${parsed.letter}${parsed.grade}`,
    IT: it,
    deviation,
    deviations_um: {
      lower: round(deviation.lower_um, 3),
      upper: round(deviation.upper_um, 3)
    },
    limits_mm: {
      lower: round(lower_mm, 6),
      upper: round(upper_mm, 6)
    },
    audit_formula: {
      it: `i = 0.45 * D^(1/3) + 0.001 * D; IT${parsed.grade} = ${it.factor}i`,
      deviation: deviation.formula
    },
    warnings
  };
}

export function resolvePlainPlugGoNoGo(input = {}) {
  const parsed = parsePlainLimitDesignation(input);

  if (!parsed.ok) {
    return {
      ok: false,
      source: "plain_limit_gauge_engine",
      parsed,
      error: parsed.error,
      message: parsed.message
    };
  }

  const limits = calculateISO286Limits(parsed);

  if (!limits.ok) {
    return {
      ok: false,
      source: "plain_limit_gauge_engine",
      parsed,
      limits,
      error: limits.error,
      message: limits.message
    };
  }

  let nominal_pasa;
  let nominal_no_pasa;

  if (parsed.tipo === "AGUJERO") {
    nominal_pasa = limits.limits_mm.lower;
    nominal_no_pasa = limits.limits_mm.upper;
  } else {
    nominal_pasa = limits.limits_mm.upper;
    nominal_no_pasa = limits.limits_mm.lower;
  }

  return {
    ok: true,
    source: "plain_limit_gauge_engine",
    engine_version: "V5.1",
    parsed,
    limits,
    nominal_pasa,
    nominal_no_pasa,
    pauta_hint: {
      nominal_pasa,
      nominal_no_pasa,
      lado_pasa: "PASA",
      lado_no_pasa: "NO_PASA",
      patron_tipo: "BANCO_HORIZONTAL",
      repeticiones: 5,
      unidad: "mm"
    },
    audit: {
      norma_base: ["ISO 286", "ISO 1938-1", "DIN 7162", "ILAC-G8", "ISO 14253"],
      metodo: "Cálculo de límites de agujero/eje a partir de designación ISO.",
      formula_it: limits.audit_formula?.it || null,
      formula_desviacion: limits.audit_formula?.deviation || null,
      desviaciones_um: limits.deviations_um,
      limites_mm: limits.limits_mm,
      observaciones: limits.warnings
    }
  };
}

export function enrichInstrumentWithPlainLimitData(instrumento = {}) {
  const resolved = resolvePlainPlugGoNoGo(instrumento);

  if (!resolved.ok) {
    return {
      ...instrumento,
      plain_limit_resolved: false,
      plain_limit_error: resolved.message || resolved.error,
      plain_limit_debug: resolved
    };
  }

  return {
    ...instrumento,
    plain_limit_resolved: true,
    plain_limit_data: resolved,
    nominal_pasa: resolved.nominal_pasa,
    nominal_no_pasa: resolved.nominal_no_pasa,
    tolerancia_iso: resolved.parsed.tolerance,
    nominal_base: resolved.parsed.nominal,
    tipo_limite: resolved.parsed.tipo,
    iso286_limits_mm: resolved.limits.limits_mm,
    iso286_deviations_um: resolved.limits.deviations_um
  };
}

export function testPlainLimitDesignation(text = "Ø8.5 H8") {
  return resolvePlainPlugGoNoGo({
    designacion: text
  });
}

export function explainPlainLimitResult(input = {}) {
  const r = resolvePlainPlugGoNoGo(input);

  if (!r.ok) {
    return {
      ok: false,
      message: r.message || r.error,
      debug: r
    };
  }

  return {
    ok: true,
    resumen: `${r.parsed.nominal} ${r.parsed.tolerance}: PASA ${r.nominal_pasa} mm / NO PASA ${r.nominal_no_pasa} mm (${r.limits?.source || r.limits?.system || 'ISO286'})`,
    parsed: r.parsed,
    limits: r.limits,
    audit: r.audit
  };
}
