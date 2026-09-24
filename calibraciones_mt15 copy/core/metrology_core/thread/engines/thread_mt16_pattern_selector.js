/* TMP MT16 PATTERN SELECTOR V23 - NORMATIVO SIN RODILLOS SUPABASE */
export const TMP_MT16_PATTERN_SELECTOR_VERSION = "TMP_MT16_PATTERN_SELECTOR_V23_20260629_NORMATIVO_SIN_RODILLOS_SUPABASE";
export const MT16_PATTERN_VIEW = "v_patron_valores_activos";

export function normalizeText(v = "") {
  return String(v || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/,/g, ".").replace(/\s+/g, " ").trim();
}
export function parseNum(v, fb = null) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v === null || v === undefined || v === "") return fb;
  const n = Number(String(v).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fb;
}
export function round(v, d = 9) {
  const n = parseNum(v, null);
  if (!Number.isFinite(n)) return null;
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}
export function rowText(r = {}) {
  return normalizeText(Object.values(r || {}).filter(Boolean).join(" "));
}
export function getExpiry(r = {}) {
  return r.fecha_vencimiento || r.proxima_calibracion || r.fecha_proxima_calibracion || r.caducidad || r.valid_until || null;
}
export function isExpired(value) {
  if (!value) return true;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return true;
  const today = new Date();
  today.setHours(0,0,0,0);
  d.setHours(0,0,0,0);
  return d < today;
}
export function isActive(r = {}) {
  return r.activo === true || r.activo === "true" || r.activo === 1 || r.activo === "1" || r.activo === null || r.activo === undefined;
}
export function isValidForUse(r = {}) {
  const e = normalizeText(r.estado || "");
  const estadoOk = !e || e.includes("VIGENTE") || e.includes("OK") || e.includes("APTO") || e.includes("VALID");
  return isActive(r) && estadoOk && !isExpired(getExpiry(r));
}
export const certNumber = (r = {}) => r.numero_certificado || r.certificado || r.certificado_numero || "-";
export const rowCode = (r = {}) => r.codigo || r.codigo_equipo || r.codigo_patron || r.id || "-";
export const rowDescription = (r = {}) => r.descripcion || r.descripcion_equipo || r.nombre || r.tipo_patron || "-";
export const getK = (r = {}) => parseNum(r.k, null) || parseNum(r.factor_k, null) || parseNum(r.factor_cobertura, null) || 2;
export function getExpandedU(r = {}, nominalForTrimos = null) {
  const code = String(r.codigo || r.codigo_equipo || r.codigo_patron || "").trim();
  const cert = normalizeText(certNumber(r));
  const rule = normalizeText(r.source_rule || r.observaciones || "");
  if (Number.isFinite(parseNum(nominalForTrimos, null)) && (code === "1288" || cert.includes("C-11377.00002") || rule.includes("TRIMOS_1288"))) {
    return round((1.1 + 0.031 * parseNum(nominalForTrimos)) / 1000, 9);
  }
  return round(
    parseNum(r.incertidumbre_us_num, null) ||
    parseNum(r.incertidumbre_us, null) ||
    parseNum(r.incertidumbre_num, null) ||
    parseNum(r.incertidumbre, null) ||
    parseNum(r.u_expandida, null) ||
    parseNum(r.u, null), 9
  );
}
export function getStandardU(r = {}, nominalForTrimos = null) {
  const U = getExpandedU(r, nominalForTrimos);
  const k = getK(r);
  if (!Number.isFinite(U) || !Number.isFinite(k) || k === 0) return null;
  return round(U / k, 9);
}
export function getCorrection(r = {}) {
  return round(
    parseNum(r.correccion_num, null) ||
    parseNum(r.correccion, null) ||
    parseNum(r.error_num, null) ||
    parseNum(r.error, null) ||
    parseNum(r.desviacion_num, null) ||
    parseNum(r.desviacion, null) || 0, 9
  );
}
export async function fetchPatternRows(sb, table = MT16_PATTERN_VIEW) {
  if (!sb) return { ok:false, error:"SUPABASE_CLIENT_MISSING", rows:[] };
  try {
    const { data, error } = await sb.from(table).select("*").limit(2000);
    if (error) return { ok:false, error:error.message || String(error), rows:[] };
    return { ok:true, rows:Array.isArray(data) ? data : [] };
  } catch (e) {
    return { ok:false, error:e.message || String(e), rows:[] };
  }
}
export function groupRowsByCode(rows = []) {
  const map = new Map();
  for (const r of rows) {
    const key = r.patron_id || r.codigo || r.codigo_equipo || r.codigo_patron || r.certificado_id || r.numero_certificado || JSON.stringify(r).slice(0,40);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  }
  return Array.from(map.entries()).map(([key, groupRows]) => {
    const first = groupRows[0] || {};
    return {
      id:String(key),
      codigo:rowCode(first),
      descripcion:rowDescription(first),
      certificado:certNumber(first),
      fecha_calibracion:first.fecha_calibracion || "",
      vencimiento:getExpiry(first),
      vigente:groupRows.some(isValidForUse),
      rows:groupRows,
      row:first
    };
  });
}
export function filterTrimosCandidates(rows = []) {
  return groupRowsByCode(rows).filter(g => {
    const t = rowText(g.row);
    return String(g.codigo).trim() === "1288" || t.includes("TRIMOS") || t.includes("BANCO") || t.includes("TELMA");
  }).sort((a,b) => ((String(b.codigo).trim()==="1288"?1000:0)+(b.vigente?100:0))-((String(a.codigo).trim()==="1288"?1000:0)+(a.vigente?100:0)));
}
export function buildNormativeTraceability({ workflow, banco }) {
  const setup = workflow?.trimos?.setup || {};
  const parsed = workflow?.parsed || {};
  const points = workflow?.trimos?.points || [];
  const nominalForTrimos = parseNum(points?.[0]?.target_trimos_mm, null) || parseNum(parsed.nominal_mm, null) || 0;
  const bancoRow = banco?.row || {};
  const bancoOk = Boolean(banco && banco.vigente);
  const uBanco = getStandardU(bancoRow, nominalForTrimos);
  const UBanco = getExpandedU(bancoRow, nominalForTrimos);
  const cBanco = bancoOk ? getCorrection(bancoRow) : 0;
  const warnings = [];
  if (!bancoOk) warnings.push("Falta banco Trimos vigente/certificado en Supabase.");
  if (!Number.isFinite(uBanco)) warnings.push("Falta incertidumbre del banco Trimos.");
  warnings.push("Rodillo/hilo calculado por norma MT16, no buscado en Supabase.");
  warnings.push("D2/D1/limites calculados por ISO965/ISO1502.");
  const complete = Boolean(workflow?.ok && workflow?.trimos?.ok && bancoOk && Number.isFinite(uBanco));
  return {
    ok: complete,
    status: complete ? "MT16_NORMATIVE_TRACEABILITY_COMPLETE" : "MT16_NORMATIVE_TRACEABILITY_INCOMPLETE",
    mode: "REAL_TRIMOS_PLUS_NORMATIVE_THREAD_DATA",
    banco: banco ? {
      id:banco.id, codigo:banco.codigo, descripcion:banco.descripcion, certificado:banco.certificado,
      fecha_calibracion:banco.fecha_calibracion, vencimiento:banco.vencimiento, vigente:banco.vigente,
      correccion_mm:cBanco, u_expandida_mm:UBanco, k:getK(bancoRow), u_standard_mm:uBanco, raw:bancoRow
    } : null,
    normative: {
      designation: parsed.normalized || workflow?.input?.rango || null,
      nominal_mm: parseNum(parsed.nominal_mm, null),
      pitch_mm: parseNum(parsed.pitch_mm, null),
      thread_class: parsed.tolerance_class || null,
      angle_deg: parseNum(parsed.angle_deg, 60),
      wire_mm: parseNum(setup.wire_mm, null),
      trimos_theoretical_correction_mm: parseNum(setup.correction_mm, null),
      points
    },
    corrections: {
      banco_correction_mm: round(cBanco, 9),
      normative_trimos_correction_mm: round(parseNum(setup.correction_mm, 0), 9),
      total_correction_mm: round(cBanco, 9)
    },
    uncertainty_model: {
      source: TMP_MT16_PATTERN_SELECTOR_VERSION,
      status: complete ? "REAL_TRIMOS_PLUS_NORMATIVE_THREAD_DATA" : "INCOMPLETE_REAL_TRIMOS",
      k: 2,
      banco: banco?.codigo || null,
      wire_mode: "NORMATIVE_CALCULATED_NOT_SUPABASE_PATTERN",
      pattern_mode: "ISO965_ISO1502_LIMITS_NOT_PHYSICAL_PATTERN",
      wire_mm: parseNum(setup.wire_mm, null),
      u_trimos: round(uBanco, 9),
      u_wire: 0.0003,
      u_pattern: 0,
      resolution: 0.001,
      u_temperature: 0,
      can_emit_certificate: complete,
      warnings
    },
    can_emit_certificate: complete,
    warnings
  };
}
