/* TMP THREAD CORE V30 - thread_pattern_engine.js */
export const TMP_THREAD_PATTERN_ENGINE_VERSION = "TMP_THREAD_PATTERN_ENGINE_V30_20260630";
export const DEFAULT_PATTERN_VIEW = "v_patron_valores_activos";

export function normalizeText(v = "") { return String(v || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/,/g, ".").replace(/\s+/g, " ").trim(); }
export function parseNum(v, fb = null) { if (typeof v === "number" && Number.isFinite(v)) return v; if (v === null || v === undefined || v === "") return fb; const n = Number(String(v).replace(",", ".").trim()); return Number.isFinite(n) ? n : fb; }
export const rowText = (r = {}) => normalizeText(Object.values(r || {}).filter(Boolean).join(" "));
export const rowCode = (r = {}) => r.codigo || r.codigo_equipo || r.codigo_patron || r.id || "-";
export const rowDescription = (r = {}) => r.descripcion || r.descripcion_equipo || r.nombre || r.tipo_patron || "-";
export const certNumber = (r = {}) => r.numero_certificado || r.certificado || r.certificado_numero || "-";
export const getExpiry = (r = {}) => r.fecha_vencimiento || r.proxima_calibracion || r.fecha_proxima_calibracion || r.caducidad || r.valid_until || null;
export function isExpired(value) { if (!value) return true; const d = new Date(value); if (Number.isNaN(d.getTime())) return true; const today = new Date(); today.setHours(0,0,0,0); d.setHours(0,0,0,0); return d < today; }
export function isActive(r = {}) { return r.activo === true || r.activo === "true" || r.activo === 1 || r.activo === "1" || r.activo === null || r.activo === undefined; }
export function isValid(r = {}) { const e = normalizeText(r.estado || ""); const estadoOk = !e || e.includes("VIGENTE") || e.includes("OK") || e.includes("APTO") || e.includes("VALID"); return isActive(r) && estadoOk && !isExpired(getExpiry(r)); }
export function round(v, d = 9) { const n = parseNum(v, null); if (!Number.isFinite(n)) return null; const f = Math.pow(10, d); return Math.round(n * f) / f; }
export function getK(r = {}) { return parseNum(r.k, null) || parseNum(r.factor_k, null) || parseNum(r.factor_cobertura, null) || 2; }
export function getExpandedU(r = {}, nominalForTrimos = null) {
  const code = String(r.codigo || r.codigo_equipo || r.codigo_patron || "").trim();
  const cert = normalizeText(certNumber(r));
  const rule = normalizeText(r.source_rule || r.observaciones || "");
  if (Number.isFinite(parseNum(nominalForTrimos, null)) && (code === "1288" || cert.includes("C-11377.00002") || rule.includes("TRIMOS_1288"))) return round((1.1 + 0.031 * parseNum(nominalForTrimos)) / 1000, 9);
  return round(parseNum(r.incertidumbre_us_num, null) || parseNum(r.incertidumbre_us, null) || parseNum(r.incertidumbre_num, null) || parseNum(r.incertidumbre, null) || parseNum(r.u_expandida, null) || parseNum(r.u, null), 9);
}
export function getStandardU(r = {}, nominalForTrimos = null) { const U = getExpandedU(r, nominalForTrimos); const k = getK(r); if (!Number.isFinite(U) || !Number.isFinite(k) || k === 0) return null; return round(U / k, 9); }
export function getCorrection(r = {}) { return round(parseNum(r.correccion_num, null) || parseNum(r.correccion, null) || parseNum(r.error_num, null) || parseNum(r.error, null) || parseNum(r.desviacion_num, null) || parseNum(r.desviacion, null) || 0, 9); }

export function groupRows(rows = []) {
  const map = new Map();
  for (const r of rows) {
    const key = r.patron_id || r.codigo || r.codigo_equipo || r.codigo_patron || r.certificado_id || r.numero_certificado || JSON.stringify(r).slice(0, 50);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  }
  return Array.from(map.entries()).map(([id, groupRows]) => {
    const first = groupRows[0] || {};
    return { id:String(id), codigo:rowCode(first), descripcion:rowDescription(first), certificado:certNumber(first), fecha_calibracion:first.fecha_calibracion || "", vencimiento:getExpiry(first), vigente:groupRows.some(isValid), rows:groupRows, row:first };
  });
}

export function filterTrimosBanks(rows = []) {
  return groupRows(rows).filter(g => { const t = rowText(g.row); return String(g.codigo).trim() === "1288" || t.includes("TRIMOS") || t.includes("BANCO") || t.includes("TELMA"); })
    .sort((a,b) => ((String(b.codigo).trim()==="1288"?1000:0)+(b.vigente?100:0))-((String(a.codigo).trim()==="1288"?1000:0)+(a.vigente?100:0)));
}
export function filterRollers(rows = [], wireMm = null) {
  const target = parseNum(wireMm, null);
  return groupRows(rows).filter(g => {
    const t = rowText(g.row);
    const nominal = parseNum(g.row.nominal_num, null) || parseNum(g.row.nominal, null) || parseNum(g.row.diametro, null) || parseNum(g.row.diametro_mm, null);
    const textHit = t.includes("RODIL") || t.includes("HILO") || t.includes("WIRE") || t.includes("TRES HILOS") || t.includes("JUEGO DE HILOS");
    const dimHit = Number.isFinite(target) && Number.isFinite(nominal) && Math.abs(nominal - target) <= 0.05;
    return textHit || dimHit;
  }).sort((a,b) => {
    const an = parseNum(a.row.nominal_num, null) || parseNum(a.row.nominal, null) || 999;
    const bn = parseNum(b.row.nominal_num, null) || parseNum(b.row.nominal, null) || 999;
    return Math.abs(an - target) - Math.abs(bn - target);
  });
}
export function filterThreadMasters(rows = [], parsed = {}) {
  const nom = parsed.nominal_mm;
  const pitch = parsed.pitch_mm;
  const cls = normalizeText(parsed.tolerance_class || "");
  return groupRows(rows).filter(g => {
    const t = rowText(g.row);
    const textHit = t.includes("ROSCA") || t.includes("ROSCADO") || t.includes("ANILLO") || t.includes("TAMPON") || t.includes("MASTER");
    const nomHit = t.includes(`M${nom}`) || t.includes(`M ${nom}`) || t.includes(String(nom));
    const pitchHit = t.includes(String(pitch));
    const clsHit = !cls || t.includes(cls);
    return textHit && (nomHit || pitchHit || clsHit);
  }).sort((a,b) => (b.vigente?100:0)-(a.vigente?100:0));
}

export function normalizePattern(group, nominalForU = null) {
  if (!group) return null;
  const r = group.row || {};
  return { ...group, correction_mm:getCorrection(r), u_expanded_mm:getExpandedU(r, nominalForU), u_standard_mm:getStandardU(r, nominalForU), k:getK(r) };
}

export async function resolveThreadPatterns({ supabase, parsedThread, trimosPlan, view = DEFAULT_PATTERN_VIEW } = {}) {
  if (!supabase || typeof supabase.from !== "function") return { ok:false, source:TMP_THREAD_PATTERN_ENGINE_VERSION, error:"SUPABASE_CLIENT_MISSING", rows:[], banks:[], rollers:[], masters:[], selected_bank:null, selected_rollers:null, selected_master:null, warnings:["Sin Supabase: no se puede validar trazabilidad real."] };
  const { data, error } = await supabase.from(view).select("*").limit(2000);
  if (error) return { ok:false, source:TMP_THREAD_PATTERN_ENGINE_VERSION, error:error.message || String(error), rows:[], banks:[], rollers:[], masters:[], selected_bank:null, selected_rollers:null, selected_master:null, warnings:[error.message || String(error)] };

  const rows = Array.isArray(data) ? data : [];
  const banks = filterTrimosBanks(rows);
  const rollers = filterRollers(rows, trimosPlan?.setup?.wire_mm);
  const masters = filterThreadMasters(rows, parsedThread);
  const nominalForTrimos = trimosPlan?.points?.[0]?.target_trimos_mm || null;

  const selected_bank = normalizePattern(banks[0] || null, nominalForTrimos);
  const selected_rollers = normalizePattern(rollers[0] || null, trimosPlan?.setup?.wire_mm);
  const selected_master = normalizePattern(masters[0] || null, parsedThread?.nominal_mm);

  const warnings = [];
  if (!selected_bank) warnings.push("No se encontro banco Trimos en Supabase.");
  if (selected_bank && !selected_bank.vigente) warnings.push("El banco seleccionado no esta vigente.");
  if (selected_bank && !Number.isFinite(selected_bank.u_standard_mm)) warnings.push("No se pudo resolver incertidumbre del banco.");
  if (!selected_rollers) warnings.push("No se encontro juego de rodillos certificado. Se usa rodillo normativo para calculo y se bloquea certificado final completo.");
  if (!selected_master) warnings.push("No se encontro patron de rosca certificado. Se usa ISO965/ISO1502 para calculo y se bloquea certificado final completo.");

  const ok_for_technical = Boolean(selected_bank && selected_bank.vigente && Number.isFinite(selected_bank.u_standard_mm));
  const ok_full_traceability = Boolean(ok_for_technical && selected_rollers?.vigente && selected_master?.vigente);

  return {
    ok: ok_for_technical,
    ok_full_traceability,
    source: TMP_THREAD_PATTERN_ENGINE_VERSION,
    mode: "REAL_TRIMOS_PLUS_OPTIONAL_ROLLERS_AND_MASTER",
    view,
    total_rows: rows.length,
    rows,
    banks,
    rollers,
    masters,
    selected_bank,
    selected_rollers,
    selected_master,
    normative_note: "Si no hay rodillos o patron en Supabase, el calculo tecnico continua por norma pero el certificado queda marcado con trazabilidad incompleta.",
    corrections_mm: {
      bank: selected_bank?.correction_mm || 0,
      rollers: selected_rollers?.correction_mm || 0,
      master: selected_master?.correction_mm || 0,
      total: (selected_bank?.correction_mm || 0) + (selected_rollers?.correction_mm || 0) + (selected_master?.correction_mm || 0)
    },
    warnings
  };
}
export default { TMP_THREAD_PATTERN_ENGINE_VERSION, resolveThreadPatterns, filterTrimosBanks, filterRollers, filterThreadMasters };
