/* ===========================================================
   TMP THREAD NORMATIVE ENGINE V1
   -----------------------------------------------------------
   Motor normativo único para roscas.

   Objetivo:
   - Resolver designación de rosca.
   - Calcular geometría básica ISO 724.
   - Resolver límites ISO965/ISO1502 si existen en las tablas cargadas.
   - Calcular rodillo/hilo recomendado para banco Trimos.
   - Generar ficha técnica metrológica para MT16.

   Archivo:
   core/metrology_core/thread/engines/thread_normative_engine.js

   NOTA:
   Este motor centraliza la lógica normativa para que MT16 no dependa
   de textos sueltos repartidos por el HTML.
   =========================================================== */

export const TMP_THREAD_NORMATIVE_ENGINE_VERSION =
  "TMP_THREAD_NORMATIVE_ENGINE_V1_20260629_ISO724_ISO965_ISO1502_TRIMOS";

export function parseNum(value, fallback = null) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function round(value, decimals = 6) {
  const n = parseNum(value, null);
  if (!Number.isFinite(n)) return null;
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

export function normalizeThreadDesignation(raw = "") {
  return String(raw || "")
    .toUpperCase()
    .replace(/×/g, "X")
    .replace(/\*/g, "X")
    .replace(/,/g, ".")
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, " - ")
    .trim();
}

export function parseMetricThread(raw = "") {
  const normalized = normalizeThreadDesignation(raw);

  const m = normalized.match(/\bM\s*([0-9]+(?:\.[0-9]+)?)\s*(?:X\s*([0-9]+(?:\.[0-9]+)?))?\s*(?:-\s*([0-9]+[A-Z]+))?/i);

  if (!m) {
    return {
      ok: false,
      source: TMP_THREAD_NORMATIVE_ENGINE_VERSION,
      raw,
      normalized,
      error: "THREAD_PARSE_FAILED"
    };
  }

  const nominal = parseNum(m[1]);
  const pitch = parseNum(m[2], null);
  const toleranceClass = m[3] || null;

  const coarsePitch = getMetricCoarsePitch(nominal);
  const finalPitch = Number.isFinite(pitch) ? pitch : coarsePitch;

  return {
    ok: true,
    source: TMP_THREAD_NORMATIVE_ENGINE_VERSION,
    raw,
    normalized,
    family: finalPitch === coarsePitch ? "METRIC_COARSE_OR_DEFAULT" : "METRIC_FINE",
    standard: finalPitch === coarsePitch ? "ISO metric coarse thread" : "DIN 13 / ISO metric fine thread",
    nominal_mm: nominal,
    pitch_mm: finalPitch,
    tolerance_class: toleranceClass || "6H",
    angle_deg: 60,
    direction: "DERECHA",
    database_key: `M${nominal}x${finalPitch}`,
    warnings: Number.isFinite(pitch) ? [] : ["No se indicó paso; se aplica paso métrico grueso por defecto."]
  };
}

export function getMetricCoarsePitch(nominal) {
  const table = {
    1:0.25, 1.2:0.25, 1.4:0.3, 1.6:0.35, 1.8:0.35,
    2:0.4, 2.5:0.45, 3:0.5, 3.5:0.6, 4:0.7, 5:0.8,
    6:1, 7:1, 8:1.25, 10:1.5, 12:1.75, 14:2, 16:2,
    18:2.5, 20:2.5, 22:2.5, 24:3, 27:3, 30:3.5, 33:3.5,
    36:4, 39:4, 42:4.5, 45:4.5, 48:5, 52:5, 56:5.5, 60:5.5,
    64:6, 68:6
  };
  return table[Number(nominal)] || null;
}

export function calculateIso724BasicGeometry(thread) {
  if (!thread?.ok) return { ok:false, error:"THREAD_NOT_PARSED" };

  const D = parseNum(thread.nominal_mm);
  const P = parseNum(thread.pitch_mm);
  const H = 0.8660254037844386 * P;

  /*
    ISO 724 basic profile for metric thread:
    D2 = D - 0.6495190528 P
    D1 = D - 1.0825317547 P
  */
  const D2 = D - 0.649519052838329 * P;
  const D1 = D - 1.082531754730548 * P;

  return {
    ok: true,
    source: TMP_THREAD_NORMATIVE_ENGINE_VERSION,
    standard: "ISO 724",
    H_mm: round(H, 9),
    basic_mm: {
      major_diameter_D: round(D, 9),
      pitch_diameter_D2: round(D2, 9),
      minor_diameter_D1: round(D1, 9)
    },
    formulae: {
      H: "H = 0.8660254038 * P",
      D2: "D2 = D - 0.6495190528 * P",
      D1: "D1 = D - 1.0825317547 * P"
    }
  };
}

/*
  Base mínima inicial para los casos reales ya trabajados.
  La idea es ir ampliando esta tabla con más roscas/clases de forma estable.
*/
export const TMP_ISO965_INTERNAL_THREAD_LIMITS = {
  "M12x1.25|6H": {
    source: "ISO965-2:1998_TABLE_3_INTERNAL_THREAD",
    major_diameter: 12,
    pitch: 1.25,
    tolerance_class: "6H",
    pitch_diameter_max: 11.368,
    pitch_diameter_min: 11.188,
    minor_diameter_max: 10.912,
    minor_diameter_min: 10.647
  }
};

export function resolveIso965Limits(thread) {
  if (!thread?.ok) return { ok:false, error:"THREAD_NOT_PARSED" };
  const key = `M${thread.nominal_mm}x${thread.pitch_mm}|${thread.tolerance_class || "6H"}`;
  const data = TMP_ISO965_INTERNAL_THREAD_LIMITS[key];

  if (!data) {
    return {
      ok: false,
      status: "ISO965_LIMITS_NOT_IN_LOCAL_TABLE",
      key,
      warning: "No hay límites ISO965 cargados para esta combinación. Añadir fila normativa antes de certificado final."
    };
  }

  return {
    ok: true,
    status: "ISO965_LIMITS_FOUND",
    key,
    data,
    message: "Límites ISO965 encontrados."
  };
}

/*
  ISO1502 beta: límites funcionales usados para evaluación PASA/NO PASA.
  Para M12x1.25-6H seguimos con la tabla ya validada en pruebas.
*/
export const TMP_ISO1502_FUNCTIONAL_LIMITS = {
  "M12x1.25|6H": {
    source: "ISO1502_PENDING_FINAL_VALIDATION",
    status: "ISO1502_BETA_LIMITS",
    pass: {
      id: "PASA",
      d2_nominal: 11.2,
      min: 11.1945,
      max: 11.2055,
      wear_max: 11.1705
    },
    no_pass: {
      id: "NO_PASA",
      d2_nominal: 11.368,
      min: 11.3625,
      max: 11.3735,
      wear_max: 11.3565
    },
    warning: "Límites ISO1502 V1 pendientes de validación final contra tabla completa y cláusula 13."
  }
};

export function resolveIso1502FunctionalLimits(thread) {
  if (!thread?.ok) return { ok:false, error:"THREAD_NOT_PARSED" };
  const key = `M${thread.nominal_mm}x${thread.pitch_mm}|${thread.tolerance_class || "6H"}`;
  const data = TMP_ISO1502_FUNCTIONAL_LIMITS[key];

  if (!data) {
    return {
      ok: false,
      status: "ISO1502_LIMITS_NOT_IN_LOCAL_TABLE",
      key,
      warning: "No hay límites ISO1502 cargados para esta combinación. Añadir fila normativa antes de certificado final."
    };
  }

  return {
    ok: true,
    status: data.status || "ISO1502_LIMITS_FOUND",
    key,
    data,
    warning: data.warning || null
  };
}

export function calculateBestWireDiameter(thread) {
  if (!thread?.ok) return { ok:false, error:"THREAD_NOT_PARSED" };

  const P = parseNum(thread.pitch_mm);
  const angle = parseNum(thread.angle_deg, 60);

  /*
    Mejor diámetro de hilo para rosca métrica 60°:
    d = P / (2 cos(30°)) = 0.5773502692 P.
    En banco real se selecciona el juego comercial más cercano.
  */
  const ideal = P / (2 * Math.cos((angle / 2) * Math.PI / 180));

  const commercial = [
    0.170, 0.195, 0.220, 0.250, 0.290, 0.335, 0.390,
    0.455, 0.530, 0.620, 0.725, 0.895, 1.100, 1.350,
    1.650, 2.050, 2.550, 3.200
  ];

  let selected = commercial[0];
  let minDiff = Math.abs(selected - ideal);

  for (const c of commercial) {
    const diff = Math.abs(c - ideal);
    if (diff < minDiff) {
      selected = c;
      minDiff = diff;
    }
  }

  return {
    ok: true,
    source: TMP_THREAD_NORMATIVE_ENGINE_VERSION,
    method: "BEST_WIRE_DIAMETER_60_DEG_NEAREST_COMMERCIAL",
    pitch_mm: P,
    angle_deg: angle,
    ideal_wire_mm: round(ideal, 9),
    selected_wire_mm: round(selected, 9),
    commercial_series_mm: commercial,
    warning: "Seleccionado juego comercial más cercano. Verificar disponibilidad física del juego de hilos."
  };
}

/*
  Corrección usada por el workflow actual.
  Conservamos el valor que ya estaba dando el motor MT16 para no romper resultados.
*/
export function calculateTrimosCorrection(thread, wire) {
  if (!thread?.ok || !wire?.ok) return { ok:false, error:"THREAD_OR_WIRE_NOT_READY" };

  const P = parseNum(thread.pitch_mm);
  const w = parseNum(wire.selected_wire_mm);
  const angle = parseNum(thread.angle_deg, 60);

  /*
    Fórmula de trabajo heredada del engine actual:
    C = 3*w - 0.8660254038*P
    Para M12x1.25 con w=0.895 da 1.60246875 mm.
  */
  const correction = 3 * w - 0.8660254037844386 * P;

  return {
    ok: true,
    source: TMP_THREAD_NORMATIVE_ENGINE_VERSION,
    method: "TRIMOS_THREAD_CORRECTION_CURRENT_ENGINE",
    angle_deg: angle,
    pitch_mm: P,
    wire_mm: w,
    correction_mm: round(correction, 9),
    formula: "C = 3*w - 0.8660254038*P"
  };
}

export function buildTrimosMeasurementPlan({ thread, iso1502, wire, correction }) {
  if (!thread?.ok) return { ok:false, error:"THREAD_NOT_PARSED" };
  if (!iso1502?.ok) return { ok:false, error:"ISO1502_NOT_AVAILABLE" };
  if (!wire?.ok) return { ok:false, error:"WIRE_NOT_AVAILABLE" };
  if (!correction?.ok) return { ok:false, error:"CORRECTION_NOT_AVAILABLE" };

  const pass = iso1502.data.pass;
  const nop = iso1502.data.no_pass;
  const C = correction.correction_mm;

  const makePoint = (src, lado) => ({
    id: src.id,
    lado,
    d2_nominal_mm: round(src.d2_nominal, 9),
    target_trimos_mm: round(src.d2_nominal + C, 9),
    limits_d2_mm: {
      min: round(src.min, 9),
      max: round(src.max, 9),
      wear_max: round(src.wear_max, 9)
    },
    repetitions: 5
  });

  return {
    ok: true,
    source: TMP_THREAD_NORMATIVE_ENGINE_VERSION,
    method: "TRIMOS_PLAN_FROM_ISO1502_AND_NORMATIVE_WIRE",
    setup: {
      bank: "TRIMOS",
      wire_mm: wire.selected_wire_mm,
      ideal_wire_mm: wire.ideal_wire_mm,
      correction_mm: C,
      angle_deg: thread.angle_deg,
      instruction: `Montar rodillos Ø${wire.selected_wire_mm} mm, colocar adaptadores Trimos, poner a cero y tomar lecturas.`
    },
    points: [
      makePoint(pass, "PASA"),
      makePoint(nop, "NO_PASA")
    ]
  };
}

export function buildThreadNormativeSheet(rawDesignation) {
  const parsed = parseMetricThread(rawDesignation);
  const geometry = calculateIso724BasicGeometry(parsed);
  const iso965 = resolveIso965Limits(parsed);
  const iso1502 = resolveIso1502FunctionalLimits(parsed);
  const wire = calculateBestWireDiameter(parsed);
  const correction = calculateTrimosCorrection(parsed, wire);
  const trimos = buildTrimosMeasurementPlan({ thread: parsed, iso1502, wire, correction });

  const canEvaluate = Boolean(parsed.ok && geometry.ok && iso965.ok && iso1502.ok && wire.ok && correction.ok && trimos.ok);

  return {
    ok: Boolean(parsed.ok),
    source: TMP_THREAD_NORMATIVE_ENGINE_VERSION,
    version: TMP_THREAD_NORMATIVE_ENGINE_VERSION,
    status: canEvaluate ? "THREAD_NORMATIVE_READY_FOR_MT16" : "THREAD_NORMATIVE_INCOMPLETE",
    can_evaluate: canEvaluate,
    parsed,
    geometry,
    iso965,
    iso1502,
    wire,
    correction,
    trimos,
    summary: {
      designation: parsed.normalized,
      nominal_mm: parsed.nominal_mm,
      pitch_mm: parsed.pitch_mm,
      class: parsed.tolerance_class,
      angle_deg: parsed.angle_deg,
      d2_basic_mm: geometry?.basic_mm?.pitch_diameter_D2,
      d1_basic_mm: geometry?.basic_mm?.minor_diameter_D1,
      wire_mm: wire?.selected_wire_mm,
      correction_mm: correction?.correction_mm,
      pass_target_trimos_mm: trimos?.points?.[0]?.target_trimos_mm,
      no_pass_target_trimos_mm: trimos?.points?.[1]?.target_trimos_mm
    },
    warnings: [
      ...(parsed.warnings || []),
      ...(iso965.warning ? [iso965.warning] : []),
      ...(iso1502.warning ? [iso1502.warning] : []),
      ...(wire.warning ? [wire.warning] : [])
    ]
  };
}

export default {
  TMP_THREAD_NORMATIVE_ENGINE_VERSION,
  parseMetricThread,
  calculateIso724BasicGeometry,
  resolveIso965Limits,
  resolveIso1502FunctionalLimits,
  calculateBestWireDiameter,
  calculateTrimosCorrection,
  buildTrimosMeasurementPlan,
  buildThreadNormativeSheet
};
