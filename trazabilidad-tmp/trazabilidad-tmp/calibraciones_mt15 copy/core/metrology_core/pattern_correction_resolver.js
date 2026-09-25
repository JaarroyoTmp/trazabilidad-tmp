/* ===========================================================
   TMP PATTERN CORRECTION RESOLVER V2
   -----------------------------------------------------------
   Resuelve datos metrológicos reales del patrón en el punto usado.

   Regla TMP:
   - Si no hay datos certificados aplicables, NO se inventa.
   - Si hay valores certificados, se usa el punto más cercano o interpolación.
   - Si el certificado aporta fórmula de incertidumbre aplicable, se puede usar.
   - Si falta incertidumbre, devuelve NO_EVALUABLE.

   Caso TRIMOS 1288:
   - Certificado C-11377.00002
   - Campo calibrado 0-300 mm
   - Corrección global nula indicada por certificado
   - Incertidumbre general: U(L) = 1.1 + 0.031 * L µm
   =========================================================== */

export function parseNum(value, fallback = null) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;

  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function round(value, decimals = 9) {
  const n = parseNum(value, NaN);
  if (!Number.isFinite(n)) return null;
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

export function distance(a, b) {
  const x = parseNum(a, NaN);
  const y = parseNum(b, NaN);

  if (!Number.isFinite(x) || !Number.isFinite(y)) return Infinity;

  return Math.abs(x - y);
}

export function normalizeText(value) {
  return String(value ?? "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function fail(error, message, extra = {}) {
  return {
    ok: false,
    error,
    message,
    ...extra
  };
}

/* ===========================================================
   Utilidades de selección / interpolación
   =========================================================== */

export function getPatternId(selectedPattern = {}) {
  return (
    selectedPattern?.patron_id ||
    selectedPattern?.id ||
    selectedPattern?.selected_pattern?.patron_id ||
    selectedPattern?.selected_pattern?.id ||
    selectedPattern?.raw?.patron_id ||
    selectedPattern?.raw?.id ||
    null
  );
}

export function getRawPattern(selectedPattern = {}) {
  return (
    selectedPattern?.raw ||
    selectedPattern?.selected_pattern?.raw ||
    selectedPattern?.selected_pattern ||
    selectedPattern ||
    {}
  );
}

export function mapCertifiedValueRow(row = {}) {
  const nominal = parseNum(row.nominal ?? row.valor_nominal, null);

  const correccion = parseNum(
    row.correccion ??
    row.correccion_patron ??
    row.error,
    0
  );

  const incertidumbre = parseNum(
    row.incertidumbre ??
    row.u_patron ??
    row.u,
    null
  );

  const incertidumbreUs = parseNum(
    row.incertidumbre_us ??
    row.us ??
    row.u_uso,
    null
  );

  return {
    ...row,
    nominal_num: nominal,
    correccion_num: correccion,
    incertidumbre_num: incertidumbre,
    incertidumbre_us_num: incertidumbreUs,
    rango_desde_num: parseNum(row.rango_desde, null),
    rango_hasta_num: parseNum(row.rango_hasta, null)
  };
}

export function filterRowsInRange(rows = [], nominal) {
  const n = parseNum(nominal, null);
  if (n === null) return rows;

  return rows.filter((r) => {
    const desde = parseNum(r.rango_desde_num, null);
    const hasta = parseNum(r.rango_hasta_num, null);

    if (desde === null && hasta === null) return true;
    if (desde !== null && n < desde) return false;
    if (hasta !== null && n > hasta) return false;

    return true;
  });
}

export function findNearestCertifiedRows(rows = [], nominal) {
  const n = parseNum(nominal, null);

  if (n === null) {
    return {
      lower: null,
      upper: null,
      nearest: null
    };
  }

  const sorted = [...rows]
    .filter((r) => Number.isFinite(r.nominal_num))
    .sort((a, b) => a.nominal_num - b.nominal_num);

  const exact = sorted.find((r) => distance(r.nominal_num, n) < 0.000001);

  if (exact) {
    return {
      lower: exact,
      upper: exact,
      nearest: exact,
      exact: true
    };
  }

  const lower = [...sorted].reverse().find((r) => r.nominal_num <= n) || null;
  const upper = sorted.find((r) => r.nominal_num >= n) || null;

  const nearest = [...sorted].sort(
    (a, b) => distance(a.nominal_num, n) - distance(b.nominal_num, n)
  )[0] || null;

  return {
    lower,
    upper,
    nearest,
    exact: false
  };
}

export function interpolateLinear(x, x1, y1, x2, y2) {
  const X = parseNum(x, null);
  const X1 = parseNum(x1, null);
  const X2 = parseNum(x2, null);
  const Y1 = parseNum(y1, null);
  const Y2 = parseNum(y2, null);

  if ([X, X1, X2, Y1, Y2].some((v) => v === null)) return null;
  if (Math.abs(X2 - X1) < 1e-12) return Y1;

  return Y1 + ((X - X1) * (Y2 - Y1)) / (X2 - X1);
}

export function resolveInterpolatedCorrection(rows = [], nominal) {
  const n = parseNum(nominal, null);
  const found = findNearestCertifiedRows(rows, n);

  if (!found.nearest) {
    return {
      ok: false,
      error: "SIN_VALORES_CERTIFICADOS",
      message: "No existen valores certificados del patrón."
    };
  }

  if (found.exact) {
    return {
      ok: true,
      mode: "EXACTO",
      nominal_usado: n,
      punto_certificado: found.nearest,
      punto_certificado_nominal: found.nearest.nominal_num,
      correccion: found.nearest.correccion_num,
      incertidumbre: found.nearest.incertidumbre_num,
      incertidumbre_us: found.nearest.incertidumbre_us_num
    };
  }

  if (found.lower && found.upper) {
    const corr = interpolateLinear(
      n,
      found.lower.nominal_num,
      found.lower.correccion_num,
      found.upper.nominal_num,
      found.upper.correccion_num
    );

    const u = interpolateLinear(
      n,
      found.lower.nominal_num,
      found.lower.incertidumbre_num,
      found.upper.nominal_num,
      found.upper.incertidumbre_num
    );

    const us = interpolateLinear(
      n,
      found.lower.nominal_num,
      found.lower.incertidumbre_us_num,
      found.upper.nominal_num,
      found.upper.incertidumbre_us_num
    );

    return {
      ok: true,
      mode: "INTERPOLADO",
      nominal_usado: n,
      punto_certificado: null,
      punto_certificado_nominal: null,
      lower: found.lower,
      upper: found.upper,
      correccion: corr,
      incertidumbre: u,
      incertidumbre_us: us
    };
  }

  return {
    ok: true,
    mode: "MAS_CERCANO",
    nominal_usado: n,
    punto_certificado: found.nearest,
    punto_certificado_nominal: found.nearest.nominal_num,
    correccion: found.nearest.correccion_num,
    incertidumbre: found.nearest.incertidumbre_num,
    incertidumbre_us: found.nearest.incertidumbre_us_num,
    warning: "Nominal fuera de tramo interpolable. Se usa el punto certificado más cercano."
  };
}

/* ===========================================================
   Reglas especiales conocidas de certificados
   =========================================================== */

export function isTrimos1288Certificate(rows = [], raw = {}) {
  const txt = normalizeText([
    raw.codigo,
    raw.descripcion,
    raw.modelo,
    raw.nombre,
    rows?.[0]?.codigo,
    rows?.[0]?.descripcion,
    rows?.[0]?.numero_certificado
  ].filter(Boolean).join(" "));

  return (
    txt.includes("1288") &&
    txt.includes("TRIMOS") &&
    txt.includes("TELMA") &&
    txt.includes("C-11377.00002")
  );
}

export function trimos1288GeneralU(nominalMm) {
  const L = parseNum(nominalMm, null);
  if (L === null || L < 0 || L > 300) return null;

  // Certificado C-11377.00002:
  // U(L) = (1.1 + 0.031 * L) µm, L en mm.
  const uUm = 1.1 + 0.031 * L;

  return {
    ok: true,
    formula: "U(L) = 1.1 + 0.031 * L µm",
    L,
    U_um: round(uUm, 6),
    U_mm: round(uUm / 1000, 9),
    k: 2
  };
}

export function applyCertificateSpecificRules({
  rows = [],
  raw = {},
  nominal,
  baseResult
} = {}) {
  if (!baseResult?.ok) return baseResult;

  if (isTrimos1288Certificate(rows, raw)) {
    const uGeneral = trimos1288GeneralU(nominal);

    if (uGeneral?.ok) {
      /*
        Para este certificado, usamos corrección global nula si así se decide
        por el procedimiento TMP. Conservamos también la corrección interpolada
        por trazabilidad.
      */
      return {
        ...baseResult,
        source_rule: "TRIMOS_1288_C_11377_00002",
        correccion_certificado_interpolada: baseResult.correccion,
        correccion: 0,
        incertidumbre_certificado_interpolada: baseResult.incertidumbre,
        incertidumbre: uGeneral.U_mm,
        incertidumbre_um: uGeneral.U_um,
        formula_incertidumbre: uGeneral.formula,
        criterio_correccion: "CORRECCION_GLOBAL_NULA_SEGUN_CERTIFICADO",
        message: "Datos resueltos con fórmula general del certificado TRIMOS 1288 y corrección global nula."
      };
    }
  }

  return baseResult;
}

/* ===========================================================
   Función principal
   =========================================================== */

export async function resolvePatternCorrectionAtPoint({
  supabase,
  selectedPattern,
  nominal,
  unidad = "mm",
  allowNearest = true
} = {}) {
  const patronId = getPatternId(selectedPattern);
  const raw = getRawPattern(selectedPattern);

  if (!patronId) {
    return fail(
      "PATRON_NO_IDENTIFICADO",
      "No se ha podido identificar el patrón seleccionado."
    );
  }

  const nominalNum = parseNum(nominal);

  if (nominalNum === null) {
    return fail(
      "NOMINAL_NO_VALIDO",
      "No se ha podido resolver el nominal del punto."
    );
  }

  if (!supabase) {
    return fail(
      "SUPABASE_NO_DISPONIBLE",
      "No hay conexión con Supabase para consultar datos certificados del patrón."
    );
  }

  const { data, error } = await supabase
    .from("v_patron_valores_activos")
    .select("*")
    .eq("patron_id", patronId);

  if (error) {
    console.error("Error consultando v_patron_valores_activos:", error);

    return fail(
      "ERROR_CONSULTA_VALORES_CERTIFICADOS",
      "No se han podido consultar los valores certificados del patrón.",
      { supabase_error: error }
    );
  }

  if (!Array.isArray(data) || !data.length) {
    return fail(
      "PATRON_SIN_VALORES_CERTIFICADOS_ACTIVOS",
      "El patrón seleccionado no tiene valores certificados activos/vigentes aplicables."
    );
  }

  const rows = filterRowsInRange(
    data.map(mapCertifiedValueRow),
    nominalNum
  ).sort((a, b) => a.nominal_num - b.nominal_num);

  if (!rows.length) {
    return fail(
      "PATRON_FUERA_DE_RANGO_CERTIFICADO",
      `El nominal ${nominalNum} ${unidad} está fuera del rango certificado del patrón.`
    );
  }

  let resolved = resolveInterpolatedCorrection(rows, nominalNum);

  if (!resolved.ok) {
    return fail(resolved.error, resolved.message);
  }

  if (!allowNearest && resolved.mode === "MAS_CERCANO") {
    return fail(
      "SIN_TRAMO_INTERPOLABLE",
      `No existe tramo certificado interpolable para el nominal ${nominalNum} ${unidad}.`
    );
  }

  resolved = applyCertificateSpecificRules({
    rows,
    raw,
    nominal: nominalNum,
    baseResult: resolved
  });

  if (resolved.incertidumbre === null || resolved.incertidumbre === undefined) {
    return fail(
      "PATRON_SIN_INCERTIDUMBRE",
      "El patrón tiene datos certificados, pero no tiene incertidumbre asociada al punto."
    );
  }

  return {
    ok: true,
    source: "v_patron_valores_activos",
    patron_id: patronId,
    nominal_usado: nominalNum,
    unidad,
    ...resolved,
    correccion: round(resolved.correccion || 0, 9),
    incertidumbre: round(resolved.incertidumbre, 9),
    incertidumbre_us: round(resolved.incertidumbre_us, 9),
    message: resolved.message || "Datos metrológicos del patrón resueltos desde valores certificados."
  };
}