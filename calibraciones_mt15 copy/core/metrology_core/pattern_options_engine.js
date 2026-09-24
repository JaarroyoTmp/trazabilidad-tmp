/* ===========================================================
   TMP PATTERN OPTIONS ENGINE V1
   -----------------------------------------------------------
   Motor de opciones de patrones TMP.
   =========================================================== */

import {
  buildPatternRequirement,
  scorePattern,
  certificateMatches,
  rangeMatches,
  capabilityMatches,
  patternTypeMatches,
  loadPatternCandidatesFromSupabase,
  todayISO,
  parseNum
} from "./pattern_matcher.js";

export function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isPatternActive(pattern = {}) {
  return pattern.activo === true || pattern.activo === undefined || pattern.activo === null;
}

export function getPatternLabel(pattern = {}) {
  const parts = [
    pattern.codigo,
    pattern.descripcion || pattern.nombre,
    pattern.modelo,
    pattern.numero_serie ? `S/N ${pattern.numero_serie}` : null
  ].filter(Boolean);

  return parts.join(" — ");
}

export function getPatternTypeLabel(pattern = {}) {
  return pattern.tipo_patron || pattern.tipo || pattern.familia || "Patrón";
}

export function classifyOption(pattern = {}, requirement = {}) {
  if (patternTypeMatches(pattern, requirement.preferidos || [])) return "RECOMENDADO";
  if (patternTypeMatches(pattern, requirement.alternativos || [])) return "ALTERNATIVA";
  return "VALIDO";
}

/* ===========================================================
   Regla específica TMP: banco horizontal
   =========================================================== */

export function isHorizontalMeasuringBench(pattern = {}) {
  const text = normalizeText([
    pattern.codigo,
    pattern.descripcion,
    pattern.nombre,
    pattern.modelo,
    pattern.fabricante,
    pattern.tipo,
    pattern.tipo_patron,
    pattern.familia,
    pattern.rango,
    pattern.alcance
  ].filter(Boolean).join(" "));

  return (
    text.includes("banco") ||
    text.includes("trimos") ||
    text.includes("telma") ||
    text.includes("horizontal") ||
    text.includes("maquina de una coordenada") ||
    text.includes("medicion horizontal")
  );
}

export function requirementNeedsHorizontalBench(requirement = {}) {
  const text = normalizeText([
    requirement.family,
    requirement.familia,
    requirement.strategy,
    requirement.estrategia,
    requirement.patron_tipo,
    requirement.tipo_patron,
    ...(requirement.preferidos || []),
    ...(requirement.alternativos || [])
  ].filter(Boolean).join(" "));

  return (
    text.includes("tampon liso") ||
    text.includes("tapon liso") ||
    text.includes("banco horizontal") ||
    text.includes("banco medicion") ||
    text.includes("banco de medicion")
  );
}

export function validatePatternOption(pattern = {}, requirement = {}, options = {}) {
  const referenceDate = options.referenceDate || todayISO();

  const failures = [];
  const warnings = [];

  const bancoHorizontalRequerido = requirementNeedsHorizontalBench(requirement);
  const esBancoHorizontal = isHorizontalMeasuringBench(pattern);

  if (!isPatternActive(pattern)) {
    failures.push("PATRON_INACTIVO");
  }

  if (pattern.conforme === false) {
    failures.push("CERTIFICADO_NO_CONFORME");
  }

  if (
    requirement.requiere_certificado_vigente &&
    !certificateMatches(pattern, requirement, referenceDate)
  ) {
    failures.push("CERTIFICADO_NO_VIGENTE");
  }

  /*
    Regla TMP:
    Los tampones lisos P/NP se calibran con banco de medición horizontal.
    No buscamos un patrón nominal 8.500 / 8.523.
    Buscamos un banco horizontal válido y vigente.
  */
  if (bancoHorizontalRequerido) {
    if (!esBancoHorizontal) {
      failures.push("NO_ES_BANCO_HORIZONTAL");
    }

    const hasRangeInfo =
      pattern.rango ||
      pattern.rango_min !== undefined ||
      pattern.rango_max !== undefined ||
      pattern.alcance;

    if (hasRangeInfo && !rangeMatches(pattern, requirement.nominal)) {
      failures.push("FUERA_DE_RANGO_BANCO_HORIZONTAL");
    }

    if (!pattern.fecha_vencimiento && requirement.requiere_certificado_vigente) {
      warnings.push("SIN_FECHA_VENCIMIENTO_VISIBLE");
    }

    if (!pattern.numero_certificado && !pattern.certificado_url && !pattern.archivo_url) {
      warnings.push("SIN_NUMERO_CERTIFICADO_VISIBLE");
    }

    warnings.push("Regla TMP aplicada: tampón liso P/NP calibrado con banco de medición horizontal.");

    return {
      valid: failures.length === 0,
      failures,
      warnings
    };
  }

  // Comportamiento genérico anterior
  if (!capabilityMatches(pattern, requirement)) {
    failures.push("CAPACIDAD_NO_COMPATIBLE");
  }

  if (!rangeMatches(pattern, requirement.nominal)) {
    failures.push("FUERA_DE_RANGO");
  }

  if (!pattern.fecha_vencimiento && requirement.requiere_certificado_vigente) {
    warnings.push("SIN_FECHA_VENCIMIENTO_VISIBLE");
  }

  if (!pattern.numero_certificado && !pattern.certificado_url && !pattern.archivo_url) {
    warnings.push("SIN_NUMERO_CERTIFICADO_VISIBLE");
  }

  return {
    valid: failures.length === 0,
    failures,
    warnings
  };
}

export function buildOption(pattern = {}, requirement = {}, options = {}) {
  const validation = validatePatternOption(pattern, requirement, options);
  const scoring = scorePattern(pattern, requirement, options.referenceDate || todayISO());

  return {
    valid: validation.valid,
    categoria: classifyOption(pattern, requirement),
    score: scoring.score,
    reasons: scoring.reasons,
    failures: validation.failures,
    warnings: validation.warnings,

    patron_id: pattern.patron_id || pattern.id,
    codigo: pattern.codigo || null,
    label: getPatternLabel(pattern),
    descripcion: pattern.descripcion || pattern.nombre || null,
    tipo_patron: getPatternTypeLabel(pattern),

    laboratorio: pattern.laboratorio || null,
    certificado: pattern.numero_certificado || null,
    fecha_calibracion: pattern.fecha_calibracion || pattern.fecha_ultima_cal || null,
    fecha_vencimiento: pattern.fecha_vencimiento || pattern.fecha_proxima_cal || null,
    archivo_url: pattern.archivo_url || pattern.certificado_url || null,

    rango: {
      texto: pattern.rango || null,
      min: pattern.rango_min ?? null,
      max: pattern.rango_max ?? null,
      unidad: pattern.unidad || requirement.unidad || null
    },

    metrologia: {
      incertidumbre: pattern.incertidumbre ?? pattern.u_patron ?? null,
      correccion: pattern.correccion_patron ?? pattern.error ?? null,
      factor_k: pattern.factor_k ?? pattern.k ?? null,
      trazabilidad: pattern.trazabilidad ?? null
    },

    ui: {
      selectable: validation.valid,
      badge: validation.valid ? classifyOption(pattern, requirement) : "NO_VALIDO",
      texto_principal: getPatternLabel(pattern),
      texto_secundario: [
        getPatternTypeLabel(pattern),
        pattern.fecha_vencimiento ? `Vence: ${pattern.fecha_vencimiento}` : null,
        pattern.laboratorio ? `Lab: ${pattern.laboratorio}` : null
      ].filter(Boolean).join(" · ")
    },

    raw: pattern
  };
}

export function buildPatternOptions(input = {}, candidates = [], options = {}) {
  const requirement = input.requirement || buildPatternRequirement(input);

  const allOptions = candidates.map((pattern) => buildOption(pattern, requirement, options));

  const validOptions = allOptions
    .filter((o) => o.valid)
    .sort((a, b) => {
      if (a.categoria !== b.categoria) {
        const order = { RECOMENDADO: 0, VALIDO: 1, ALTERNATIVA: 2 };
        return (order[a.categoria] ?? 9) - (order[b.categoria] ?? 9);
      }
      return b.score - a.score;
    });

  const rejectedOptions = allOptions
    .filter((o) => !o.valid)
    .sort((a, b) => b.score - a.score);

  return {
    ok: validOptions.length > 0,
    requirement,
    options: validOptions,
    rejected: options.includeRejected ? rejectedOptions : [],
    resumen: {
      total_candidatos: candidates.length,
      validos: validOptions.length,
      rechazados: rejectedOptions.length,
      recomendados: validOptions.filter((o) => o.categoria === "RECOMENDADO").length,
      alternativas: validOptions.filter((o) => o.categoria === "ALTERNATIVA").length
    },
    message: validOptions.length
      ? "Opciones de patrón válidas preparadas para selección del operario."
      : "No hay patrones válidos para este punto con los criterios actuales."
  };
}

export async function loadPatternOptionsFromSupabase(supabase, input = {}, options = {}) {
  if (!supabase) throw new Error("Falta cliente Supabase");

  const requirement = input.requirement || buildPatternRequirement(input);
  const candidates = await loadPatternCandidatesFromSupabase(supabase, requirement);

  return buildPatternOptions(
    { ...input, requirement },
    candidates,
    options
  );
}

/* ===========================================================
   Selección del operario
   =========================================================== */

export function selectPatternOption(optionsResult = {}, selectedPatronId, meta = {}) {
  const selected = (optionsResult.options || []).find(
    (o) => String(o.patron_id) === String(selectedPatronId)
  );

  if (!selected) {
    return {
      ok: false,
      error: "PATRON_NO_SELECCIONABLE",
      message: "El patrón elegido no está entre las opciones válidas."
    };
  }

  return {
    ok: true,
    selected_pattern: selected,
    seleccion: {
      patron_id: selected.patron_id,
      codigo: selected.codigo,
      label: selected.label,
      categoria: selected.categoria,
      seleccionado_por: meta.operario || meta.usuario || null,
      fecha_seleccion: meta.fecha || new Date().toISOString(),
      motivo: meta.motivo || "Seleccionado por el operario entre opciones válidas TMP.",
      requirement: optionsResult.requirement
    }
  };
}

/* ===========================================================
   Helper para aplicar a una pauta
   =========================================================== */

export async function attachPatternOptionsToProcedure(supabase, procedure = {}, options = {}) {
  const funciones = [];

  for (const funcion of procedure.funciones || []) {
    const puntos = [];

    for (const punto of funcion.puntos || []) {
      const input = {
        family: procedure.family,
        familia: procedure.family,
        strategy: funcion.id || punto.funcion,
        estrategia: funcion.id || punto.funcion,
        nominal: punto.nominal,
        unidad: punto.unidad || "mm",
        patron_tipo: punto.patron_tipo || funcion.patron_tipo,
        preferidos: [punto.patron_tipo || funcion.patron_tipo].filter(Boolean),
        punto,
        funcion,
        procedure
      };

      const patternOptions = await loadPatternOptionsFromSupabase(supabase, input, options);

      puntos.push({
        ...punto,
        pattern_options: patternOptions
      });
    }

    funciones.push({
      ...funcion,
      puntos
    });
  }

  return {
    ...procedure,
    pattern_options_attached: true,
    funciones
  };
}