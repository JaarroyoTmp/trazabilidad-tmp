/* TMP THREAD CORE V33 - thread_traceability_engine.js */
import { classifyPatternRecord, TMP_THREAD_PATTERN_CLASSIFIER_VERSION } from "./thread_pattern_classifier.js";

export const TMP_THREAD_TRACEABILITY_ENGINE_VERSION = "TMP_THREAD_TRACEABILITY_ENGINE_V34_20260925_TRIMOS_PRIMARY";
export const DEFAULT_TRACEABILITY_VIEW = "v_patron_valores_activos";

export function normalizeText(v = "") {
  return String(v || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Ø/g, " ").replace(/⌀/g, " ").replace(/,/g, ".").replace(/\s+/g, " ").trim();
}
export function parseNum(v, fallback = null) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(String(v).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}
export function round(v, d = 9) {
  const n = parseNum(v, null);
  if (!Number.isFinite(n)) return null;
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}
export const rowText = (row = {}) => normalizeText(Object.values(row || {}).filter(v => v !== null && v !== undefined).join(" "));
export const certNumber = (row = {}) => row.numero_certificado || row.certificado || row.certificado_numero || row.certificate || row.certificate_number || "-";
export const rowCode = (row = {}) => row.codigo || row.codigo_equipo || row.codigo_patron || row.id || row.patron_id || "-";
export const rowDescription = (row = {}) => row.descripcion || row.descripcion_equipo || row.nombre || row.tipo_patron || row.tipo || rowText(row).slice(0, 90) || "-";
export const getExpiry = (row = {}) => row.fecha_vencimiento || row.proxima_calibracion || row.fecha_proxima_calibracion || row.caducidad || row.valid_until || row.fecha_caducidad || null;

export function isExpired(value) {
  if (!value) return true;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}
export function isActive(row = {}) {
  return row.activo === true || row.activo === "true" || row.activo === 1 || row.activo === "1" || row.activo === null || row.activo === undefined;
}
export function isValid(row = {}) {
  const e = normalizeText(row.estado || row.estado_certificado || row.status || "");
  const estadoOk = !e || e.includes("VIGENTE") || e.includes("OK") || e.includes("APTO") || e.includes("VALID");
  return isActive(row) && estadoOk && !isExpired(getExpiry(row));
}
export const getK = (row = {}) => parseNum(row.k, null) || parseNum(row.factor_k, null) || parseNum(row.factor_cobertura, null) || 2;

export function getCorrection(row = {}) {
  return round(parseNum(row.correccion_num, null) || parseNum(row.correccion, null) || parseNum(row.error_num, null) || parseNum(row.error, null) || parseNum(row.desviacion_num, null) || parseNum(row.desviacion, null) || 0, 9);
}
export function getExpandedU(row = {}, nominalForTrimos = null) {
  const code = String(rowCode(row)).trim();
  const cert = normalizeText(certNumber(row));
  const rule = normalizeText(row.source_rule || row.observaciones || "");
  if (Number.isFinite(parseNum(nominalForTrimos, null)) && (code === "1288" || cert.includes("C-11377.00002") || rule.includes("TRIMOS_1288"))) return round((1.1 + 0.031 * parseNum(nominalForTrimos)) / 1000, 9);
  return round(parseNum(row.incertidumbre_us_num, null) || parseNum(row.incertidumbre_us, null) || parseNum(row.incertidumbre_num, null) || parseNum(row.incertidumbre, null) || parseNum(row.u_expandida, null) || parseNum(row.u, null), 9);
}
export function getStandardU(row = {}, nominalForTrimos = null) {
  const U = getExpandedU(row, nominalForTrimos);
  const k = getK(row);
  if (!Number.isFinite(U) || !Number.isFinite(k) || k === 0) return null;
  return round(U / k, 9);
}
export function groupRows(rows = []) {
  const map = new Map();
  for (const row of rows) {
    const key = row.patron_id || row.codigo || row.codigo_equipo || row.codigo_patron || row.certificado_id || row.numero_certificado || `${rowCode(row)}|${certNumber(row)}|${rowDescription(row)}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return Array.from(map.entries()).map(([id, groupRows]) => {
    const first = groupRows[0] || {};
    return { id: String(id), codigo: rowCode(first), descripcion: rowDescription(first), certificado: certNumber(first), fecha_calibracion: first.fecha_calibracion || "", vencimiento: getExpiry(first), vigente: groupRows.some(isValid), rows: groupRows, row: first, text: rowText(first) };
  });
}

export function decoratePattern(group, parsedThread, targetWire, nominalForU = null) {
  if (!group) return null;
  const classification = classifyPatternRecord({ row: group.row, parsedThread, targetWireMm: targetWire });
  const row = group.row || {};
  const compatible = classification.family === "BANCO_TRIMOS" ? classification.compatible.bank :
    classification.family === "RODILLOS" ? classification.compatible.rollers :
    classification.family === "PATRON_ROSCA" ? classification.compatible.master : false;
  return {
    ...group,
    class: classification.family,
    classifier: classification,
    score: classification.confidence,
    compatible,
    matched_diameter_mm: classification.matched_wire_diameter_mm,
    diameter_error_mm: classification.wire_error_mm,
    correction_mm: getCorrection(row),
    u_expanded_mm: getExpandedU(row, nominalForU),
    u_standard_mm: getStandardU(row, nominalForU),
    k: getK(row)
  };
}

export function buildClassificationSummary(items = []) {
  const summary = { BANCO_TRIMOS: 0, RODILLOS: 0, PATRON_ROSCA: 0, OTRO: 0 };
  for (const item of items) summary[item.class || "OTRO"] = (summary[item.class || "OTRO"] || 0) + 1;
  return summary;
}

export async function resolveTraceability({ supabase, parsedThread, trimosPlan, view = DEFAULT_TRACEABILITY_VIEW } = {}) {
  if (!supabase || typeof supabase.from !== "function") {
    return { ok: false, ok_full_traceability: false, source: TMP_THREAD_TRACEABILITY_ENGINE_VERSION, classifier_version: TMP_THREAD_PATTERN_CLASSIFIER_VERSION, error: "SUPABASE_CLIENT_MISSING", rows: [], selected: {}, candidates: {}, classification_summary: {}, score: { total: 0, max: 200 }, warnings: ["Sin Supabase: no se puede validar trazabilidad real."] };
  }

  const { data, error } = await supabase.from(view).select("*").limit(3000);
  if (error) {
    return { ok: false, ok_full_traceability: false, source: TMP_THREAD_TRACEABILITY_ENGINE_VERSION, classifier_version: TMP_THREAD_PATTERN_CLASSIFIER_VERSION, error: error.message || String(error), rows: [], selected: {}, candidates: {}, classification_summary: {}, score: { total: 0, max: 200 }, warnings: [error.message || String(error)] };
  }

  const rows = Array.isArray(data) ? data : [];
  const targetWire = trimosPlan?.setup?.wire_mm;
  const nominalForTrimos = trimosPlan?.points?.[0]?.target_trimos_mm || parsedThread?.nominal_mm || null;

  const classified = groupRows(rows).map(g => decoratePattern(g, parsedThread, targetWire, nominalForTrimos));
  const classification_summary = buildClassificationSummary(classified);

  const banks = classified.filter(x => x.class === "BANCO_TRIMOS").sort((a, b) => b.score - a.score);
  const rollers = classified.filter(x => x.class === "RODILLOS").sort((a, b) => b.score - a.score);
  const masters = classified.filter(x => x.class === "PATRON_ROSCA").sort((a, b) => b.score - a.score);

  const selected_bank = banks.find(x => x.compatible && x.vigente) || banks[0] || null;
  const selected_rollers = rollers.find(x => x.compatible && x.vigente) || rollers[0] || null;
  const selected_master = masters.find(x => x.compatible && x.vigente) || masters[0] || null;

  const bankOk = Boolean(selected_bank && selected_bank.vigente && Number.isFinite(selected_bank.u_standard_mm));
  // Modelo TMP MT16: banco Trimos = patron trazable principal.
  // Rodillos/hilos = utiles de medicion; patron de rosca independiente = no requerido por este metodo.
  const rollersOk = Boolean(Number.isFinite(parseNum(targetWire, null)));
  const masterOk = true;

  const bankScore = bankOk ? 100 : selected_bank ? 55 : 0;
  const normativeScore = parsedThread?.ok && trimosPlan?.ok ? 100 : 0;
  const totalScore = bankScore + normativeScore;

  const warnings = [];
  if (!selected_bank) warnings.push("No se encontro banco Trimos.");
  if (selected_bank && !selected_bank.vigente) warnings.push("Banco Trimos encontrado pero no vigente.");
  if (selected_bank && !Number.isFinite(selected_bank.u_standard_mm)) warnings.push("Banco Trimos sin incertidumbre estandar resuelta.");
  if (!rollersOk) warnings.push("Rodillo/hilo no determinado por el motor para este paso. Revisar tabla TMP o designacion de rosca.");

  return {
    ok: bankOk && rollersOk,
    ok_full_traceability: bankOk && rollersOk,
    source: TMP_THREAD_TRACEABILITY_ENGINE_VERSION,
    classifier_version: TMP_THREAD_PATTERN_CLASSIFIER_VERSION,
    view,
    total_rows: rows.length,
    grouped_count: classified.length,
    classification_summary,
    target: { thread: parsedThread?.normalized, nominal_mm: parsedThread?.nominal_mm, pitch_mm: parsedThread?.pitch_mm, class: parsedThread?.tolerance_class, wire_mm: targetWire },
    selected: { bank: selected_bank, rollers: selected_rollers, master: selected_master },
    selected_bank,
    selected_rollers,
    selected_master,
    candidates: { banks: banks.slice(0, 10), rollers: rollers.slice(0, 10), masters: masters.slice(0, 10) },
    classifier_examples: classified.slice(0, 12).map(x => ({ codigo: x.codigo, descripcion: x.descripcion, class: x.class, score: x.score, evidences: x.classifier?.evidences?.slice(0, 4) || [] })),
    corrections_mm: { bank: selected_bank?.correction_mm || 0, rollers: 0, master: 0, total: round((selected_bank?.correction_mm || 0), 9) },
    roles: { bank:"PATRON_TRAZABLE", rollers:"UTIL_MEDICION", master:"NO_REQUERIDO" },
    score: { bank: bankScore, rollers: rollersOk ? 100 : 0, master: 100, normative: normativeScore, total: totalScore, max: 200, percent: round((totalScore / 200) * 100, 1) },
    warnings
  };
}

export default { TMP_THREAD_TRACEABILITY_ENGINE_VERSION, resolveTraceability };
