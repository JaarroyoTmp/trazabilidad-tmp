/* Revisión local 2026-11-03: estados explícitos y coherencia con certificado 1288. No desplegado. */
/* TMP THREAD CORE V33 - thread_traceability_engine.js */
import { classifyPatternRecord, TMP_THREAD_PATTERN_CLASSIFIER_VERSION } from "./thread_pattern_classifier.js";

export const TMP_THREAD_TRACEABILITY_ENGINE_VERSION = "TMP_THREAD_TRACEABILITY_ENGINE_V33_20260630_USES_SMART_CLASSIFIER";
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
  const estadoOk = ["VIGENTE", "OK", "APTO", "VALIDO", "VALID", "VALIDATED", "ACTIVO", "ACTIVE"].includes(e);
  return isActive(row) && estadoOk && !isExpired(getExpiry(row));
}
function firstDeclared(row, keys) {
  for (const key of keys) if (row[key] !== null && row[key] !== undefined && row[key] !== "") return parseNum(row[key], null);
  return null;
}
function usesTrimosGlobalEnvelope(row) {
  return normalizeText(certNumber(row)) === "C-11377.00002";
}
function inTrimosCertifiedRange(nominal) {
  const value = parseNum(nominal, null);
  return Number.isFinite(value) && value >= 0 && value <= 300;
}
export function getK(row = {}) {
  const k = firstDeclared(row, ["k", "factor_k", "factor_cobertura"]);
  return Number.isFinite(k) && k > 0 ? k : null;
}
export function getCorrection(row = {}, nominalForTrimos = null) {
  // C-11377.00002, p.4: la envolvente global Us se declara con corrección global nula.
  if (usesTrimosGlobalEnvelope(row)) return inTrimosCertifiedRange(nominalForTrimos) ? 0 : null;
  return round(firstDeclared(row, ["correccion_num", "correccion"]), 9);
}
export function getExpandedU(row = {}, nominalForTrimos = null) {
  if (usesTrimosGlobalEnvelope(row)) {
    if (!inTrimosCertifiedRange(nominalForTrimos)) return null;
    return round((1.1 + 0.031 * parseNum(nominalForTrimos)) / 1000, 9);
  }
  const value = firstDeclared(row, ["incertidumbre_us_num", "incertidumbre_us", "incertidumbre_num", "incertidumbre", "u_expandida", "u"]);
  return Number.isFinite(value) && value > 0 ? round(value, 9) : null;
}
export function getStandardU(row = {}, nominalForTrimos = null) {
  const U = getExpandedU(row, nominalForTrimos);
  const k = getK(row);
  if (!Number.isFinite(U) || !Number.isFinite(k) || k <= 0) return null;
  return round(U / k, 9);
}

export function groupRows(rows = []) {
  const map = new Map();
  for (const row of rows) {
    const key = row.patron_id || row.codigo || row.codigo_equipo || row.codigo_patron || row.certificado_id || row.numero_certificado || `${rowCode(row)}|${certNumber(row)}|${rowDescription(row)}`;
    const certificateKey = `${key}|${row.certificado_id || certNumber(row)}`;
    if (!map.has(certificateKey)) map.set(certificateKey, []);
    map.get(certificateKey).push(row);
  }
  return Array.from(map.entries()).map(([id, groupRows]) => {
    const first = groupRows[0] || {};
    return { id: String(first.patron_id || id), codigo: rowCode(first), descripcion: rowDescription(first), certificado: certNumber(first), fecha_calibracion: first.fecha_calibracion || "", vencimiento: getExpiry(first), vigente: groupRows.every(isValid), rows: groupRows, row: first, text: rowText(first) };
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
    correction_mm: getCorrection(row, nominalForU),
    correction_model: usesTrimosGlobalEnvelope(row) ? "C1137700002_GLOBAL_US_ZERO_CORRECTION" : "CERTIFICATE_EXPLICIT_CORRECTION",
    uncertainty_reference_mm: nominalForU,
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
    return { ok: false, ok_full_traceability: false, source: TMP_THREAD_TRACEABILITY_ENGINE_VERSION, classifier_version: TMP_THREAD_PATTERN_CLASSIFIER_VERSION, error: "SUPABASE_CLIENT_MISSING", rows: [], selected: {}, candidates: {}, classification_summary: {}, score: { total: 0, max: 400 }, warnings: ["Sin Supabase: no se puede validar trazabilidad real."] };
  }

  const { data, error } = await supabase.from(view).select("*").limit(3000);
  if (error) {
    return { ok: false, ok_full_traceability: false, source: TMP_THREAD_TRACEABILITY_ENGINE_VERSION, classifier_version: TMP_THREAD_PATTERN_CLASSIFIER_VERSION, error: error.message || String(error), rows: [], selected: {}, candidates: {}, classification_summary: {}, score: { total: 0, max: 400 }, warnings: [error.message || String(error)] };
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

  const bankOk = Boolean(selected_bank && selected_bank.vigente && selected_bank.compatible && selected_bank.certificado !== "-" && Number.isFinite(selected_bank.u_standard_mm) && selected_bank.u_standard_mm > 0);
  const rollersOk = Boolean(selected_rollers && selected_rollers.vigente && selected_rollers.compatible);
  const masterOk = Boolean(selected_master && selected_master.vigente && selected_master.compatible);

  const bankScore = bankOk ? 100 : selected_bank ? 55 : 0;
  const rollersScore = rollersOk ? 100 : selected_rollers ? 45 : 0;
  const masterScore = masterOk ? 100 : selected_master ? 45 : 0;
  const normativeScore = parsedThread?.ok && trimosPlan?.ok ? 100 : 0;
  const totalScore = bankScore + rollersScore + masterScore + normativeScore;

  const warnings = [];
  if (!selected_bank) warnings.push("No se encontro banco Trimos.");
  if (selected_bank && !selected_bank.vigente) warnings.push("Banco Trimos encontrado pero no vigente.");
  if (selected_bank && !Number.isFinite(selected_bank.u_standard_mm)) warnings.push("Banco Trimos sin incertidumbre estandar resuelta.");
  if (!selected_rollers) warnings.push("No se encontro registro clasificado como rodillos/hilos en Supabase.");
  if (selected_rollers && !selected_rollers.compatible) warnings.push(`Rodillos encontrados, pero compatibilidad insuficiente con Ø${targetWire} mm.`);
  if (!selected_master) warnings.push("No se encontro registro clasificado como patron/anillo/tampon de rosca en Supabase.");
  if (selected_master && !selected_master.compatible) warnings.push("Patron de rosca encontrado, pero compatibilidad insuficiente por nominal/paso/clase.");
  if (!rollersOk) warnings.push("Calculo tecnico permitido con rodillo normativo; certificado completo bloqueado hasta rodillos certificados.");
  if (!masterOk) warnings.push("Calculo tecnico permitido con ISO965/ISO1502; certificado completo bloqueado hasta patron rosca certificado.");

  return {
    ok: bankOk,
    ok_full_traceability: bankOk && rollersOk && masterOk,
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
    corrections_mm: { bank: selected_bank?.correction_mm || 0, rollers: selected_rollers?.correction_mm || 0, master: selected_master?.correction_mm || 0, total: round((selected_bank?.correction_mm || 0) + (selected_rollers?.correction_mm || 0) + (selected_master?.correction_mm || 0), 9) },
    score: { bank: bankScore, rollers: rollersScore, master: masterScore, normative: normativeScore, total: totalScore, max: 400, percent: round((totalScore / 400) * 100, 1) },
    warnings
  };
}

export default { TMP_THREAD_TRACEABILITY_ENGINE_VERSION, resolveTraceability };
