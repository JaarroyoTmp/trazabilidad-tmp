/* ===========================================================
   TMP THREAD METRIC TRIMOS ENGINE V1
   -----------------------------------------------------------
   Motor inicial MT16 para tampones roscados métricos ISO
   medidos en banco Trimos con adaptadores + rodillos.

   Objetivo V1:
   - El operario NO elige rodillo.
   - El motor calcula rodillo según paso.
   - El motor calcula corrección C.
   - El motor calcula valor objetivo Trimos desde diámetro medio.
   - El motor convierte lecturas Trimos a diámetro de flancos.
   - El motor evalúa PASA / NO PASA con límites precargados cuando existan.

   Fórmula documentada TMP:
   M = D2 + 3d - 0.866025 * P

   Donde:
   M  = lectura sobre rodillos / objetivo Trimos
   D2 = diámetro medio / diámetro de flancos
   d  = diámetro del rodillo
   P  = paso de rosca

   Por tanto:
   C  = 3d - 0.866025 * P
   D2 = M - C
   =========================================================== */

import { parseThreadGaugeDesignation } from "./thread_parser_engine.js";

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

export function mean(values = []) {
  const nums = values.map(v => parseNum(v, NaN)).filter(Number.isFinite);
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/*
  Tabla de rodillos TMP observada en documentación histórica.
  La clave es el paso P en mm.
*/
export const TMP_THREAD_WIRE_DATABASE = {
  "0.5": 0.335,
  "0.75": 0.53,
  "1": 0.725,
  "1.25": 0.895,
  "1.5": 1.35,
  "1.75": 1.10,
  "2": 1.35,
  "2.5": 1.65,
  "3": 2.05,
  "3.5": 2.55,
  "4": 2.55,
  "5": 3.20
};

/*
  Base V1 de límites reales/históricos conocidos.
  Unidades en mm.
  Esta base se irá alimentando con certificados XLSM/PDF históricos.
*/
export const TMP_METRIC_THREAD_LIMITS_V1 = {
  "M33x2-H6": {
    source: "TMP_CERTIFICADO_HISTORICO_166",
    standard: "DIN 13",
    nominal_mm: 33,
    pitch_mm: 2,
    tolerance_class: "H6",
    pass: {
      d2_nominal: 31.918,
      min: 31.911,
      max: 31.925,
      wear_max: 31.89
    },
    no_pass: {
      d2_nominal: 31.685,
      min: 31.678,
      max: 31.692,
      wear_max: 31.663
    }
  },

  "M85x1.5-H6": {
    source: "TMP_CERTIFICADO_HISTORICO_594",
    standard: "DIN 13",
    nominal_mm: 85,
    pitch_mm: 1.5,
    tolerance_class: "H6",
    pass: {
      d2_nominal: 84.042,
      min: 84.035,
      max: 84.049,
      wear_max: 84.014
    },
    no_pass: {
      d2_nominal: 84.245,
      min: 84.238,
      max: 84.252,
      wear_max: 84.223
    }
  }
};

export function normalizeClass(value = "") {
  const s = String(value || "").toUpperCase().replace(/\s+/g, "").trim();

  if (!s) return null;

  if (/^[0-9][A-Z]$/.test(s)) return s;
  if (/^[A-Z][0-9]$/.test(s)) return s;
  if (/^SH[0-9]$/.test(s)) return s;

  return s;
}

export function metricThreadKey({ nominal_mm, pitch_mm, tolerance_class } = {}) {
  const nominal = parseNum(nominal_mm);
  const pitch = parseNum(pitch_mm);
  const cls = normalizeClass(tolerance_class || "");

  if (!nominal || !pitch || !cls) return null;

  const nTxt = Number.isInteger(nominal) ? String(nominal) : String(nominal);
  const pTxt = Number.isInteger(pitch) ? String(pitch) : String(pitch);

  return `M${nTxt}x${pTxt}-${cls}`;
}

export function getThreadWireByPitch(pitchMm) {
  const p = parseNum(pitchMm);
  if (!p) {
    return {
      ok: false,
      error: "PASO_INVALIDO",
      message: "No se puede elegir rodillo porque el paso de rosca no es válido."
    };
  }

  const key = String(round(p, 3)).replace(/\.?0+$/, "");
  const wire = TMP_THREAD_WIRE_DATABASE[key];

  if (!wire) {
    return {
      ok: false,
      error: "RODILLO_NO_CARGADO",
      pitch_mm: p,
      message: `No hay rodillo TMP cargado para paso ${p} mm.`
    };
  }

  return {
    ok: true,
    pitch_mm: p,
    wire_mm: wire,
    source: "TMP_THREAD_WIRE_DATABASE"
  };
}

export function calculateMetricThreadCorrection({ pitch_mm, wire_mm } = {}) {
  const p = parseNum(pitch_mm);
  const d = parseNum(wire_mm);

  if (!p || !d) {
    return {
      ok: false,
      error: "DATOS_INSUFICIENTES_CORRECCION",
      message: "Faltan paso o diámetro de rodillo para calcular C."
    };
  }

  const correction = 3 * d - 0.866025 * p;

  return {
    ok: true,
    formula: "C = 3d - 0.866025 * P",
    pitch_mm: p,
    wire_mm: d,
    correction_mm: round(correction, 9)
  };
}

export function trimosTargetFromPitchDiameter({ d2_mm, correction_mm } = {}) {
  const d2 = parseNum(d2_mm, NaN);
  const c = parseNum(correction_mm, NaN);

  if (!Number.isFinite(d2) || !Number.isFinite(c)) {
    return {
      ok: false,
      error: "DATOS_INSUFICIENTES_OBJETIVO_TRIMOS"
    };
  }

  return {
    ok: true,
    formula: "M = D2 + C",
    d2_mm: round(d2, 6),
    correction_mm: round(c, 9),
    target_trimos_mm: round(d2 + c, 6)
  };
}

export function pitchDiameterFromTrimosReading({ reading_mm, correction_mm } = {}) {
  const m = parseNum(reading_mm, NaN);
  const c = parseNum(correction_mm, NaN);

  if (!Number.isFinite(m) || !Number.isFinite(c)) {
    return {
      ok: false,
      error: "LECTURA_O_CORRECCION_INVALIDA"
    };
  }

  return {
    ok: true,
    formula: "D2 = M - C",
    reading_mm: round(m, 6),
    correction_mm: round(c, 9),
    d2_mm: round(m - c, 6)
  };
}

export function getMetricThreadLimits(parsed = {}) {
  if (!parsed?.ok) {
    return {
      ok: false,
      error: "THREAD_PARSED_INVALIDO"
    };
  }

  const clsCandidates = [
    normalizeClass(parsed.tolerance_class),
    normalizeClass(String(parsed.tolerance_class || "").replace(/^6H$/, "H6")),
    normalizeClass(String(parsed.tolerance_class || "").replace(/^6G$/, "G6"))
  ].filter(Boolean);

  for (const cls of clsCandidates) {
    const key = metricThreadKey({
      nominal_mm: parsed.nominal_mm,
      pitch_mm: parsed.pitch_mm,
      tolerance_class: cls
    });

    if (TMP_METRIC_THREAD_LIMITS_V1[key]) {
      return {
        ok: true,
        key,
        limits: TMP_METRIC_THREAD_LIMITS_V1[key],
        source: TMP_METRIC_THREAD_LIMITS_V1[key].source
      };
    }
  }

  return {
    ok: false,
    error: "LIMITES_METRICOS_NO_CARGADOS",
    nominal_mm: parsed.nominal_mm,
    pitch_mm: parsed.pitch_mm,
    tolerance_class: parsed.tolerance_class,
    message:
      "La rosca se ha interpretado, pero todavía no existen límites PASA/NO PASA cargados para esta combinación."
  };
}

export function buildTrimosPlanForMetricThread(input = {}) {
  const parsed = input.parsed?.ok
    ? input.parsed
    : parseThreadGaugeDesignation(input);

  if (!parsed.ok) {
    return {
      ok: false,
      source: "thread_metric_trimos_engine",
      stage: "parse",
      parsed,
      error: parsed.error,
      message: parsed.message
    };
  }

  if (!String(parsed.thread_type || "").includes("METRIC")) {
    return {
      ok: false,
      source: "thread_metric_trimos_engine",
      stage: "family",
      parsed,
      error: "SOLO_METRICA_IMPLEMENTADA_V1",
      message: "V1 del motor Trimos sólo genera plan automático para rosca métrica ISO."
    };
  }

  const wire = getThreadWireByPitch(parsed.pitch_mm);

  if (!wire.ok) {
    return {
      ok: false,
      source: "thread_metric_trimos_engine",
      stage: "wire",
      parsed,
      error: wire.error,
      message: wire.message
    };
  }

  const correction = calculateMetricThreadCorrection({
    pitch_mm: parsed.pitch_mm,
    wire_mm: wire.wire_mm
  });

  if (!correction.ok) {
    return {
      ok: false,
      source: "thread_metric_trimos_engine",
      stage: "correction",
      parsed,
      wire,
      error: correction.error,
      message: correction.message
    };
  }

  const limitsResult = getMetricThreadLimits(parsed);

  const plan = {
    ok: true,
    source: "thread_metric_trimos_engine",
    engine_version: "TMP_THREAD_METRIC_TRIMOS_ENGINE_V1",
    parsed,
    setup: {
      banco: "TRIMOS",
      adaptadores: "Adaptadores para roscas TMP",
      wire_mm: wire.wire_mm,
      pitch_mm: parsed.pitch_mm,
      angle_deg: parsed.angle_deg || 60,
      correction_mm: correction.correction_mm,
      instruction:
        `Montar rodillos Ø${wire.wire_mm} mm, colocar adaptadores Trimos, poner a cero y tomar lecturas.`
    },
    formulae: {
      correction: correction.formula,
      target: "M = D2 + C",
      measured_pitch_diameter: "D2 = M - C"
    },
    limits_loaded: limitsResult.ok,
    limits: limitsResult.ok ? limitsResult.limits : null,
    warnings: [
      ...(parsed.warnings || []),
      limitsResult.ok ? null : limitsResult.message
    ].filter(Boolean)
  };

  if (limitsResult.ok) {
    const passTarget = trimosTargetFromPitchDiameter({
      d2_mm: limitsResult.limits.pass.d2_nominal,
      correction_mm: correction.correction_mm
    });

    const noPassTarget = trimosTargetFromPitchDiameter({
      d2_mm: limitsResult.limits.no_pass.d2_nominal,
      correction_mm: correction.correction_mm
    });

    plan.points = [
      {
        id: "PASA",
        lado: "PASA",
        etiqueta: `Lado PASA D2 ${limitsResult.limits.pass.d2_nominal} mm`,
        d2_nominal_mm: limitsResult.limits.pass.d2_nominal,
        target_trimos_mm: passTarget.target_trimos_mm,
        limits_d2_mm: {
          min: limitsResult.limits.pass.min,
          max: limitsResult.limits.pass.max,
          wear_max: limitsResult.limits.pass.wear_max
        },
        repetitions: 5
      },
      {
        id: "NO_PASA",
        lado: "NO_PASA",
        etiqueta: `Lado NO PASA D2 ${limitsResult.limits.no_pass.d2_nominal} mm`,
        d2_nominal_mm: limitsResult.limits.no_pass.d2_nominal,
        target_trimos_mm: noPassTarget.target_trimos_mm,
        limits_d2_mm: {
          min: limitsResult.limits.no_pass.min,
          max: limitsResult.limits.no_pass.max,
          wear_max: limitsResult.limits.no_pass.wear_max
        },
        repetitions: 5
      }
    ];
  } else {
    plan.points = [
      {
        id: "PASA",
        lado: "PASA",
        etiqueta: "Lado PASA - límites pendientes de cargar",
        target_trimos_mm: null,
        limits_d2_mm: null,
        repetitions: 5
      },
      {
        id: "NO_PASA",
        lado: "NO_PASA",
        etiqueta: "Lado NO PASA - límites pendientes de cargar",
        target_trimos_mm: null,
        limits_d2_mm: null,
        repetitions: 5
      }
    ];
  }

  return plan;
}

export function evaluateMetricThreadPoint({
  point,
  readings = [],
  correction_mm
} = {}) {
  const c = parseNum(correction_mm, NaN);

  if (!point) {
    return {
      ok: false,
      error: "PUNTO_INVALIDO"
    };
  }

  if (!Number.isFinite(c)) {
    return {
      ok: false,
      error: "CORRECCION_INVALIDA"
    };
  }

  const numericReadings = readings
    .map(v => parseNum(v, NaN))
    .filter(Number.isFinite);

  if (!numericReadings.length) {
    return {
      ok: false,
      error: "SIN_LECTURAS"
    };
  }

  const converted = numericReadings.map(v =>
    pitchDiameterFromTrimosReading({
      reading_mm: v,
      correction_mm: c
    }).d2_mm
  );

  const mediaTrimos = mean(numericReadings);
  const mediaD2 = mean(converted);

  let decision = "NO_EVALUABLE";
  let motivo = "No hay límites cargados para evaluar.";

  if (point.limits_d2_mm) {
    const min = parseNum(point.limits_d2_mm.min);
    const max = parseNum(point.limits_d2_mm.max);
    const wear = parseNum(point.limits_d2_mm.wear_max, null);

    if (mediaD2 >= min && mediaD2 <= max) {
      decision = "APTO";
      motivo = "Diámetro medio dentro de límites.";
    } else if (wear !== null && mediaD2 < wear) {
      decision = "NO_APTO";
      motivo = "Diámetro medio supera límite de desgaste.";
    } else {
      decision = "NO_APTO";
      motivo = "Diámetro medio fuera de límites.";
    }
  }

  return {
    ok: true,
    point_id: point.id,
    lado: point.lado,
    readings_trimos_mm: numericReadings.map(v => round(v, 6)),
    readings_d2_mm: converted.map(v => round(v, 6)),
    media_trimos_mm: round(mediaTrimos, 6),
    media_d2_mm: round(mediaD2, 6),
    correction_mm: round(c, 9),
    target_trimos_mm: point.target_trimos_mm ?? null,
    limits_d2_mm: point.limits_d2_mm ?? null,
    decision,
    motivo
  };
}

export function evaluateMetricThreadCalibration({
  plan,
  readingsByPoint = {}
} = {}) {
  if (!plan?.ok) {
    return {
      ok: false,
      error: "PLAN_INVALIDO"
    };
  }

  const results = [];

  for (const p of plan.points || []) {
    results.push(
      evaluateMetricThreadPoint({
        point: p,
        readings: readingsByPoint[p.id] || [],
        correction_mm: plan.setup.correction_mm
      })
    );
  }

  const evaluable = results.filter(r => r.ok);
  const hasNoApto = evaluable.some(r => r.decision === "NO_APTO");
  const hasNoEvaluable = results.some(r => !r.ok || r.decision === "NO_EVALUABLE");

  let global = "APTO";

  if (hasNoApto) global = "NO_APTO";
  else if (hasNoEvaluable) global = "NO_EVALUABLE";

  return {
    ok: true,
    plan,
    results,
    global_decision: global,
    rule: "CUALQUIER_LADO_NO_APTO_ES_NO_APTO"
  };
}
