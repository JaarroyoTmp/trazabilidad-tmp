/* ===========================================================
   TMP DECISION ENGINE V3
   -----------------------------------------------------------
   Motor de decision metrologica TMP.

   V3:
   - Mantiene compatibilidad con V2.
   - Resultado auditoria: APTO / NO_APTO / INDETERMINADO / NO_EVALUABLE.
   - Resultado operativo TMP: APTO / NO_APTO / NO_EVALUABLE.
   - Implementa TMP_BINARIO_GUARD_BAND.
   - No elimina INDETERMINADO de auditoria.
   - El operario nunca recibe INDETERMINADO como resultado operativo.
   =========================================================== */

export const DECISION_STATUS = {
  APTO: "APTO",
  NO_APTO: "NO_APTO",
  INDETERMINADO: "INDETERMINADO",
  NO_EVALUABLE: "NO_EVALUABLE"
};

export const DECISION_RULES = {
  SIMPLE: "SIMPLE",
  ILAC_G8_GUARD_BAND: "ILAC_G8_GUARD_BAND",
  ISO_14253: "ISO_14253",
  ERROR_ABSOLUTO_ILAC_G8: "ERROR_ABSOLUTO_ILAC_G8",
  ERROR_ABSOLUTO_SIMPLE: "ERROR_ABSOLUTO_SIMPLE",
  TMP_BINARIO_GUARD_BAND: "TMP_BINARIO_GUARD_BAND",
  TMP_CUALQUIER_NOK_NO_APTO: "TMP_CUALQUIER_NOK_NO_APTO",
  TMP_PEOR_PUNTO: "TMP_PEOR_PUNTO"
};

export function parseNum(value, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function roundTo(value, decimals = 9) {
  const n = parseNum(value);
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

export function normalizeRule(rule) {
  const r = String(rule || "").toUpperCase().replace(/[-\s]+/g, "_");

  if (r.includes("BINARIO") || r.includes("OPERATIVO")) {
    return DECISION_RULES.TMP_BINARIO_GUARD_BAND;
  }

  if (r.includes("ABS") && r.includes("SIMPLE")) return DECISION_RULES.ERROR_ABSOLUTO_SIMPLE;
  if (r.includes("ABS")) return DECISION_RULES.ERROR_ABSOLUTO_ILAC_G8;
  if (r.includes("ILAC")) return DECISION_RULES.ILAC_G8_GUARD_BAND;
  if (r.includes("14253")) return DECISION_RULES.ISO_14253;
  if (r.includes("SIMPLE")) return DECISION_RULES.SIMPLE;
  if (r.includes("PEOR")) return DECISION_RULES.TMP_PEOR_PUNTO;
  if (r.includes("CUALQUIER")) return DECISION_RULES.TMP_CUALQUIER_NOK_NO_APTO;

  return DECISION_RULES.ILAC_G8_GUARD_BAND;
}

export function buildLimits(input = {}) {
  const nominal = parseNum(input.nominal);

  if (input.limite_inferior !== undefined || input.limite_superior !== undefined) {
    return {
      nominal,
      li: parseNum(input.limite_inferior, -Infinity),
      ls: parseNum(input.limite_superior, Infinity),
      tipo: "LIMITES_DIRECTOS"
    };
  }

  if (input.li !== undefined || input.ls !== undefined) {
    return {
      nominal,
      li: parseNum(input.li, -Infinity),
      ls: parseNum(input.ls, Infinity),
      tipo: "LIMITES_DIRECTOS"
    };
  }

  if (input.tolerancia !== undefined) {
    const t = Math.abs(parseNum(input.tolerancia));
    return {
      nominal,
      li: nominal - t,
      ls: nominal + t,
      tolerancia_menos: -t,
      tolerancia_mas: t,
      tipo: "TOLERANCIA_SIMETRICA"
    };
  }

  if (input.tolerancia_min !== undefined || input.tolerancia_max !== undefined) {
    const tMin = parseNum(input.tolerancia_min);
    const tMax = parseNum(input.tolerancia_max);

    return {
      nominal,
      li: nominal + tMin,
      ls: nominal + tMax,
      tolerancia_menos: tMin,
      tolerancia_mas: tMax,
      tipo: "TOLERANCIA_ASIMETRICA"
    };
  }

  return {
    nominal,
    li: -Infinity,
    ls: Infinity,
    tipo: "SIN_LIMITES"
  };
}

export function getMeasuredValue(input = {}) {
  if (input.valor_medido !== undefined) return parseNum(input.valor_medido);
  if (input.media_corregida !== undefined) return parseNum(input.media_corregida);
  if (input.media !== undefined) return parseNum(input.media);
  if (input.resultado !== undefined) return parseNum(input.resultado);
  if (input.lectura_media !== undefined) return parseNum(input.lectura_media);

  if (input.error !== undefined && input.nominal !== undefined) {
    return parseNum(input.nominal) + parseNum(input.error);
  }

  return null;
}

export function getExpandedUncertainty(input = {}) {
  return Math.abs(parseNum(
    input.U ??
    input.u_expandida ??
    input.incertidumbre_expandida ??
    input.incertidumbre ??
    input.U_total ??
    0
  ));
}

export function calculateError(input = {}) {
  if (input.error !== undefined) return parseNum(input.error);

  const measured = getMeasuredValue(input);
  if (measured === null) return null;

  return measured - parseNum(input.nominal);
}

export function getToleranceAbs(input = {}) {
  if (input.tolerancia_abs !== undefined) return Math.abs(parseNum(input.tolerancia_abs));
  if (input.tolerancia !== undefined) return Math.abs(parseNum(input.tolerancia));

  const limits = buildLimits(input);

  if (Number.isFinite(limits.li) && Number.isFinite(limits.ls)) {
    return Math.max(
      Math.abs(limits.ls - limits.nominal),
      Math.abs(limits.nominal - limits.li)
    );
  }

  if (input.tolerancia_max !== undefined || input.tolerancia_min !== undefined) {
    return Math.max(
      Math.abs(parseNum(input.tolerancia_max)),
      Math.abs(parseNum(input.tolerancia_min))
    );
  }

  return null;
}

export function buildHumanReason(status, reason) {
  const map = {
    SIN_VALOR_MEDIDO: "No se puede evaluar porque falta el valor medido.",
    SIN_ERROR_O_TOLERANCIA: "No se puede evaluar porque falta el error o la tolerancia.",
    VALOR_DENTRO_DE_LIMITES: "El valor medido esta dentro de los limites especificados.",
    VALOR_FUERA_DE_LIMITES: "El valor medido esta fuera de los limites especificados.",
    INTERVALO_COMPLETO_DENTRO_DE_LIMITES: "El resultado considerando la incertidumbre queda dentro de los limites.",
    INTERVALO_COMPLETO_FUERA_DE_LIMITES: "El resultado considerando la incertidumbre queda fuera de los limites.",
    INTERVALO_SOLAPA_LIMITE: "El intervalo de incertidumbre solapa con el limite de aceptacion.",
    ERROR_ABSOLUTO_DENTRO_DE_TOLERANCIA: "El error absoluto esta dentro de la tolerancia.",
    ERROR_ABSOLUTO_FUERA_DE_TOLERANCIA: "El error absoluto supera la tolerancia.",
    ABS_ERROR_MAS_U_DENTRO_TOLERANCIA: "El error absoluto mas la incertidumbre esta dentro de la tolerancia.",
    ABS_ERROR_MENOS_U_SUPERA_TOLERANCIA: "El error absoluto menos la incertidumbre supera la tolerancia.",
    ZONA_DE_INCERTIDUMBRE: "El resultado queda en zona de incertidumbre.",
    TMP_BINARIO_DENTRO_LIMITES: "Resultado operativo TMP: la media corregida esta dentro de limites.",
    TMP_BINARIO_FUERA_LIMITES: "Resultado operativo TMP: la media corregida esta fuera de limites.",
    TMP_BINARIO_ERROR_DENTRO_TOLERANCIA: "Resultado operativo TMP: el error absoluto esta dentro de tolerancia.",
    TMP_BINARIO_ERROR_FUERA_TOLERANCIA: "Resultado operativo TMP: el error absoluto supera la tolerancia.",
    TMP_BINARIO_NO_EVALUABLE: "Resultado operativo TMP no evaluable por falta de datos."
  };

  return map[reason] || `Resultado ${status}.`;
}

export function buildCertificateText({ status, regla }) {
  if (status === DECISION_STATUS.APTO) return `Resultado APTO segun regla de decision ${regla}.`;
  if (status === DECISION_STATUS.NO_APTO) return `Resultado NO APTO segun regla de decision ${regla}.`;
  if (status === DECISION_STATUS.INDETERMINADO) return `Resultado INDETERMINADO: no puede declararse conformidad de forma concluyente segun ${regla}.`;
  return `Resultado no evaluable segun regla de decision ${regla}.`;
}

export function decideOperationalBinary(input = {}, auditStatus = null) {
  if (auditStatus === DECISION_STATUS.NO_EVALUABLE) {
    return {
      status: DECISION_STATUS.NO_EVALUABLE,
      decision: DECISION_STATUS.NO_EVALUABLE,
      reason: "TMP_BINARIO_NO_EVALUABLE",
      motivo: buildHumanReason(DECISION_STATUS.NO_EVALUABLE, "TMP_BINARIO_NO_EVALUABLE"),
      regla_decision: DECISION_RULES.TMP_BINARIO_GUARD_BAND
    };
  }

  const error = calculateError(input);
  const T = getToleranceAbs(input);

  if (error !== null && T !== null) {
    const absE = Math.abs(error);
    const ok = absE <= T;

    return {
      status: ok ? DECISION_STATUS.APTO : DECISION_STATUS.NO_APTO,
      decision: ok ? DECISION_STATUS.APTO : DECISION_STATUS.NO_APTO,
      reason: ok ? "TMP_BINARIO_ERROR_DENTRO_TOLERANCIA" : "TMP_BINARIO_ERROR_FUERA_TOLERANCIA",
      motivo: buildHumanReason(
        ok ? DECISION_STATUS.APTO : DECISION_STATUS.NO_APTO,
        ok ? "TMP_BINARIO_ERROR_DENTRO_TOLERANCIA" : "TMP_BINARIO_ERROR_FUERA_TOLERANCIA"
      ),
      regla_decision: DECISION_RULES.TMP_BINARIO_GUARD_BAND
    };
  }

  const limits = buildLimits(input);
  const measured = getMeasuredValue(input);

  if (measured === null || limits.tipo === "SIN_LIMITES") {
    return {
      status: DECISION_STATUS.NO_EVALUABLE,
      decision: DECISION_STATUS.NO_EVALUABLE,
      reason: "TMP_BINARIO_NO_EVALUABLE",
      motivo: buildHumanReason(DECISION_STATUS.NO_EVALUABLE, "TMP_BINARIO_NO_EVALUABLE"),
      regla_decision: DECISION_RULES.TMP_BINARIO_GUARD_BAND
    };
  }

  const ok = measured >= limits.li && measured <= limits.ls;

  return {
    status: ok ? DECISION_STATUS.APTO : DECISION_STATUS.NO_APTO,
    decision: ok ? DECISION_STATUS.APTO : DECISION_STATUS.NO_APTO,
    reason: ok ? "TMP_BINARIO_DENTRO_LIMITES" : "TMP_BINARIO_FUERA_LIMITES",
    motivo: buildHumanReason(
      ok ? DECISION_STATUS.APTO : DECISION_STATUS.NO_APTO,
      ok ? "TMP_BINARIO_DENTRO_LIMITES" : "TMP_BINARIO_FUERA_LIMITES"
    ),
    regla_decision: DECISION_RULES.TMP_BINARIO_GUARD_BAND
  };
}

export function makePointResult({
  status,
  reason,
  input = {},
  measured = null,
  limits = null,
  U = null,
  interval = null,
  regla = null,
  error = null,
  T = null
}) {
  const nominal = parseNum(input.nominal, null);
  const calcError = error !== null ? error : calculateError({ ...input, valor_medido: measured });
  const finalRule = regla || normalizeRule(input.regla_decision || input.rule || input.regla);
  const operativo = decideOperationalBinary(input, status);

  return {
    status,
    decision: status,
    resultado_auditoria: status,
    decision_auditoria: status,

    resultado_operativo: operativo.status,
    decision_operativa: operativo.status,
    motivo_operativo: operativo.motivo,
    regla_operativa: operativo.regla_decision,

    conforme: status === DECISION_STATUS.APTO,
    conforme_operativo: operativo.status === DECISION_STATUS.APTO,

    reason,
    motivo: buildHumanReason(status, reason),
    regla_decision: finalRule,

    id: input.id || input.codigo || input.nombre || null,
    etiqueta: input.etiqueta || input.lado || input.funcion || input.nombre || null,

    nominal: nominal === null ? null : roundTo(nominal),
    valor_medido: measured === null ? null : roundTo(measured),
    error: calcError === null ? null : roundTo(calcError),
    U: U === null ? getExpandedUncertainty(input) : roundTo(U),
    tolerancia_abs: T === null ? getToleranceAbs(input) : roundTo(T),

    limites: limits
      ? {
          li: roundTo(limits.li),
          ls: roundTo(limits.ls),
          tipo: limits.tipo
        }
      : null,

    intervalo_expandido: interval
      ? {
          inferior: roundTo(interval.low),
          superior: roundTo(interval.high)
        }
      : null,

    certificado_texto: buildCertificateText({ status, regla: finalRule }),
    certificado_texto_operativo:
      operativo.status === DECISION_STATUS.APTO
        ? "Resultado operativo TMP: APTO."
        : operativo.status === DECISION_STATUS.NO_APTO
          ? "Resultado operativo TMP: NO APTO."
          : "Resultado operativo TMP: NO EVALUABLE.",

    raw: input
  };
}

export function decideSimple(input = {}) {
  const limits = buildLimits(input);
  const measured = getMeasuredValue(input);

  if (measured === null) {
    return makePointResult({
      status: DECISION_STATUS.NO_EVALUABLE,
      reason: "SIN_VALOR_MEDIDO",
      input,
      regla: DECISION_RULES.SIMPLE
    });
  }

  const inside = measured >= limits.li && measured <= limits.ls;

  return makePointResult({
    status: inside ? DECISION_STATUS.APTO : DECISION_STATUS.NO_APTO,
    reason: inside ? "VALOR_DENTRO_DE_LIMITES" : "VALOR_FUERA_DE_LIMITES",
    input,
    measured,
    limits,
    U: getExpandedUncertainty(input),
    regla: DECISION_RULES.SIMPLE
  });
}

export function decideWithGuardBand(input = {}) {
  const limits = buildLimits(input);
  const measured = getMeasuredValue(input);
  const U = getExpandedUncertainty(input);

  if (measured === null) {
    return makePointResult({
      status: DECISION_STATUS.NO_EVALUABLE,
      reason: "SIN_VALOR_MEDIDO",
      input,
      regla: DECISION_RULES.ILAC_G8_GUARD_BAND
    });
  }

  const intervalLow = measured - U;
  const intervalHigh = measured + U;

  const fullyInside = intervalLow >= limits.li && intervalHigh <= limits.ls;
  const fullyOutside = intervalHigh < limits.li || intervalLow > limits.ls;

  if (fullyInside) {
    return makePointResult({
      status: DECISION_STATUS.APTO,
      reason: "INTERVALO_COMPLETO_DENTRO_DE_LIMITES",
      input,
      measured,
      limits,
      U,
      interval: { low: intervalLow, high: intervalHigh },
      regla: DECISION_RULES.ILAC_G8_GUARD_BAND
    });
  }

  if (fullyOutside) {
    return makePointResult({
      status: DECISION_STATUS.NO_APTO,
      reason: "INTERVALO_COMPLETO_FUERA_DE_LIMITES",
      input,
      measured,
      limits,
      U,
      interval: { low: intervalLow, high: intervalHigh },
      regla: DECISION_RULES.ILAC_G8_GUARD_BAND
    });
  }

  return makePointResult({
    status: DECISION_STATUS.INDETERMINADO,
    reason: "INTERVALO_SOLAPA_LIMITE",
    input,
    measured,
    limits,
    U,
    interval: { low: intervalLow, high: intervalHigh },
    regla: DECISION_RULES.ILAC_G8_GUARD_BAND
  });
}

export function decideErrorAbsSimple(input = {}) {
  const error = calculateError(input);
  const T = getToleranceAbs(input);

  if (error === null || T === null) {
    return makePointResult({
      status: DECISION_STATUS.NO_EVALUABLE,
      reason: "SIN_ERROR_O_TOLERANCIA",
      input,
      regla: DECISION_RULES.ERROR_ABSOLUTO_SIMPLE
    });
  }

  const absE = Math.abs(error);

  return makePointResult({
    status: absE <= T ? DECISION_STATUS.APTO : DECISION_STATUS.NO_APTO,
    reason: absE <= T ? "ERROR_ABSOLUTO_DENTRO_DE_TOLERANCIA" : "ERROR_ABSOLUTO_FUERA_DE_TOLERANCIA",
    input,
    measured: getMeasuredValue(input),
    error,
    T,
    U: getExpandedUncertainty(input),
    regla: DECISION_RULES.ERROR_ABSOLUTO_SIMPLE
  });
}

export function decideErrorAbsILAC(input = {}) {
  const error = calculateError(input);
  const T = getToleranceAbs(input);
  const U = getExpandedUncertainty(input);

  if (error === null || T === null) {
    return makePointResult({
      status: DECISION_STATUS.NO_EVALUABLE,
      reason: "SIN_ERROR_O_TOLERANCIA",
      input,
      regla: DECISION_RULES.ERROR_ABSOLUTO_ILAC_G8
    });
  }

  const absE = Math.abs(error);

  if (absE + U <= T) {
    return makePointResult({
      status: DECISION_STATUS.APTO,
      reason: "ABS_ERROR_MAS_U_DENTRO_TOLERANCIA",
      input,
      measured: getMeasuredValue(input),
      error,
      T,
      U,
      regla: DECISION_RULES.ERROR_ABSOLUTO_ILAC_G8
    });
  }

  if (absE - U > T) {
    return makePointResult({
      status: DECISION_STATUS.NO_APTO,
      reason: "ABS_ERROR_MENOS_U_SUPERA_TOLERANCIA",
      input,
      measured: getMeasuredValue(input),
      error,
      T,
      U,
      regla: DECISION_RULES.ERROR_ABSOLUTO_ILAC_G8
    });
  }

  return makePointResult({
    status: DECISION_STATUS.INDETERMINADO,
    reason: "ZONA_DE_INCERTIDUMBRE",
    input,
    measured: getMeasuredValue(input),
    error,
    T,
    U,
    regla: DECISION_RULES.ERROR_ABSOLUTO_ILAC_G8
  });
}

export function decideISO14253(input = {}) {
  const result = decideWithGuardBand(input);

  return {
    ...result,
    regla_decision: DECISION_RULES.ISO_14253,
    terminologia_norma:
      result.status === DECISION_STATUS.APTO
        ? "CONFORME"
        : result.status === DECISION_STATUS.NO_APTO
          ? "NO_CONFORME"
          : "NO_DEMOSTRABLE"
  };
}

export function decidePoint(input = {}) {
  const rule = normalizeRule(input.regla_decision || input.rule || input.regla);

  if (rule === DECISION_RULES.SIMPLE) return decideSimple(input);
  if (rule === DECISION_RULES.ISO_14253) return decideISO14253(input);
  if (rule === DECISION_RULES.ERROR_ABSOLUTO_SIMPLE) return decideErrorAbsSimple(input);
  if (rule === DECISION_RULES.ERROR_ABSOLUTO_ILAC_G8) return decideErrorAbsILAC(input);

  if (input.error !== undefined || input.tolerancia_abs !== undefined) {
    return decideErrorAbsILAC(input);
  }

  return decideWithGuardBand(input);
}

export function rankStatus(status) {
  if (status === DECISION_STATUS.NO_APTO) return 4;
  if (status === DECISION_STATUS.INDETERMINADO) return 3;
  if (status === DECISION_STATUS.NO_EVALUABLE) return 2;
  if (status === DECISION_STATUS.APTO) return 1;
  return 0;
}

export function rankOperativo(status) {
  if (status === DECISION_STATUS.NO_APTO) return 3;
  if (status === DECISION_STATUS.NO_EVALUABLE) return 2;
  if (status === DECISION_STATUS.APTO) return 1;
  return 0;
}

export function worstStatus(decisions = []) {
  const sorted = [...decisions].sort((a, b) =>
    rankStatus(b.status || b.decision) - rankStatus(a.status || a.decision)
  );

  return sorted[0]?.status || sorted[0]?.decision || DECISION_STATUS.NO_EVALUABLE;
}

export function worstOperationalStatus(decisions = []) {
  const sorted = [...decisions].sort((a, b) =>
    rankOperativo(b.resultado_operativo || b.decision_operativa) -
    rankOperativo(a.resultado_operativo || a.decision_operativa)
  );

  return sorted[0]?.resultado_operativo ||
    sorted[0]?.decision_operativa ||
    DECISION_STATUS.NO_EVALUABLE;
}

export function familyUsesAnyNokNoApto(family, rule = "") {
  const f = String(family || "").toUpperCase();
  const r = String(rule || "").toUpperCase();

  if (r.includes("CUALQUIER")) return true;

  return [
    "PIE_DE_REY",
    "TAMPON_LISO_PNP",
    "TAMPON_ROSCADO_PNP",
    "CALIBRE_HERRADURA",
    "BALANZA"
  ].includes(f);
}

export function makeGlobalResult({ status, reason, motivo, family, rule, decisions }) {
  const operativo = worstOperationalStatus(decisions);

  return {
    status,
    decision: status,

    resultado_auditoria: status,
    decision_auditoria: status,

    resultado_operativo: operativo,
    decision_operativa: operativo,

    conforme: status === DECISION_STATUS.APTO,
    conforme_operativo: operativo === DECISION_STATUS.APTO,

    reason,
    motivo,

    motivo_operativo:
      operativo === DECISION_STATUS.APTO
        ? "Resultado operativo TMP: todos los puntos operativos son aptos."
        : operativo === DECISION_STATUS.NO_APTO
          ? "Resultado operativo TMP: existe al menos un punto operativo no apto."
          : "Resultado operativo TMP: existe al menos un punto no evaluable.",

    family,
    regla_global: rule,
    regla_operativa: DECISION_RULES.TMP_BINARIO_GUARD_BAND,

    puntos_totales: decisions.length,

    puntos_aptos: decisions.filter((d) => (d.status || d.decision) === DECISION_STATUS.APTO).length,
    puntos_no_aptos: decisions.filter((d) => (d.status || d.decision) === DECISION_STATUS.NO_APTO).length,
    puntos_indeterminados: decisions.filter((d) => (d.status || d.decision) === DECISION_STATUS.INDETERMINADO).length,
    puntos_no_evaluables: decisions.filter((d) => (d.status || d.decision) === DECISION_STATUS.NO_EVALUABLE).length,

    puntos_operativos_aptos: decisions.filter((d) => d.resultado_operativo === DECISION_STATUS.APTO).length,
    puntos_operativos_no_aptos: decisions.filter((d) => d.resultado_operativo === DECISION_STATUS.NO_APTO).length,
    puntos_operativos_no_evaluables: decisions.filter((d) => d.resultado_operativo === DECISION_STATUS.NO_EVALUABLE).length,

    certificado_texto:
      status === DECISION_STATUS.APTO
        ? "Decision global auditoria: APTO."
        : status === DECISION_STATUS.NO_APTO
          ? "Decision global auditoria: NO APTO."
          : status === DECISION_STATUS.INDETERMINADO
            ? "Decision global auditoria: INDETERMINADO."
            : "Decision global auditoria: NO EVALUABLE.",

    certificado_texto_operativo:
      operativo === DECISION_STATUS.APTO
        ? "Decision global operativa TMP: APTO."
        : operativo === DECISION_STATUS.NO_APTO
          ? "Decision global operativa TMP: NO APTO."
          : "Decision global operativa TMP: NO EVALUABLE.",

    decisions
  };
}

export function decideGlobal(input = {}) {
  const decisions = input.decisions || input.puntos || input.resultados || [];
  const family = String(input.family || input.familia || "").toUpperCase();
  const rule = String(input.regla_global || input.regla_decision_global || "").toUpperCase();

  if (!decisions.length) {
    return {
      status: DECISION_STATUS.NO_EVALUABLE,
      decision: DECISION_STATUS.NO_EVALUABLE,
      resultado_auditoria: DECISION_STATUS.NO_EVALUABLE,
      resultado_operativo: DECISION_STATUS.NO_EVALUABLE,
      reason: "SIN_DECISIONES_PARCIALES",
      motivo: "No hay decisiones parciales para evaluar el resultado global.",
      motivo_operativo: "No hay decisiones parciales para evaluar el resultado operativo.",
      family,
      rule
    };
  }

  const statuses = decisions.map((d) => d.status || d.decision);
  const anyNoApto = statuses.includes(DECISION_STATUS.NO_APTO);
  const anyInd = statuses.includes(DECISION_STATUS.INDETERMINADO);
  const anyNoEval = statuses.includes(DECISION_STATUS.NO_EVALUABLE);

  if (familyUsesAnyNokNoApto(family, rule)) {
    if (anyNoApto) {
      return makeGlobalResult({
        status: DECISION_STATUS.NO_APTO,
        reason: "CRITERIO_TMP_CUALQUIER_NOK_NO_APTO",
        motivo: "Criterio TMP auditoria: cualquier funcion, lado o prueba no apta convierte el equipo en NO APTO.",
        family,
        rule: DECISION_RULES.TMP_CUALQUIER_NOK_NO_APTO,
        decisions
      });
    }

    if (anyInd) {
      return makeGlobalResult({
        status: DECISION_STATUS.INDETERMINADO,
        reason: "EXISTE_RESULTADO_INDETERMINADO",
        motivo: "Existe al menos un resultado parcial indeterminado en auditoria.",
        family,
        rule: DECISION_RULES.TMP_CUALQUIER_NOK_NO_APTO,
        decisions
      });
    }

    if (anyNoEval) {
      return makeGlobalResult({
        status: DECISION_STATUS.NO_EVALUABLE,
        reason: "EXISTE_RESULTADO_NO_EVALUABLE",
        motivo: "Existe al menos un resultado parcial no evaluable.",
        family,
        rule: DECISION_RULES.TMP_CUALQUIER_NOK_NO_APTO,
        decisions
      });
    }

    return makeGlobalResult({
      status: DECISION_STATUS.APTO,
      reason: "TODAS_LAS_FUNCIONES_APTAS",
      motivo: "Todas las funciones, lados o pruebas evaluadas son aptas.",
      family,
      rule: DECISION_RULES.TMP_CUALQUIER_NOK_NO_APTO,
      decisions
    });
  }

  const worst = worstStatus(decisions);

  return makeGlobalResult({
    status: worst,
    reason: worst === DECISION_STATUS.APTO ? "TODOS_LOS_PUNTOS_APTOS" : "RESULTADO_GLOBAL_SEGUN_PEOR_PUNTO",
    motivo: worst === DECISION_STATUS.APTO
      ? "Todos los puntos evaluados son aptos."
      : "El resultado global de auditoria se establece segun el peor punto evaluado.",
    family,
    rule: DECISION_RULES.TMP_PEOR_PUNTO,
    decisions
  });
}

export function decideCalibration(input = {}) {
  const puntos = input.puntos || input.points || [];

  const pointDecisions = puntos.map((p, index) => ({
    index,
    id: p.id || p.codigo || `PUNTO_${index + 1}`,
    ...decidePoint({
      ...p,
      regla_decision: p.regla_decision || input.regla_decision,
      U: p.U ?? p.incertidumbre_expandida ?? p.incertidumbre ?? input.U
    })
  }));

  const global = decideGlobal({
    family: input.family || input.familia,
    regla_global: input.regla_global,
    decisions: pointDecisions
  });

  return {
    ok: true,

    status: global.status,
    decision: global.status,

    resultado_auditoria: global.resultado_auditoria,
    decision_auditoria: global.resultado_auditoria,

    resultado_operativo: global.resultado_operativo,
    decision_operativa: global.resultado_operativo,

    conforme: global.conforme,
    conforme_operativo: global.conforme_operativo,

    global,
    puntos: pointDecisions,

    resumen: {
      total: pointDecisions.length,

      aptos: global.puntos_aptos,
      no_aptos: global.puntos_no_aptos,
      indeterminados: global.puntos_indeterminados,
      no_evaluables: global.puntos_no_evaluables,

      operativos_aptos: global.puntos_operativos_aptos,
      operativos_no_aptos: global.puntos_operativos_no_aptos,
      operativos_no_evaluables: global.puntos_operativos_no_evaluables
    }
  };
}