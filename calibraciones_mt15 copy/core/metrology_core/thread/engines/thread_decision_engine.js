/* ===========================================================
   TMP THREAD DECISION ENGINE V1
   -----------------------------------------------------------
   Motor de decision MT16 con incertidumbre y banda de guarda.

   Regla V1 conservadora:
   - OK solo si el intervalo completo medido +/- U queda dentro
     de los limites permitidos.
   - NOK si el intervalo invade o supera el limite.
   - Si faltan limites o incertidumbre: NO_EVALUABLE.
   =========================================================== */

export const TMP_THREAD_DECISION_VERSION =
  "TMP_THREAD_DECISION_ENGINE_V1";

export const TMP_THREAD_DECISION_RULES = {
  GUARDBAND_CONSERVATIVE: "GUARDBAND_CONSERVATIVE",
  SIMPLE_LIMIT: "SIMPLE_LIMIT"
};

export function parseNum(value, fallback = null) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function round(value, decimals = 9) {
  const n = parseNum(value, NaN);
  if (!Number.isFinite(n)) return null;

  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

export function evaluatePointConservativeGuardband({
  point_id = null,
  lado = null,
  measured_mm,
  u_expanded_mm,
  limits_d2_mm = {},
  rule = TMP_THREAD_DECISION_RULES.GUARDBAND_CONSERVATIVE
} = {}) {
  const measured = parseNum(measured_mm, NaN);
  const U = parseNum(u_expanded_mm, NaN);
  const min = parseNum(limits_d2_mm.min, NaN);
  const max = parseNum(limits_d2_mm.max, NaN);
  const wear = parseNum(limits_d2_mm.wear_max, null);

  if (!Number.isFinite(measured)) {
    return {
      ok: false,
      point_id,
      lado,
      decision: "NO_EVALUABLE",
      error: "MEDICION_INVALIDA",
      message: "No hay media D2 valida para evaluar."
    };
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return {
      ok: false,
      point_id,
      lado,
      measured_mm: round(measured),
      decision: "NO_EVALUABLE",
      error: "LIMITES_INVALIDOS",
      message: "No hay limites ISO1502 validos para evaluar."
    };
  }

  if (!Number.isFinite(U)) {
    return {
      ok: false,
      point_id,
      lado,
      measured_mm: round(measured),
      limits_d2_mm: {
        min: round(min),
        max: round(max),
        wear_max: wear
      },
      decision: "NO_EVALUABLE",
      error: "INCERTIDUMBRE_INVALIDA",
      message: "No hay incertidumbre expandida valida para aplicar regla de decision."
    };
  }

  const intervalLow = measured - U;
  const intervalHigh = measured + U;

  if (rule === TMP_THREAD_DECISION_RULES.SIMPLE_LIMIT) {
    const simpleOk = measured >= min && measured <= max;

    return {
      ok: true,
      point_id,
      lado,
      rule,
      measured_mm: round(measured),
      u_expanded_mm: round(U),
      interval_mm: {
        low: round(intervalLow),
        high: round(intervalHigh)
      },
      limits_d2_mm: {
        min: round(min),
        max: round(max),
        wear_max: wear
      },
      decision: simpleOk ? "OK" : "NOK",
      message: simpleOk
        ? "Valor medido dentro de limites. Regla simple."
        : "Valor medido fuera de limites. Regla simple."
    };
  }

  const fullyInside = intervalLow >= min && intervalHigh <= max;

  if (fullyInside) {
    return {
      ok: true,
      point_id,
      lado,
      rule,
      measured_mm: round(measured),
      u_expanded_mm: round(U),
      interval_mm: {
        low: round(intervalLow),
        high: round(intervalHigh)
      },
      limits_d2_mm: {
        min: round(min),
        max: round(max),
        wear_max: wear
      },
      decision: "OK",
      message: "OK: el intervalo completo medido +/- U queda dentro de los limites."
    };
  }

  const below = intervalLow < min;
  const above = intervalHigh > max;
  const wearExceeded =
    wear !== null &&
    Number.isFinite(parseNum(wear, NaN)) &&
    measured < parseNum(wear);

  let reason = "El intervalo medido +/- U invade o supera los limites.";

  if (below && above) {
    reason = "El intervalo medido +/- U invade limite inferior y superior.";
  } else if (below) {
    reason = "El intervalo medido +/- U invade el limite inferior.";
  } else if (above) {
    reason = "El intervalo medido +/- U invade el limite superior.";
  }

  if (wearExceeded) {
    reason = "El valor medido supera el limite de desgaste.";
  }

  return {
    ok: true,
    point_id,
    lado,
    rule,
    measured_mm: round(measured),
    u_expanded_mm: round(U),
    interval_mm: {
      low: round(intervalLow),
      high: round(intervalHigh)
    },
    limits_d2_mm: {
      min: round(min),
      max: round(max),
      wear_max: wear
    },
    decision: "NOK",
    message: "NOK: " + reason
  };
}

export function evaluateThreadCalibrationDecision({
  reading_results = [],
  uncertainty_results = [],
  rule = TMP_THREAD_DECISION_RULES.GUARDBAND_CONSERVATIVE
} = {}) {
  const decisions = [];

  for (const r of reading_results || []) {
    const u = (uncertainty_results || []).find(x =>
      x.point_id === r.point_id ||
      x.lado === r.lado
    );

    if (!r || !r.ok) {
      decisions.push({
        ok: false,
        point_id: r && r.point_id,
        lado: r && r.lado,
        decision: "NO_EVALUABLE",
        error: (r && r.error) || "READING_RESULT_INVALIDO",
        message: "No se puede evaluar un punto sin resultado de lectura valido."
      });
      continue;
    }

    if (!u || !u.ok) {
      decisions.push({
        ok: false,
        point_id: r.point_id,
        lado: r.lado,
        measured_mm: r.media_d2_mm,
        decision: "NO_EVALUABLE",
        error: (u && u.error) || "UNCERTAINTY_RESULT_INVALIDO",
        message: "No se puede evaluar un punto sin incertidumbre valida."
      });
      continue;
    }

    decisions.push(
      evaluatePointConservativeGuardband({
        point_id: r.point_id,
        lado: r.lado,
        measured_mm: r.media_d2_mm,
        u_expanded_mm: u.u_expanded,
        limits_d2_mm: r.limits_d2_mm,
        rule
      })
    );
  }

  const hasNoEvaluable = decisions.some(d => d.decision === "NO_EVALUABLE");
  const hasNok = decisions.some(d => d.decision === "NOK");
  const allOk = decisions.length > 0 && decisions.every(d => d.decision === "OK");

  let global_decision = "NO_EVALUABLE";

  if (hasNok) {
    global_decision = "NOK";
  } else if (hasNoEvaluable) {
    global_decision = "NO_EVALUABLE";
  } else if (allOk) {
    global_decision = "OK";
  }

  return {
    ok: decisions.length > 0 && !hasNoEvaluable,
    source: "thread_decision_engine",
    version: TMP_THREAD_DECISION_VERSION,
    rule,
    global_decision,
    decisions,
    message:
      global_decision === "OK"
        ? "Calibracion OK segun regla conservadora con incertidumbre."
        : global_decision === "NOK"
          ? "Calibracion NOK segun regla conservadora con incertidumbre."
          : "Calibracion no evaluable por falta de datos."
  };
}

export default {
  TMP_THREAD_DECISION_VERSION,
  TMP_THREAD_DECISION_RULES,
  evaluatePointConservativeGuardband,
  evaluateThreadCalibrationDecision
};
