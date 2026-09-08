/* ===========================================================
   TMP PATTERN MATCHER V1
   -----------------------------------------------------------
   Objetivo:
   Elegir patrones compatibles para una calibración concreta.

   Este módulo NO calcula.
   Decide qué patrón candidato es válido y cuál tiene prioridad.
   =========================================================== */

export function parseNum(value, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[_\\-]+/g, " ")
    .replace(/\\s+/g, " ")
    .trim();
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function isDateValid(dateValue, referenceDate = todayISO()) {
  if (!dateValue) return false;
  return String(dateValue).slice(0, 10) >= String(referenceDate).slice(0, 10);
}

export function buildPatternRequirement(input = {}) {
  const family = String(input.family || input.familia || input.familia_equipo || "").toUpperCase();
  const strategy = String(input.strategy || input.estrategia || input.operacion || "").toUpperCase();
  const nominal = parseNum(input.nominal ?? input.punto ?? input.valor_nominal);
  const unidad = input.unidad || "mm";

  if (family === "PIE_DE_REY") {
    if (strategy.includes("INTERIOR")) {
      return {
        capacidad: "DIAMETRO_INTERIOR",
        familia_equipo: "PIE_DE_REY",
        magnitud: "LONGITUD",
        unidad,
        nominal,
        preferidos: ["ANILLO_PATRON"],
        alternativos: ["TRIDIMENSIONAL"],
        requiere_certificado_vigente: true,
        requiere_trazabilidad_externa: true
      };
    }

    if (strategy.includes("SONDA") || strategy.includes("PROFUNDIDAD")) {
      return {
        capacidad: "LONGITUD_PROFUNDIDAD",
        familia_equipo: "PIE_DE_REY",
        magnitud: "LONGITUD",
        unidad,
        nominal,
        preferidos: ["JUEGO_CALAS"],
        alternativos: ["BANCO_HORIZONTAL"],
        requiere_certificado_vigente: true,
        requiere_trazabilidad_externa: true
      };
    }

    return {
      capacidad: "LONGITUD_EXTERIOR",
      familia_equipo: "PIE_DE_REY",
      magnitud: "LONGITUD",
      unidad,
      nominal,
      preferidos: ["BANCO_HORIZONTAL", "JUEGO_CALAS"],
      alternativos: ["TRIDIMENSIONAL"],
      requiere_certificado_vigente: true,
      requiere_trazabilidad_externa: true
    };
  }

  if (family === "MICROMETRO_EXTERIOR") {
    return {
      capacidad: "LONGITUD_EXTERIOR",
      familia_equipo: "MICROMETRO_EXTERIOR",
      magnitud: "LONGITUD",
      unidad,
      nominal,
      preferidos: ["JUEGO_CALAS"],
      alternativos: ["BANCO_HORIZONTAL"],
      requiere_certificado_vigente: true,
      requiere_trazabilidad_externa: true
    };
  }

  if (family === "MICROMETRO_INTERIOR_3_CONTACTOS") {
    return {
      capacidad: "DIAMETRO_INTERIOR",
      familia_equipo: "MICROMETRO_INTERIOR_3_CONTACTOS",
      magnitud: "LONGITUD",
      unidad,
      nominal,
      preferidos: ["ANILLO_PATRON"],
      alternativos: ["TRIDIMENSIONAL"],
      requiere_certificado_vigente: true,
      requiere_trazabilidad_externa: true
    };
  }

  if (family === "TAMPON_LISO_PNP") {
    return {
      capacidad: "DIAMETRO_EXTERIOR",
      familia_equipo: "TAMPON_LISO_PNP",
      magnitud: "LONGITUD",
      unidad,
      nominal,
      preferidos: ["BANCO_HORIZONTAL"],
      alternativos: ["JUEGO_CALAS", "TRIDIMENSIONAL"],
      requiere_certificado_vigente: true,
      requiere_trazabilidad_externa: true
    };
  }

  if (family === "TAMPON_ROSCADO_PNP") {
    return {
      capacidad: "MEDICION_ROSCA_SOBRE_RODILLOS",
      familia_equipo: "TAMPON_ROSCADO_PNP",
      magnitud: "LONGITUD",
      unidad,
      nominal,
      preferidos: ["BANCO_HORIZONTAL"],
      complementarios: ["RODILLOS_ROSCA"],
      alternativos: [],
      requiere_certificado_vigente: true,
      requiere_trazabilidad_externa: true
    };
  }

  if (family === "ANILLO_PATRON") {
    return {
      capacidad: "DIAMETRO_INTERIOR",
      familia_equipo: "ANILLO_PATRON",
      magnitud: "LONGITUD",
      unidad,
      nominal,
      preferidos: ["TRIDIMENSIONAL"],
      alternativos: ["BANCO_HORIZONTAL"],
      requiere_certificado_vigente: true,
      requiere_trazabilidad_externa: true
    };
  }

  if (family.includes("RELOJ_COMPARADOR")) {
    return {
      capacidad: "DESPLAZAMIENTO_LINEAL",
      familia_equipo: family,
      magnitud: "LONGITUD",
      unidad,
      nominal,
      preferidos: ["BANCO_HORIZONTAL"],
      alternativos: [],
      requiere_certificado_vigente: true,
      requiere_trazabilidad_externa: true
    };
  }

  if (family === "GRAMIL" || family === "SONDA_ALTURA") {
    return {
      capacidad: "LONGITUD_ALTURA",
      familia_equipo: family,
      magnitud: "LONGITUD",
      unidad,
      nominal,
      preferidos: ["BANCO_HORIZONTAL", "JUEGO_CALAS"],
      alternativos: ["TRIDIMENSIONAL"],
      requiere_certificado_vigente: true,
      requiere_trazabilidad_externa: true
    };
  }

  if (family === "LLAVE_DINAMOMETRICA") {
    return {
      capacidad: "PAR_TORSION",
      familia_equipo: "LLAVE_DINAMOMETRICA",
      magnitud: "TORQUE",
      unidad: input.unidad || "Nm",
      nominal,
      preferidos: ["BANCO_TORQUE"],
      alternativos: [],
      requiere_certificado_vigente: true,
      requiere_trazabilidad_externa: true
    };
  }

  if (family === "BALANZA") {
    return {
      capacidad: "MASA",
      familia_equipo: "BALANZA",
      magnitud: "MASA",
      unidad: input.unidad || "g",
      nominal,
      preferidos: ["PESAS_PATRON"],
      alternativos: [],
      requiere_certificado_vigente: true,
      requiere_trazabilidad_externa: true
    };
  }

  return {
    capacidad: input.capacidad || null,
    familia_equipo: family || null,
    magnitud: input.magnitud || null,
    unidad,
    nominal,
    preferidos: input.preferidos || [],
    alternativos: input.alternativos || [],
    requiere_certificado_vigente: true,
    requiere_trazabilidad_externa: true
  };
}

export function patternTypeMatches(pattern = {}, expectedTypes = []) {
  if (!expectedTypes || !expectedTypes.length) return false;

  const haystack = normalizeText([
    pattern.tipo_patron,
    pattern.tipo,
    pattern.familia,
    pattern.descripcion,
    pattern.capacidad,
    pattern.nombre
  ].filter(Boolean).join(" "));

  return expectedTypes.some((t) => {
    const tt = normalizeText(t);
    return haystack.includes(tt) || tt.includes(haystack);
  });
}

export function rangeMatches(pattern = {}, nominal = null) {
  const n = parseNum(nominal, null);
  if (n === null || !Number.isFinite(n)) return true;

  const min = pattern.rango_min !== undefined && pattern.rango_min !== null ? parseNum(pattern.rango_min) : null;
  const max = pattern.rango_max !== undefined && pattern.rango_max !== null ? parseNum(pattern.rango_max) : null;

  if (min !== null && n < min) return false;
  if (max !== null && n > max) return false;

  return true;
}

export function certificateMatches(pattern = {}, requirement = {}, referenceDate = todayISO()) {
  if (!requirement.requiere_certificado_vigente) return true;

  if (pattern.fecha_vencimiento) return isDateValid(pattern.fecha_vencimiento, referenceDate);
  if (pattern.fecha_proxima_cal) return isDateValid(pattern.fecha_proxima_cal, referenceDate);

  return false;
}

export function capabilityMatches(pattern = {}, requirement = {}) {
  const reqCap = normalizeText(requirement.capacidad);
  if (!reqCap) return true;

  const cap = normalizeText(pattern.capacidad || pattern.capacidad_patron || "");
  const fam = normalizeText(pattern.familia_equipo || "");

  if (cap && (cap === reqCap || cap.includes(reqCap) || reqCap.includes(cap))) return true;
  if (!cap && patternTypeMatches(pattern, requirement.preferidos || [])) return true;
  if (!cap && patternTypeMatches(pattern, requirement.alternativos || [])) return true;

  const reqFam = normalizeText(requirement.familia_equipo);
  if (fam && reqFam && fam === reqFam) return true;

  return false;
}

export function scorePattern(pattern = {}, requirement = {}, referenceDate = todayISO()) {
  let score = 0;
  const reasons = [];

  const preferred = patternTypeMatches(pattern, requirement.preferidos || []);
  const alternative = patternTypeMatches(pattern, requirement.alternativos || []);

  if (preferred) {
    score += 1000;
    reasons.push("tipo_preferido");
  }

  if (alternative) {
    score += 500;
    reasons.push("tipo_alternativo");
  }

  if (capabilityMatches(pattern, requirement)) {
    score += 300;
    reasons.push("capacidad_compatible");
  } else {
    score -= 1000;
    reasons.push("capacidad_no_confirmada");
  }

  if (rangeMatches(pattern, requirement.nominal)) {
    score += 200;
    reasons.push("rango_compatible");
  } else {
    score -= 1000;
    reasons.push("fuera_de_rango");
  }

  if (certificateMatches(pattern, requirement, referenceDate)) {
    score += 200;
    reasons.push("certificado_vigente");
  } else {
    score -= 500;
    reasons.push("certificado_no_vigente_o_no_informado");
  }

  if (pattern.activo === true || pattern.activo === undefined) {
    score += 100;
    reasons.push("activo");
  } else {
    score -= 1000;
    reasons.push("inactivo");
  }

  if (pattern.prioridad !== undefined && pattern.prioridad !== null) {
    score += Math.max(0, 200 - parseNum(pattern.prioridad));
    reasons.push("prioridad_capacidad");
  }

  return { score, reasons };
}

export function matchPatterns(requirement = {}, candidates = [], options = {}) {
  const referenceDate = options.referenceDate || todayISO();
  const minScore = options.minScore ?? 0;

  const evaluated = candidates.map((pattern) => {
    const evaluation = scorePattern(pattern, requirement, referenceDate);
    return { pattern, score: evaluation.score, reasons: evaluation.reasons };
  });

  const valid = evaluated
    .filter((x) => x.score >= minScore)
    .sort((a, b) => b.score - a.score);

  return {
    ok: valid.length > 0,
    requirement,
    selected: valid[0] || null,
    alternatives: valid.slice(1),
    rejected: evaluated.filter((x) => x.score < minScore).sort((a, b) => b.score - a.score)
  };
}

export async function loadPatternCandidatesFromSupabase(supabase, requirement = {}) {
  if (!supabase) throw new Error("Falta cliente Supabase");

  const { data, error } = await supabase
    .from("v_patrones_certificados_vigentes")
    .select("*")
    .eq("activo", true);

  if (error) throw error;
  return data || [];
}

export async function findBestPatternForCalibration(supabase, input = {}, options = {}) {
  const requirement = buildPatternRequirement(input);
  const candidates = await loadPatternCandidatesFromSupabase(supabase, requirement);
  return matchPatterns(requirement, candidates, options);
}