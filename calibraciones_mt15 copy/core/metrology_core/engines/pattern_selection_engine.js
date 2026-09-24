/* ===========================================================
   TMP MC-01 - PATTERN SELECTION ENGINE V1.0
   -----------------------------------------------------------
   Motor comun y prudente para proponer patrones reales.

   Principios TMP:
   - El procedimiento NO fija un patron concreto.
   - Supabase contiene los patrones reales disponibles.
   - El motor filtra por capacidad, rango, vigencia y prioridad.
   - No bloquea calibraciones: informa recomendado/alternativas.
   =========================================================== */

const DEFAULT_TABLES = ["v_patrones_certificados_vigentes", "patrones"];

export function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseNum(value, fallback = null) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(",", ".").replace(/[^0-9.+-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export const TMP_PATTERN_TYPES = Object.freeze({
  BANCO_HORIZONTAL: "BANCO_HORIZONTAL",
  JUEGO_CALAS: "JUEGO_CALAS",
  CALA_INDIVIDUAL: "CALA_INDIVIDUAL",
  ANILLO_PATRON: "ANILLO_PATRON",
  SUPERFICIE_REFERENCIA: "SUPERFICIE_REFERENCIA",
  TRIDIMENSIONAL: "TRIDIMENSIONAL"
});

export const TMP_PATTERN_ROLE = Object.freeze({
  RECOMENDADO: "RECOMENDADO",
  ALTERNATIVA: "ALTERNATIVA",
  COMPLEMENTARIO: "COMPLEMENTARIO"
});

export function detectPatternType(pattern = {}) {
  const text = normalizeText([
    pattern.tipo_patron,
    pattern.tipo,
    pattern.familia,
    pattern.descripcion,
    pattern.nombre,
    pattern.modelo,
    pattern.fabricante,
    pattern.capacidad,
    pattern.alcance,
    pattern.rango
  ].filter(Boolean).join(" "));

  if (text.includes("trimos") || text.includes("telma") || text.includes("banco") || text.includes("horizontal") || text.includes("una coordenada")) {
    return TMP_PATTERN_TYPES.BANCO_HORIZONTAL;
  }
  if (text.includes("anillo") && !text.includes("rosca")) return TMP_PATTERN_TYPES.ANILLO_PATRON;
  if (text.includes("cala") || text.includes("bloque patron") || text.includes("bloques patron") || text.includes("bloques patrón")) return TMP_PATTERN_TYPES.JUEGO_CALAS;
  if (text.includes("granito") || text.includes("superficie") || text.includes("mesa")) return TMP_PATTERN_TYPES.SUPERFICIE_REFERENCIA;
  if (text.includes("tridimensional") || text.includes("cmm") || text.includes("maquina de medir")) return TMP_PATTERN_TYPES.TRIDIMENSIONAL;

  return String(pattern.tipo_patron || pattern.tipo || pattern.familia || "").toUpperCase() || "PATRON";
}

export function getPatternLabel(pattern = {}) {
  return [
    pattern.codigo,
    pattern.descripcion || pattern.nombre,
    pattern.modelo,
    pattern.numero_serie || pattern.serie ? `S/N ${pattern.numero_serie || pattern.serie}` : null
  ].filter(Boolean).join(" - ") || "Patron sin descripcion";
}

export function getPatternCertificate(pattern = {}) {
  return pattern.numero_certificado || pattern.certificado || pattern.certificado_codigo || pattern.certificado_id || pattern.certificate || null;
}

export function getPatternExpiry(pattern = {}) {
  return pattern.fecha_vencimiento || pattern.fecha_proxima_cal || pattern.fecha_proxima_calibracion || pattern.proxima_calibracion || null;
}

export function isPatternActive(pattern = {}) {
  const state = normalizeText(pattern.estado || pattern.estado_actual || pattern.situacion || pattern.status || "");
  if (pattern.activo === false) return false;
  if (state.includes("baja") || state.includes("fuera") || state.includes("no uso") || state.includes("caduc")) return false;
  return true;
}

export function isPatternCurrent(pattern = {}, referenceDate = todayISO()) {
  const expiry = getPatternExpiry(pattern);
  if (!expiry) return false;
  return String(expiry).slice(0, 10) >= String(referenceDate).slice(0, 10);
}

export function getPatternRange(pattern = {}) {
  const text = String(pattern.rango || pattern.alcance || pattern.campo_medida || "");
  let min = parseNum(pattern.rango_min ?? pattern.rango_desde ?? pattern.minimo, null);
  let max = parseNum(pattern.rango_max ?? pattern.rango_hasta ?? pattern.maximo, null);

  if ((min === null || max === null) && text) {
    const nums = text.match(/[-+]?\d+(?:[,.]\d+)?/g)?.map((x) => parseNum(x)).filter((x) => x !== null) || [];
    if (nums.length >= 2) {
      min = Math.min(nums[0], nums[1]);
      max = Math.max(nums[0], nums[1]);
    } else if (nums.length === 1) {
      min = 0;
      max = nums[0];
    }
  }

  return { min, max, text };
}

export function patternCoversNominal(pattern = {}, nominal = null) {
  const n = parseNum(nominal, null);
  if (n === null) return true;

  const nominalPattern = parseNum(pattern.nominal ?? pattern.valor_nominal ?? pattern.medida, null);
  if (nominalPattern !== null) {
    const tol = Math.max(0.001, parseNum(pattern.tolerancia_busqueda, 0.5));
    return Math.abs(nominalPattern - n) <= tol;
  }

  const { min, max } = getPatternRange(pattern);
  if (min !== null && n < min) return false;
  if (max !== null && n > max) return false;
  return true;
}

export function buildPieDeReyPatternRequirement({ funcion = "EXTERIORES", nominal = null, rangoMax = null } = {}) {
  const fn = String(funcion || "").toUpperCase();
  const base = {
    family: "PIE_DE_REY",
    funcion: fn,
    nominal: parseNum(nominal, null),
    rango_max: parseNum(rangoMax, null),
    unidad: "mm",
    requiresCurrentCertificate: true,
    note: "Seleccion de patron para pie de rey segun criterio TMP."
  };

  if (fn.includes("INTERIOR")) {
    return {
      ...base,
      preferredTypes: [TMP_PATTERN_TYPES.ANILLO_PATRON],
      alternativeTypes: [TMP_PATTERN_TYPES.TRIDIMENSIONAL],
      complementaryTypes: [],
      method: "Interiores: anillos patron vigentes si existen."
    };
  }

  if (fn.includes("PROFUND")) {
    return {
      ...base,
      preferredTypes: [TMP_PATTERN_TYPES.JUEGO_CALAS, TMP_PATTERN_TYPES.CALA_INDIVIDUAL],
      alternativeTypes: [TMP_PATTERN_TYPES.BANCO_HORIZONTAL],
      complementaryTypes: [TMP_PATTERN_TYPES.SUPERFICIE_REFERENCIA],
      method: "Profundidad: bloques patron sobre superficie de referencia."
    };
  }

  if (fn.includes("ESCAL")) {
    return {
      ...base,
      preferredTypes: [TMP_PATTERN_TYPES.JUEGO_CALAS, TMP_PATTERN_TYPES.CALA_INDIVIDUAL],
      alternativeTypes: [TMP_PATTERN_TYPES.BANCO_HORIZONTAL],
      complementaryTypes: [TMP_PATTERN_TYPES.SUPERFICIE_REFERENCIA],
      method: "Escalon: bloques patron/superficie de referencia segun montaje."
    };
  }

  return {
    ...base,
    preferredTypes: [TMP_PATTERN_TYPES.BANCO_HORIZONTAL],
    alternativeTypes: [TMP_PATTERN_TYPES.JUEGO_CALAS, TMP_PATTERN_TYPES.CALA_INDIVIDUAL, TMP_PATTERN_TYPES.TRIDIMENSIONAL],
    complementaryTypes: [],
    method: "Exteriores: prioridad Banco Trimos/banco horizontal si cubre el rango."
  };
}

export function scorePatternForRequirement(pattern = {}, requirement = {}, referenceDate = todayISO()) {
  const detectedType = detectPatternType(pattern);
  const preferred = requirement.preferredTypes || [];
  const alternative = requirement.alternativeTypes || [];
  const complementary = requirement.complementaryTypes || [];

  let score = 0;
  const reasons = [];

  if (preferred.includes(detectedType)) {
    score += 1000;
    reasons.push("tipo_preferido");
  } else if (alternative.includes(detectedType)) {
    score += 600;
    reasons.push("tipo_alternativo");
  } else if (complementary.includes(detectedType)) {
    score += 300;
    reasons.push("tipo_complementario");
  } else {
    score -= 300;
    reasons.push("tipo_no_prioritario");
  }

  if (isPatternActive(pattern)) {
    score += 200;
    reasons.push("activo");
  } else {
    score -= 1000;
    reasons.push("inactivo");
  }

  if (isPatternCurrent(pattern, referenceDate)) {
    score += 250;
    reasons.push("certificado_vigente");
  } else {
    score -= 300;
    reasons.push("certificado_no_vigente_o_no_visible");
  }

  if (patternCoversNominal(pattern, requirement.nominal)) {
    score += 200;
    reasons.push("rango_cubre_nominal");
  } else {
    score -= 800;
    reasons.push("fuera_de_rango");
  }

  const priority = parseNum(pattern.prioridad_uso ?? pattern.prioridad ?? pattern.orden_preferente, null);
  if (priority !== null) {
    score += Math.max(0, 300 - priority * 50);
    reasons.push(`prioridad_uso_${priority}`);
  }

  const u = parseNum(pattern.incertidumbre ?? pattern.u_k2 ?? pattern.U ?? pattern.inc, null);
  if (u !== null) {
    score += Math.max(0, 150 - u * 1000);
    reasons.push("incertidumbre_informada");
  }

  if (getPatternCertificate(pattern)) {
    score += 100;
    reasons.push("certificado_identificado");
  }

  return { score, reasons, detectedType };
}

export function selectBestPatterns(candidates = [], requirement = {}, options = {}) {
  const referenceDate = options.referenceDate || todayISO();
  const minScore = options.minScore ?? 500;

  const evaluated = candidates.map((pattern) => {
    const scoring = scorePatternForRequirement(pattern, requirement, referenceDate);
    return {
      pattern,
      score: scoring.score,
      reasons: scoring.reasons,
      detectedType: scoring.detectedType,
      label: getPatternLabel(pattern),
      certificate: getPatternCertificate(pattern),
      expiry: getPatternExpiry(pattern)
    };
  }).sort((a, b) => b.score - a.score);

  const valid = evaluated.filter((x) => x.score >= minScore);

  return {
    ok: valid.length > 0,
    requirement,
    selected: valid[0] || null,
    alternatives: valid.slice(1, 4),
    rejected: evaluated.filter((x) => x.score < minScore).slice(0, 6),
    evaluated
  };
}

export async function loadPatternCandidatesFromSupabase(supabase, options = {}) {
  if (!supabase) return { ok: false, data: [], source: "NO_SUPABASE", error: "Cliente Supabase no disponible" };

  const tables = options.tables || DEFAULT_TABLES;
  let lastError = null;

  for (const table of tables) {
    try {
      let query = supabase.from(table).select("*").limit(500);
      // No forzamos filtros de columnas porque no todas las instalaciones tienen el mismo esquema.
      const { data, error } = await query;
      if (error) throw error;
      return { ok: true, data: data || [], source: table, error: null };
    } catch (e) {
      lastError = e;
    }
  }

  return { ok: false, data: [], source: null, error: lastError?.message || String(lastError || "No se pudieron leer patrones") };
}

export async function selectPatternForPieDeReyFunction(supabase, input = {}, options = {}) {
  const requirement = buildPieDeReyPatternRequirement(input);
  const loaded = await loadPatternCandidatesFromSupabase(supabase, options);
  const selection = selectBestPatterns(loaded.data || [], requirement, options);
  return {
    ...selection,
    source: loaded.source,
    load_ok: loaded.ok,
    load_error: loaded.error
  };
}

export async function selectPatternsForPieDeReyPlan(supabase, points = [], options = {}) {
  const loaded = await loadPatternCandidatesFromSupabase(supabase, options);
  const grouped = [];

  for (const point of points) {
    const requirement = buildPieDeReyPatternRequirement({
      funcion: point.funcion || point.kind || point.tipo,
      nominal: point.nominal,
      rangoMax: options.rangoMax
    });
    const selection = selectBestPatterns(loaded.data || [], requirement, options);
    grouped.push({ point, requirement, selection });
  }

  return {
    ok: true,
    source: loaded.source,
    load_ok: loaded.ok,
    load_error: loaded.error,
    points: grouped
  };
}

export default {
  buildPieDeReyPatternRequirement,
  selectBestPatterns,
  selectPatternForPieDeReyFunction,
  selectPatternsForPieDeReyPlan,
  loadPatternCandidatesFromSupabase
};
