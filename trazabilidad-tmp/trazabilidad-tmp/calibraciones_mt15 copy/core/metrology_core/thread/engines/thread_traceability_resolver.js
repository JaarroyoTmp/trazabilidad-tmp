/* ===========================================================
   TMP THREAD TRACEABILITY RESOLVER V1
   -----------------------------------------------------------
   Motor de trazabilidad real para roscas / MT16.

   Objetivo:
   - Crear una capa metrológica limpia y reutilizable.
   - Resolver banco Trimos, rodillos y patrón de rosca.
   - Devolver correcciones, incertidumbres, certificados y vigencias.
   - No calcular la geometría de la rosca: eso lo hace el workflow MT16.
   - No preguntar al operario: todo automático desde Supabase.

   Entrada esperada:
   resolveThreadTraceability(sb, { equipment, workflow })

   Salida:
   {
     ok,
     traceability_status,
     banco,
     rodillos,
     patron,
     corrections,
     uncertainty_model,
     certificate_permission,
     warnings
   }

   NOTA:
   - Este motor usa primero v_patron_valores_activos.
   - Mantiene fallback robusto si faltan columnas.
   - Certificado final sólo permitido si banco + rodillos + patrón están OK.
   =========================================================== */

export const TMP_THREAD_TRACEABILITY_RESOLVER_VERSION =
  "TMP_THREAD_TRACEABILITY_RESOLVER_V1_20260625_REAL_TRACEABILITY_ENGINE";

export const TMP_THREAD_TRACEABILITY_TABLES = {
  patron_values_view: "v_patron_valores_activos"
};

export const TMP_THREAD_TRACEABILITY_DEFAULTS = {
  preferred_trimos_code: "1288",
  trimos_search_words: ["TRIMOS", "BANCO", "TELMA"],
  wire_search_words: ["RODIL", "HILO", "WIRE", "TRES HILOS", "JUEGO DE HILOS"],
  thread_pattern_search_words: [
    "PATRON ROSCA",
    "PATRON DE ROSCA",
    "PATRON ROSCADO",
    "MASTER ROSCA",
    "ANILLO ROSCA",
    "TAMPON ROSCA MASTER"
  ],
  wire_tolerance_mm: 0.03,
  default_k: 2,
  default_resolution_mm: 0.001,
  default_u_temperature_mm: 0
};

/* ===========================================================
   UTILIDADES
   =========================================================== */

export function parseNum(value, fallback = null) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value === null || value === undefined || value === "") return fallback;

  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function round(value, decimals = 9) {
  const n = parseNum(value, null);
  if (!Number.isFinite(n)) return null;
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

export function normalizeText(value = "") {
  return String(value || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/,/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

export function joinRowText(row = {}) {
  return normalizeText(
    [
      row.codigo,
      row.descripcion,
      row.fabricante,
      row.modelo,
      row.familia,
      row.tipo_patron,
      row.observaciones,
      row.numero_certificado,
      row.certificado
    ]
      .filter(Boolean)
      .join(" ")
  );
}

export function firstNumeric(row = {}, keys = [], fallback = null) {
  for (const key of keys) {
    const n = parseNum(row[key], null);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

export function firstText(row = {}, keys = [], fallback = "") {
  for (const key of keys) {
    const v = row[key];
    if (v !== null && v !== undefined && String(v).trim() !== "") return v;
  }
  return fallback;
}

export function todayOnly() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isExpired(dateValue) {
  if (!dateValue) return true;
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return true;
  d.setHours(0, 0, 0, 0);
  return d < todayOnly();
}

export function rowIsActiveAndValid(row = {}) {
  const activo =
    row.activo === true ||
    row.activo === "true" ||
    row.activo === 1 ||
    row.activo === "1" ||
    row.activo === null ||
    row.activo === undefined;

  const estado = normalizeText(row.estado || "");
  const estadoOk =
    !estado ||
    estado.includes("VIGENTE") ||
    estado.includes("OK") ||
    estado.includes("APTO") ||
    estado.includes("VALID");

  const vencimiento =
    row.fecha_vencimiento ||
    row.proxima_calibracion ||
    row.fecha_proxima_calibracion ||
    row.caducidad ||
    row.valid_until;

  return activo && estadoOk && !isExpired(vencimiento);
}

export function getWorkflowNominalMm(workflow = {}) {
  return (
    parseNum(workflow?.parsed?.nominal_mm, null) ||
    parseNum(workflow?.geometry?.geometry?.nominal_mm, null) ||
    parseNum(workflow?.geometry?.geometry?.basic?.major_diameter, null)
  );
}

export function getWorkflowPitchMm(workflow = {}) {
  return parseNum(workflow?.parsed?.pitch_mm, null);
}

export function getWorkflowClass(workflow = {}) {
  return (
    workflow?.parsed?.tolerance_class ||
    workflow?.input?.tolerance_class ||
    ""
  );
}

export function getWorkflowDesignation(workflow = {}) {
  return normalizeText(
    workflow?.parsed?.normalized ||
      workflow?.input?.designation ||
      workflow?.input?.rango ||
      workflow?.input?.raw ||
      ""
  );
}

export function getWireMm(workflow = {}) {
  return parseNum(workflow?.trimos?.setup?.wire_mm, null);
}

export function getTrimosTargetMeanMm(workflow = {}) {
  const points = workflow?.trimos?.points || [];
  const targets = points
    .map((p) => parseNum(p.target_trimos_mm, null))
    .filter((v) => Number.isFinite(v));

  if (targets.length) {
    return targets.reduce((a, b) => a + b, 0) / targets.length;
  }

  return getWorkflowNominalMm(workflow);
}

/* ===========================================================
   SUPABASE
   =========================================================== */

export async function safeSelect(label, fn) {
  try {
    const { data, error } = await fn();

    if (error) {
      return {
        ok: false,
        source: label,
        error: error.message || String(error),
        data: []
      };
    }

    return {
      ok: true,
      source: label,
      data: Array.isArray(data) ? data : []
    };
  } catch (e) {
    return {
      ok: false,
      source: label,
      error: e.message || String(e),
      data: []
    };
  }
}

export async function fetchPatternValuesView(sb) {
  if (!sb) {
    return {
      ok: false,
      source: TMP_THREAD_TRACEABILITY_TABLES.patron_values_view,
      error: "SUPABASE_CLIENT_MISSING",
      data: []
    };
  }

  return safeSelect(TMP_THREAD_TRACEABILITY_TABLES.patron_values_view, () =>
    sb
      .from(TMP_THREAD_TRACEABILITY_TABLES.patron_values_view)
      .select("*")
      .limit(1000)
  );
}

/* ===========================================================
   SELECCIÓN DE FILAS
   =========================================================== */

export function rowMatchesAnyWord(row = {}, words = []) {
  const text = joinRowText(row);
  return words.some((w) => text.includes(normalizeText(w)));
}

export function rowLooksLikeTrimos(row = {}) {
  const code = String(row.codigo || "").trim();
  if (code === TMP_THREAD_TRACEABILITY_DEFAULTS.preferred_trimos_code) return true;

  const text = joinRowText(row);
  return TMP_THREAD_TRACEABILITY_DEFAULTS.trimos_search_words.some((w) =>
    text.includes(normalizeText(w))
  );
}

export function rowLooksLikeWire(row = {}, targetWireMm = null) {
  const textHit = rowMatchesAnyWord(
    row,
    TMP_THREAD_TRACEABILITY_DEFAULTS.wire_search_words
  );

  const nominal =
    firstNumeric(row, ["nominal_num", "nominal", "valor_medio", "diametro", "diametro_mm"], null);

  const diameterHit =
    Number.isFinite(targetWireMm) &&
    Number.isFinite(nominal) &&
    Math.abs(nominal - targetWireMm) <=
      TMP_THREAD_TRACEABILITY_DEFAULTS.wire_tolerance_mm;

  return textHit || diameterHit;
}

export function rowLooksLikeThreadPattern(row = {}, workflow = {}) {
  const text = joinRowText(row);
  const designation = getWorkflowDesignation(workflow);
  const nominal = getWorkflowNominalMm(workflow);
  const pitch = getWorkflowPitchMm(workflow);
  const cls = normalizeText(getWorkflowClass(workflow));

  const semanticHit = TMP_THREAD_TRACEABILITY_DEFAULTS.thread_pattern_search_words.some((w) =>
    text.includes(normalizeText(w))
  );

  const designationHit =
    designation &&
    (
      text.includes(designation) ||
      (
        Number.isFinite(nominal) &&
        text.includes(`M${String(nominal).replace(".", ".")}`)
      )
    );

  const classHit = !cls || text.includes(cls) || designation.includes(cls);
  const pitchHit = !Number.isFinite(pitch) || text.includes(String(pitch));

  return semanticHit || (designationHit && classHit && pitchHit);
}

export function groupRowsByPattern(rows = []) {
  const groups = new Map();

  for (const row of rows) {
    const key =
      row.patron_id ||
      row.codigo ||
      row.certificado_id ||
      row.numero_certificado ||
      "UNKNOWN";

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  return Array.from(groups.entries()).map(([key, rows]) => ({ key, rows }));
}

export function chooseBestGroup(groups = [], preferenceFn = null) {
  if (!groups.length) return null;

  if (typeof preferenceFn === "function") {
    const preferred = groups.find((g) => g.rows.some(preferenceFn));
    if (preferred) return preferred;
  }

  return groups[0];
}

/* ===========================================================
   CERTIFICADOS / INTERPOLACIÓN
   =========================================================== */

export function chooseRowsAroundNominal(rows = [], nominalMm = null) {
  const numeric = rows
    .filter((r) => Number.isFinite(firstNumeric(r, ["nominal_num", "nominal"], null)))
    .sort(
      (a, b) =>
        firstNumeric(a, ["nominal_num", "nominal"], 0) -
        firstNumeric(b, ["nominal_num", "nominal"], 0)
    );

  if (!numeric.length) {
    return {
      lower: rows[0] || null,
      upper: rows[0] || null,
      exact: rows[0] || null,
      mode: "NO_NUMERIC_CERTIFICATE_POINTS"
    };
  }

  if (!Number.isFinite(nominalMm)) {
    return {
      lower: numeric[0],
      upper: numeric[0],
      exact: numeric[0],
      mode: "FIRST_CERTIFICATE_POINT"
    };
  }

  let lower = null;
  let upper = null;
  let exact = null;

  for (const row of numeric) {
    const n = firstNumeric(row, ["nominal_num", "nominal"], null);
    if (!Number.isFinite(n)) continue;

    if (Math.abs(n - nominalMm) < 1e-9) exact = row;
    if (n <= nominalMm) lower = row;
    if (n >= nominalMm && !upper) upper = row;
  }

  if (!lower) lower = numeric[0];
  if (!upper) upper = numeric[numeric.length - 1];

  return {
    lower,
    upper,
    exact,
    mode: exact ? "EXACT_CERTIFICATE_POINT" : "INTERPOLATED_CERTIFICATE_POINT"
  };
}

export function interpolateFromRows(lower, upper, nominalMm, keys = []) {
  if (!lower && !upper) return null;
  if (!lower) lower = upper;
  if (!upper) upper = lower;

  const x1 = firstNumeric(lower, ["nominal_num", "nominal"], null);
  const x2 = firstNumeric(upper, ["nominal_num", "nominal"], null);
  const y1 = firstNumeric(lower, keys, null);
  const y2 = firstNumeric(upper, keys, null);

  if (!Number.isFinite(y1) && !Number.isFinite(y2)) return null;
  if (!Number.isFinite(y1)) return y2;
  if (!Number.isFinite(y2)) return y1;

  if (
    !Number.isFinite(nominalMm) ||
    !Number.isFinite(x1) ||
    !Number.isFinite(x2) ||
    x1 === x2
  ) {
    return y1;
  }

  return y1 + ((nominalMm - x1) * (y2 - y1)) / (x2 - x1);
}

export function calculateExpandedUFromRule(row = {}, nominalMm = null) {
  const code = String(row.codigo || "").trim();
  const cert = normalizeText(row.numero_certificado || row.certificado || "");
  const rule = normalizeText(row.source_rule || row.observaciones || "");

  /*
    Regla detectada en la vista real para TRIMOS 1288:
    U(L) = 1.1 + 0.031 * L µm
    Convertimos µm a mm dividiendo entre 1000.
  */
  if (
    Number.isFinite(nominalMm) &&
    (
      code === TMP_THREAD_TRACEABILITY_DEFAULTS.preferred_trimos_code ||
      cert.includes("C-11377.00002") ||
      rule.includes("TRIMOS_1288")
    )
  ) {
    return round((1.1 + 0.031 * nominalMm) / 1000, 9);
  }

  return null;
}

export function buildCertificateFromRows(rows = [], nominalMm = null, options = {}) {
  const selected = chooseRowsAroundNominal(rows, nominalMm);
  const ref = selected.exact || selected.lower || selected.upper || rows[0] || null;

  if (!ref) {
    return {
      ok: false,
      error: "NO_CERTIFICATE_ROWS",
      certificate: null
    };
  }

  const correctionRaw = interpolateFromRows(selected.lower, selected.upper, nominalMm, [
    "correccion_num",
    "correccion",
    "error_num",
    "error",
    "desviacion_num",
    "desviacion"
  ]);

  const expandedU =
    calculateExpandedUFromRule(ref, nominalMm) ||
    interpolateFromRows(selected.lower, selected.upper, nominalMm, [
      "incertidumbre_us_num",
      "incertidumbre_us",
      "incertidumbre_num",
      "incertidumbre",
      "u_expandida",
      "u"
    ]);

  const k =
    firstNumeric(ref, ["k", "factor_k", "factor_cobertura"], null) ||
    TMP_THREAD_TRACEABILITY_DEFAULTS.default_k;

  const uStandard =
    Number.isFinite(expandedU) && Number.isFinite(k) && k !== 0
      ? expandedU / k
      : null;

  const correctionApplied =
    options.apply_correction === true && Number.isFinite(correctionRaw)
      ? correctionRaw
      : 0;

  return {
    ok: true,
    certificate: {
      id: firstText(ref, ["certificado_id", "id"], null),
      patron_id: firstText(ref, ["patron_id"], null),
      codigo: firstText(ref, ["codigo"], null),
      descripcion: firstText(ref, ["descripcion"], null),
      fabricante: firstText(ref, ["fabricante"], null),
      modelo: firstText(ref, ["modelo"], null),
      familia: firstText(ref, ["familia"], null),
      tipo_patron: firstText(ref, ["tipo_patron"], null),
      laboratorio: firstText(ref, ["laboratorio"], null),
      certificado: firstText(ref, ["numero_certificado", "certificado"], null),
      archivo_url: firstText(ref, ["archivo_url", "certificado_url"], null),
      fecha_calibracion: firstText(ref, ["fecha_calibracion"], null),
      proxima_calibracion: firstText(
        ref,
        ["fecha_vencimiento", "proxima_calibracion", "fecha_proxima_calibracion"],
        null
      ),
      estado: firstText(ref, ["estado"], null),
      activo: ref.activo,
      nominal_usado_mm: round(nominalMm, 9),
      nominal_certificado_lower_mm: firstNumeric(selected.lower || {}, ["nominal_num", "nominal"], null),
      nominal_certificado_upper_mm: firstNumeric(selected.upper || {}, ["nominal_num", "nominal"], null),
      correction_certificate_mm: round(correctionRaw || 0, 9),
      correction_applied_mm: round(correctionApplied || 0, 9),
      correction_policy: options.apply_correction
        ? "APPLIED_FROM_CERTIFICATE"
        : "VISIBLE_NOT_APPLIED_BY_DEFAULT",
      u_expanded_mm: round(expandedU, 9),
      k,
      u_standard_mm: round(uStandard, 9),
      source: TMP_THREAD_TRACEABILITY_TABLES.patron_values_view,
      source_rule: ref.source_rule || null,
      selection_mode: selected.mode,
      raw_reference_row: ref
    }
  };
}

/* ===========================================================
   RESOLVERS DE COMPONENTES
   =========================================================== */

export function resolveBancoTrimosFromRows(rows = [], workflow = {}) {
  const nominalForCertificate = getTrimosTargetMeanMm(workflow) || getWorkflowNominalMm(workflow);

  const candidates = rows
    .filter(rowIsActiveAndValid)
    .filter(rowLooksLikeTrimos);

  if (!candidates.length) {
    return {
      ok: false,
      component: "BANCO_TRIMOS",
      error: "BANCO_TRIMOS_NOT_FOUND",
      instrument: null,
      certificate: null,
      candidates_count: 0
    };
  }

  const groups = groupRowsByPattern(candidates);
  const group = chooseBestGroup(
    groups,
    (r) => String(r.codigo || "").trim() === TMP_THREAD_TRACEABILITY_DEFAULTS.preferred_trimos_code
  );

  const cert = buildCertificateFromRows(group.rows, nominalForCertificate, {
    apply_correction: false
  });

  const ref = group.rows[0];

  return {
    ok: cert.ok,
    component: "BANCO_TRIMOS",
    instrument: {
      id: ref.patron_id || null,
      codigo: ref.codigo || null,
      descripcion: ref.descripcion || null,
      fabricante: ref.fabricante || null,
      modelo: ref.modelo || null,
      familia: ref.familia || null,
      tipo_patron: ref.tipo_patron || null,
      rango: `${ref.rango_desde ?? ""}-${ref.rango_hasta ?? ""} ${ref.unidad || ""}`.trim(),
      unidad: ref.unidad || "mm"
    },
    certificate: cert.certificate,
    candidates_count: candidates.length,
    rows_used: group.rows.length,
    error: cert.ok ? null : cert.error
  };
}

export function resolveRodillosFromRows(rows = [], workflow = {}) {
  const wireMm = getWireMm(workflow);

  const candidates = rows
    .filter(rowIsActiveAndValid)
    .filter((row) => rowLooksLikeWire(row, wireMm));

  if (!candidates.length) {
    return {
      ok: false,
      component: "RODILLOS",
      error: "RODILLOS_NOT_FOUND",
      target_wire_mm: wireMm,
      instrument: null,
      certificate: null,
      candidates_count: 0
    };
  }

  const groups = groupRowsByPattern(candidates);
  const group = chooseBestGroup(groups);
  const cert = buildCertificateFromRows(group.rows, wireMm, {
    apply_correction: true
  });

  const ref = group.rows[0];

  return {
    ok: cert.ok,
    component: "RODILLOS",
    target_wire_mm: wireMm,
    instrument: {
      id: ref.patron_id || null,
      codigo: ref.codigo || null,
      descripcion: ref.descripcion || null,
      fabricante: ref.fabricante || null,
      modelo: ref.modelo || null,
      familia: ref.familia || null,
      tipo_patron: ref.tipo_patron || null,
      unidad: ref.unidad || "mm"
    },
    certificate: cert.certificate,
    candidates_count: candidates.length,
    rows_used: group.rows.length,
    error: cert.ok ? null : cert.error
  };
}

export function resolvePatronRoscaFromRows(rows = [], workflow = {}) {
  const nominalMm = getWorkflowNominalMm(workflow);

  const candidates = rows
    .filter(rowIsActiveAndValid)
    .filter((row) => rowLooksLikeThreadPattern(row, workflow));

  if (!candidates.length) {
    return {
      ok: false,
      component: "PATRON_ROSCA",
      error: "PATRON_ROSCA_NOT_FOUND",
      instrument: null,
      certificate: null,
      candidates_count: 0
    };
  }

  const groups = groupRowsByPattern(candidates);
  const group = chooseBestGroup(groups);
  const cert = buildCertificateFromRows(group.rows, nominalMm, {
    apply_correction: true
  });

  const ref = group.rows[0];

  return {
    ok: cert.ok,
    component: "PATRON_ROSCA",
    instrument: {
      id: ref.patron_id || null,
      codigo: ref.codigo || null,
      descripcion: ref.descripcion || null,
      fabricante: ref.fabricante || null,
      modelo: ref.modelo || null,
      familia: ref.familia || null,
      tipo_patron: ref.tipo_patron || null,
      unidad: ref.unidad || "mm"
    },
    certificate: cert.certificate,
    candidates_count: candidates.length,
    rows_used: group.rows.length,
    error: cert.ok ? null : cert.error
  };
}

/* ===========================================================
   MODELO FINAL
   =========================================================== */

export function buildTraceabilityCorrections({ banco, rodillos, patron }) {
  const bancoC = parseNum(banco?.certificate?.correction_applied_mm, 0) || 0;
  const rodillosC = parseNum(rodillos?.certificate?.correction_applied_mm, 0) || 0;
  const patronC = parseNum(patron?.certificate?.correction_applied_mm, 0) || 0;

  const total = bancoC + rodillosC + patronC;

  return {
    banco_correction_mm: round(bancoC, 9),
    rodillos_correction_mm: round(rodillosC, 9),
    patron_correction_mm: round(patronC, 9),
    total_correction_mm: round(total, 9),
    policy:
      "Corrección total aplicada sólo con componentes certificados. Banco Trimos visible; por defecto no se aplica corrección interpolada del banco salvo regla específica."
  };
}

export function buildTraceabilityUncertaintyModel({ banco, rodillos, patron, workflow }) {
  const k =
    parseNum(banco?.certificate?.k, null) ||
    parseNum(rodillos?.certificate?.k, null) ||
    parseNum(patron?.certificate?.k, null) ||
    TMP_THREAD_TRACEABILITY_DEFAULTS.default_k;

  const uBanco =
    parseNum(banco?.certificate?.u_standard_mm, null) ||
    null;

  const uRodillos =
    parseNum(rodillos?.certificate?.u_standard_mm, null) ||
    null;

  const uPatron =
    parseNum(patron?.certificate?.u_standard_mm, null) ||
    null;

  const resolution =
    parseNum(banco?.certificate?.resolution_mm, null) ||
    parseNum(workflow?.trimos?.setup?.resolution_mm, null) ||
    TMP_THREAD_TRACEABILITY_DEFAULTS.default_resolution_mm;

  const warnings = [];

  if (!banco?.ok) warnings.push("Falta banco Trimos con certificado vigente.");
  if (!rodillos?.ok) warnings.push("Faltan rodillos con certificado vigente.");
  if (!patron?.ok) warnings.push("Falta patrón de rosca con certificado vigente.");
  if (!Number.isFinite(uBanco)) warnings.push("Falta incertidumbre estándar real del banco.");
  if (!Number.isFinite(uRodillos)) warnings.push("Falta incertidumbre estándar real de rodillos.");
  if (!Number.isFinite(uPatron)) warnings.push("Falta incertidumbre estándar real del patrón.");

  const complete =
    Boolean(banco?.ok) &&
    Boolean(rodillos?.ok) &&
    Boolean(patron?.ok) &&
    Number.isFinite(uBanco) &&
    Number.isFinite(uRodillos) &&
    Number.isFinite(uPatron);

  return {
    source: "TMP_THREAD_TRACEABILITY_RESOLVER_REAL_MODEL",
    status: complete ? "REAL_CERTIFIED_COMPLETE" : "REAL_TRACEABILITY_INCOMPLETE",
    k,
    banco: banco?.instrument?.codigo || null,
    banco_descripcion: banco?.instrument?.descripcion || null,
    rodillos: rodillos?.instrument?.codigo || null,
    rodillos_descripcion: rodillos?.instrument?.descripcion || null,
    patron: patron?.instrument?.codigo || null,
    patron_descripcion: patron?.instrument?.descripcion || null,
    wire_mm: getWireMm(workflow),
    u_trimos: round(uBanco, 9),
    u_wire: round(uRodillos, 9),
    u_pattern: round(uPatron, 9),
    resolution: round(resolution, 9),
    u_temperature: TMP_THREAD_TRACEABILITY_DEFAULTS.default_u_temperature_mm,
    corrections: buildTraceabilityCorrections({ banco, rodillos, patron }),
    certificates: {
      banco: banco?.certificate || null,
      rodillos: rodillos?.certificate || null,
      patron: patron?.certificate || null
    },
    can_emit_certificate: complete,
    warnings
  };
}

export function buildCertificatePermission({ banco, rodillos, patron, uncertainty_model }) {
  const missing = [];

  if (!banco?.ok) missing.push("BANCO_TRIMOS");
  if (!rodillos?.ok) missing.push("RODILLOS");
  if (!patron?.ok) missing.push("PATRON_ROSCA");
  if (!uncertainty_model?.can_emit_certificate) missing.push("INCERTIDUMBRE_REAL_COMPLETA");

  const ok = missing.length === 0;

  return {
    ok,
    can_save_technical: Boolean(banco?.ok),
    can_emit_certificate: ok,
    missing,
    message: ok
      ? "Trazabilidad completa. Certificado final permitido."
      : "Certificado final bloqueado hasta completar trazabilidad real."
  };
}

/* ===========================================================
   FUNCIÓN PRINCIPAL
   =========================================================== */

export async function resolveThreadTraceability(sb, context = {}) {
  const workflow = context.workflow || null;
  const equipment = context.equipment || null;

  const view = await fetchPatternValuesView(sb);
  const rows = view.ok ? view.data : [];

  const banco = resolveBancoTrimosFromRows(rows, workflow || {});
  const rodillos = resolveRodillosFromRows(rows, workflow || {});
  const patron = resolvePatronRoscaFromRows(rows, workflow || {});

  const corrections = buildTraceabilityCorrections({ banco, rodillos, patron });
  const uncertainty_model = buildTraceabilityUncertaintyModel({
    banco,
    rodillos,
    patron,
    workflow
  });

  const certificate_permission = buildCertificatePermission({
    banco,
    rodillos,
    patron,
    uncertainty_model
  });

  const ok =
    Boolean(view.ok) &&
    Boolean(banco.ok) &&
    Boolean(rodillos.ok) &&
    Boolean(patron.ok) &&
    Boolean(uncertainty_model.can_emit_certificate);

  const warnings = [
    ...(view.ok ? [] : [`No se pudo leer ${TMP_THREAD_TRACEABILITY_TABLES.patron_values_view}: ${view.error || ""}`]),
    ...(uncertainty_model.warnings || [])
  ];

  return {
    ok,
    source: "thread_traceability_resolver",
    version: TMP_THREAD_TRACEABILITY_RESOLVER_VERSION,
    traceability_status: ok ? "REAL_TRACEABILITY_COMPLETE" : "REAL_TRACEABILITY_INCOMPLETE",
    equipment,
    workflow_summary: {
      designation: getWorkflowDesignation(workflow || {}),
      nominal_mm: getWorkflowNominalMm(workflow || {}),
      pitch_mm: getWorkflowPitchMm(workflow || {}),
      class: getWorkflowClass(workflow || {}),
      wire_mm: getWireMm(workflow || {})
    },
    view: {
      ok: view.ok,
      source: view.source,
      rows: rows.length,
      error: view.error || null
    },
    banco,
    rodillos,
    patron,
    corrections,
    uncertainty_model,
    certificate_permission,
    can_save: certificate_permission.can_save_technical,
    can_emit_certificate: certificate_permission.can_emit_certificate,
    warnings
  };
}

export default {
  TMP_THREAD_TRACEABILITY_RESOLVER_VERSION,
  resolveThreadTraceability,
  resolveBancoTrimosFromRows,
  resolveRodillosFromRows,
  resolvePatronRoscaFromRows,
  buildTraceabilityCorrections,
  buildTraceabilityUncertaintyModel,
  buildCertificatePermission
};
