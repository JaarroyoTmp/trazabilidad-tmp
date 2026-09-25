/* TMP THREAD CORE V73 - mt16_master_engine.js */
import { parseThreadDesignation, TMP_THREAD_PARSER_VERSION, parseNum, BSP_THREAD_TABLE } from "./thread_parser.js";
import { calculateIso724Geometry, TMP_ISO724_GEOMETRY_ENGINE_VERSION } from "./iso724_geometry_engine.js";
import { resolveIso965Limits, TMP_ISO965_ENGINE_VERSION } from "./iso965_engine.js";
import { resolveIso1502Limits, TMP_ISO1502_ENGINE_VERSION } from "./iso1502_engine.js";
import { buildTrimosThreadSetup, calculateBestWire, TMP_TRIMOS_THREAD_ENGINE_VERSION } from "./trimos_engine.js";
import { calculateThreadUncertainty, TMP_THREAD_UNCERTAINTY_CORE_VERSION } from "./thread_uncertainty_engine_core.js";
import { decideThreadCalibration, TMP_THREAD_DECISION_CORE_VERSION } from "./thread_decision_engine_core.js";
import { resolveTraceability, TMP_THREAD_TRACEABILITY_ENGINE_VERSION } from "./thread_traceability_engine.js";
import { TMP_THREAD_PATTERN_CLASSIFIER_VERSION } from "./thread_pattern_classifier.js";
import { getThreadProcedure, TMP_MT16_PROCEDURE_ROUTER_VERSION } from "../procedure_rules/index.js";

export const TMP_MT16_MASTER_ENGINE_VERSION = "TMP_MT16_EXPERT_CORE_V73_20260702_PROCEDURE_MODEL";

export function round(v, d = 9) {
  const n = parseNum(v, null);
  if (!Number.isFinite(n)) return null;
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}
export function mean(values = []) {
  const nums = values.map(v => parseNum(v, null)).filter(Number.isFinite);
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
export function evaluateReadings({ trimos, traceability = null, readingsByPoint = {} } = {}) {
  if (!trimos?.plan?.ok && !trimos?.ok) {
    return { ok: false, source: TMP_MT16_MASTER_ENGINE_VERSION, error: "TRIMOS_PLAN_NOT_READY", results: [] };
  }
  const plan = trimos.plan || trimos;
  const normativeCorrection = plan.setup?.correction_mm || 0;
  const certCorrection = traceability?.corrections_mm?.total || 0;
  const correction = normativeCorrection + certCorrection;
  const results = (plan.points || []).map(point => {
    const readings = (readingsByPoint[point.id] || readingsByPoint[point.lado] || [])
      .map(v => parseNum(v, null)).filter(Number.isFinite);
    const mediaTrimos = mean(readings);
    const mediaD2 = Number.isFinite(mediaTrimos) ? mediaTrimos - correction : null;
    const min = point.limits_d2_mm?.min;
    const max = point.limits_d2_mm?.max;
    const apto = Number.isFinite(mediaD2) && mediaD2 >= min && mediaD2 <= max;
    return { ok: readings.length === point.repetitions, point_id: point.id, lado: point.lado, readings_trimos_mm: readings, media_trimos_mm: round(mediaTrimos, 9), media_d2_mm: round(mediaD2, 9), correction_normative_mm: round(normativeCorrection, 9), correction_certificates_mm: round(certCorrection, 9), correction_total_mm: round(correction, 9), target_trimos_mm: point.target_trimos_mm, limits_d2_mm: point.limits_d2_mm, decision_preliminar: apto ? "APTO" : "NO_APTO", motivo: apto ? "Diametro medio dentro de limites." : "Diametro medio fuera de limites o lecturas incompletas." };
  });
  const complete = results.every(r => r.ok);
  const global = results.some(r => r.decision_preliminar === "NO_APTO") ? "NOK" : "APTO";
  return { ok: complete, source: TMP_MT16_MASTER_ENGINE_VERSION, global_decision_preliminar: global, results };
}


function roundMT16(value, decimals = 9) {
  const n = parseNum(value, null);
  if (!Number.isFinite(n)) return null;
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}


const INCH_MM = 25.4;
const UNIFIED_INTERNAL_2B_LIMITS_IN = {
  // Tabla técnica provisional para motor operativo UN. Validar/sustituir por tabla oficial ASME B1.1/B1.2 cuando esté disponible.
  "UNC|1/4|20|2B":  { d2_min_in:0.2175, d2_max_in:0.2268 },
  "UNC|5/16|18|2B": { d2_min_in:0.2764, d2_max_in:0.2854 },
  "UNC|3/8|16|2B":  { d2_min_in:0.3344, d2_max_in:0.3440 },
  "UNC|7/16|14|2B": { d2_min_in:0.3911, d2_max_in:0.4015 },
  "UNC|1/2|13|2B":  { d2_min_in:0.4500, d2_max_in:0.4613 },
  "UNF|1/4|28|2B":  { d2_min_in:0.2268, d2_max_in:0.2335 },
  "UNF|5/16|24|2B": { d2_min_in:0.2854, d2_max_in:0.2924 },
  "UNF|3/8|24|2B":  { d2_min_in:0.3479, d2_max_in:0.3549 },
  "UNF|7/16|20|2B": { d2_min_in:0.4050, d2_max_in:0.4131 },
  "UNF|1/2|20|2B":  { d2_min_in:0.4675, d2_max_in:0.4757 },
};
function normalizeUnifiedSizeLabel(label=''){
  return String(label||'').replace(/^(UNC|UNF|UNEF|UN|UNJ)\s*/i,'').trim().replace(/\s+/g,' ');
}
function resolveUnifiedThreadLimits(parsed, geometry){
  if (!parsed?.ok || parsed.thread_system !== 'UN_ASME_B1_1') return { ok:false, source:'TMP_UNIFIED_ENGINE_V71', error:'NOT_UNIFIED_THREAD' };
  const series = String(parsed.family || '').replace('_THREAD','').toUpperCase();
  const size = normalizeUnifiedSizeLabel(parsed.nominal_label);
  const tpi = parseNum(parsed.tpi, null);
  const cls = String(parsed.tolerance_class || '2B').toUpperCase();
  const key = `${series}|${size}|${tpi}|${cls}`;
  const row = UNIFIED_INTERNAL_2B_LIMITS_IN[key] || null;
  const basicD2 = geometry?.internal_thread_basic_mm?.pitch_diameter_D2;
  if (!row) {
    return {
      ok:false,
      source:'TMP_UNIFIED_ENGINE_V71',
      standard:'ASME B1.1 / ASME B1.2 pendiente',
      key,
      status:'UN_GEOMETRY_ONLY',
      summary:{ D2_basic_mm:roundMT16(basicD2,6), note:'Rosca UN reconocida. Falta fila de limites para esta combinacion serie/tamano/TPI/clase.' },
      message:'Geometria y rodillo disponibles. Objetivos PASA/NO PASA bloqueados hasta cargar limite normativo de esta rosca.'
    };
  }
  const d2Min = row.d2_min_in * INCH_MM;
  const d2Max = row.d2_max_in * INCH_MM;
  return {
    ok:true,
    source:'TMP_UNIFIED_ENGINE_V71_ASME_B1_1_TABLE_PENDING_OFFICIAL_VALIDATION',
    standard:'ASME B1.1 / ASME B1.2 EN VALIDACION',
    key,
    status:'UN_LIMITS_OPERATIVE_PENDING_OFFICIAL_VALIDATION',
    summary:{ D2_basic_mm:roundMT16(basicD2,6), D2_GO_mm:roundMT16(d2Min,6), D2_NOT_GO_mm:roundMT16(d2Max,6), class:cls, note:'Limites UN cargados en modo operativo. Revalidar contra ASME B1.1/B1.2 oficial antes de emitir certificado final.' },
    data:{
      pass:{ id:'UN_PASA', d2_nominal_mm:roundMT16(d2Min,9), min_mm:roundMT16(d2Min,9), max_mm:roundMT16(d2Max,9), wear_max_mm:null },
      no_pass:{ id:'UN_NO_PASA', d2_nominal_mm:roundMT16(d2Max,9), min_mm:roundMT16(d2Min,9), max_mm:roundMT16(d2Max,9), wear_max_mm:null }
    },
    warning:'Motor UN operativo: objetivos Trimos disponibles para ensayo interno. Certificado final bloqueado hasta validar tabla oficial ASME.'
  };
}

function resolveIso228Geometry(parsed) {
  const key = String(parsed?.nominal_label || '').replace(/^G\s*/i, '').trim();
  const row = BSP_THREAD_TABLE?.[key] || null;
  if (!parsed?.ok || parsed.thread_system !== 'BSPP_ISO228') return { ok:false, source:'TMP_ISO228_GEOMETRY_ENGINE_V70', error:'NOT_BSPP_G' };
  if (!row) return { ok:false, source:'TMP_ISO228_GEOMETRY_ENGINE_V70', error:'ISO228_SIZE_NOT_IN_TABLE', key };
  return {
    ok:true,
    source:'TMP_ISO228_GEOMETRY_ENGINE_V70',
    standard:'ISO 228-1:2000',
    key,
    summary:{ major_d_mm:row.d, pitch_diameter_d2_mm:row.d2, minor_d1_mm:row.d1, pitch_mm:row.P, tpi:row.tpi, TD2_internal_mm:row.td2_int },
    internal_thread_basic_mm:{ major_diameter_D:row.d, pitch_diameter_D2:row.d2, minor_diameter_D1:row.d1 },
    table_row:row
  };
}

function resolveIso228GaugeLimits(parsed) {
  const key = String(parsed?.nominal_label || '').replace(/^G\s*/i, '').trim();
  const row = BSP_THREAD_TABLE?.[key] || null;
  if (!parsed?.ok || parsed.thread_system !== 'BSPP_ISO228') return { ok:false, source:'TMP_ISO228_GAUGING_ENGINE_V70', error:'NOT_BSPP_G' };
  if (!row) return { ok:false, source:'TMP_ISO228_GAUGING_ENGINE_V70', error:'ISO228_LIMITS_NOT_LOADED', key };
  const d2Min = row.d2;
  const d2Max = row.d2 + row.td2_int;
  return {
    ok:true,
    source:'TMP_ISO228_GAUGING_ENGINE_V70',
    standard:'ISO 228-1 / ISO 228-2',
    key:`G${key}|${row.tpi}`,
    summary:{ D2_basic_mm:roundMT16(row.d2,6), TD2_internal_mm:roundMT16(row.td2_int,6), D2_GO_mm:roundMT16(d2Min,6), D2_NOT_GO_mm:roundMT16(d2Max,6), note:'Limites de rosca interna G. GO/NOT GO segun criterio ISO 228-2.' },
    data:{
      pass:{ id:'G_PASA', d2_nominal_mm:roundMT16(d2Min,9), min_mm:roundMT16(d2Min,9), max_mm:roundMT16(d2Max,9), wear_max_mm:null },
      no_pass:{ id:'G_NO_PASA', d2_nominal_mm:roundMT16(d2Max,9), min_mm:roundMT16(d2Min,9), max_mm:roundMT16(d2Max,9), wear_max_mm:null }
    },
    warning:'Para certificado completo validar que el instrumento es tampon roscado G PASA/NO PASA para rosca interna. ISO 228-2 define el uso del GO y NOT GO por paso manual, sin fuerza excesiva.'
  };
}

function resolveIso7Info(parsed) {
  const label = String(parsed?.nominal_label || '').replace(/^(R|Rc|Rp)\s*/i, '').trim();
  const row = BSP_THREAD_TABLE?.[label] || null;
  if (!parsed?.ok || parsed.thread_system !== 'BSPT_ISO7') return { ok:false, source:'TMP_ISO7_GEOMETRY_ENGINE_V61', error:'NOT_BSPT_R' };
  if (!row) return { ok:false, source:'TMP_ISO7_GEOMETRY_ENGINE_V61', error:'ISO7_SIZE_NOT_IN_TABLE', key:label };
  return {
    ok:true,
    source:'TMP_ISO7_GEOMETRY_ENGINE_V61',
    standard:'ISO 7-1 / ISO 7-2',
    key:`${parsed.tolerance_class || 'R'}${label}|${row.tpi}`,
    summary:{ gauge_plane_major_d_mm:row.d, gauge_plane_pitch_d2_mm:row.d2, gauge_plane_minor_d1_mm:row.d1, pitch_mm:row.P, tpi:row.tpi, taper:'1:16', verification:'calibre conico con escalon; lectura entre caras + / - segun ISO 7-2' },
    internal_thread_basic_mm:{ major_diameter_D:row.d, pitch_diameter_D2:row.d2, minor_diameter_D1:row.d1 },
    warning:'Rosca ISO 7 conica/paralela de estanqueidad: no se genera objetivo Trimos simple. El procedimiento correcto usa calibre conico de forma completa y posicion del escalon.'
  };
}


function resolveUniversalBasicGeometry(parsed) {
  if (!parsed?.ok) return { ok:false, source:'TMP_UNIVERSAL_THREAD_GEOMETRY_V70', error:'THREAD_NOT_PARSED' };
  const P = parseNum(parsed.pitch_mm, null);
  const D = parseNum(parsed.nominal_mm, null);
  if (!Number.isFinite(P) || !Number.isFinite(D)) {
    return { ok:false, source:'TMP_UNIVERSAL_THREAD_GEOMETRY_V70', error:'GEOMETRY_INPUT_INCOMPLETE', message:'Falta diametro nominal o paso para calcular geometria basica.' };
  }
  const angle = parseNum(parsed.angle_deg, 60);
  let d2 = null, d1 = null, profile = 'GENERIC';
  if (angle === 60) {
    // Perfil V 60 grados: ISO metrica / Unified. Dimensiones basicas equivalentes para geometria, no sustituye tablas de tolerancia.
    d2 = D - 0.6495190528 * P;
    d1 = D - 1.0825317547 * P;
    profile = 'V_60_DEG_BASIC_GEOMETRY';
  } else if (angle === 55) {
    // Perfil Whitworth paralelo/cónico: h = 0.640327 P.
    d2 = D - 0.640327 * P;
    d1 = D - 1.280654 * P;
    profile = 'WHITWORTH_55_DEG_BASIC_GEOMETRY';
  } else if (angle === 30) {
    // Trapezoidal: geometria basica informativa; limites quedan bloqueados hasta tablas ISO 290x.
    d2 = D - 0.5 * P;
    d1 = D - P;
    profile = 'TRAPEZOIDAL_30_DEG_APPROX_GEOMETRY';
  }
  if (!Number.isFinite(d2)) return { ok:false, source:'TMP_UNIVERSAL_THREAD_GEOMETRY_V70', error:'PROFILE_NOT_IMPLEMENTED', angle };
  return {
    ok:true,
    source:'TMP_UNIVERSAL_THREAD_GEOMETRY_V70',
    standard: parsed.standard_hint || 'Geometria universal',
    key: parsed.database_key,
    profile,
    summary:{ major_d_mm:roundMT16(D,6), pitch_diameter_d2_mm:roundMT16(d2,6), minor_d1_mm:roundMT16(d1,6), pitch_mm:roundMT16(P,6), tpi:parsed.tpi || null, angle_deg:angle, note:'Geometria calculada. Limites PASA/NO PASA pendientes de tabla normativa oficial para esta familia.' },
    internal_thread_basic_mm:{ major_diameter_D:roundMT16(D,9), pitch_diameter_D2:roundMT16(d2,9), minor_diameter_D1:roundMT16(d1,9) },
    warning:'Motor geometrico operativo: se calculan diametros basicos y rodillo. No se emite APTO/NOK certificado sin limites oficiales de la familia.'
  };
}


function getFamilyRoute(parsed = {}) {
  const procedure = getThreadProcedure(parsed);
  return {
    engine: procedure.engine,
    standard: (procedure.standards || []).join(' / ') || 'Norma pendiente',
    state: procedure.state,
    level: procedure.level,
    message: procedure.operator?.summary || 'Procedimiento resuelto.',
    procedure_id: procedure.id,
    procedure_version: procedure.version,
    normative_status: procedure.normative_status,
    capabilities: procedure.capabilities,
    measurement: procedure.measurement,
    environment: procedure.environment,
    uncertainty: procedure.uncertainty,
    decision: procedure.decision,
    certificate: procedure.certificate,
    traceability_required: procedure.traceability?.required || [],
    warnings: procedure.warnings || []
  };
}

function buildMT16Audit({ equipment, parsed, iso724, iso965, iso1502, trimos, traceability } = {}) {
  const familyRoute = getFamilyRoute(parsed);
  const iso1502Detail = iso1502?.detail || null;
  const iso1502Inner = iso1502Detail?.iso965 || iso1502?.iso965 || null;
  const iso1502Table = iso1502Detail?.table || iso1502?.table || null;
  return {
    generated_at: new Date().toISOString(),
    equipment_input: {
      codigo: equipment?.codigo || null,
      descripcion: equipment?.descripcion || null,
      rango: equipment?.rango || equipment?.designation || equipment?.range || null
    },
    chain: [
      { step: 'EQUIPO_SUPABASE', ok: !!equipment?.codigo, input: equipment?.codigo || null, output: equipment || null },
      { step: 'PARSER', ok: !!parsed?.ok, input: equipment?.rango || equipment?.designation || equipment?.range || equipment?.descripcion || '', output: parsed, version: TMP_THREAD_PARSER_VERSION },
      { step: 'THREAD_FAMILY_ROUTER', ok: !!parsed?.ok, input: parsed?.thread_system || null, output: familyRoute, version: TMP_MT16_MASTER_ENGINE_VERSION, error: parsed?.ok ? null : 'THREAD_NOT_PARSED' },
      { step: parsed?.thread_system === 'BSPP_ISO228' ? 'ISO228-1_GEOMETRIA' : parsed?.thread_system === 'BSPT_ISO7' ? 'ISO7-1_GEOMETRIA' : 'ISO724_GEOMETRIA', ok: !!iso724?.ok, input: { nominal_mm: parsed?.nominal_mm, pitch_mm: parsed?.pitch_mm, tpi: parsed?.tpi }, output: iso724?.summary || iso724, version: iso724?.source || TMP_ISO724_GEOMETRY_ENGINE_VERSION },
      { step: parsed?.thread_system === 'BSPP_ISO228' ? 'ISO228-1_TOLERANCIAS' : parsed?.thread_system === 'BSPT_ISO7' ? 'ISO7-1_TOLERANCIAS' : 'ISO965_TOLERANCIAS', ok: !!iso965?.ok, input: { key: iso965?.key, class: parsed?.tolerance_class }, output: iso965?.summary || iso965, version: iso965?.source || TMP_ISO965_ENGINE_VERSION, error: iso965?.error || iso965?.message || null },
      { step: parsed?.thread_system === 'BSPP_ISO228' ? 'ISO228-2_VERIFICACION' : parsed?.thread_system === 'BSPT_ISO7' ? 'ISO7-2_VERIFICACION' : 'ISO1502_VERIFICACION', ok: !!iso1502?.ok, input: { key: iso1502?.key, TD2_mm: iso1502Inner?.summary?.TD2_mm }, output: iso1502?.summary || iso1502, version: iso1502?.source || TMP_ISO1502_ENGINE_VERSION, error: iso1502?.error || iso1502?.message || iso1502Detail?.error || null, table: iso1502Table },
      { step: 'TRIMOS', ok: !!trimos?.ok, input: { wire_mm: trimos?.wire?.selected_wire_mm, iso1502_ok: !!iso1502?.ok }, output: trimos?.plan || trimos, version: TMP_TRIMOS_THREAD_ENGINE_VERSION, error: trimos?.error || trimos?.message || null },
      { step: 'TRAZABILIDAD', ok: !!traceability?.ok, input: { needs_bank: true, needs_rollers: true }, output: traceability?.score || traceability, version: TMP_THREAD_TRACEABILITY_ENGINE_VERSION, error: traceability?.error || null }
    ],
    engines: {
      parser: TMP_THREAD_PARSER_VERSION,
      iso724: TMP_ISO724_GEOMETRY_ENGINE_VERSION,
      iso965: TMP_ISO965_ENGINE_VERSION,
      iso1502: TMP_ISO1502_ENGINE_VERSION,
      trimos: TMP_TRIMOS_THREAD_ENGINE_VERSION,
      classifier: TMP_THREAD_PATTERN_CLASSIFIER_VERSION,
      traceability: TMP_THREAD_TRACEABILITY_ENGINE_VERSION,
      uncertainty: TMP_THREAD_UNCERTAINTY_CORE_VERSION,
      decision: TMP_THREAD_DECISION_CORE_VERSION,
      master: TMP_MT16_MASTER_ENGINE_VERSION,
      procedure_router: TMP_MT16_PROCEDURE_ROUTER_VERSION
    }
  };
}

export async function resolveMT16Core({ equipment = {}, supabase = null, readingsByPoint = null } = {}) {
  const designation = equipment.rango || equipment.designation || equipment.range || equipment.descripcion || "";
  const parsed = parseThreadDesignation(designation);

  const isMetricIso = parsed?.ok && parsed.thread_system === "METRIC_ISO";
  const isBsppIso228 = parsed?.ok && parsed.thread_system === "BSPP_ISO228";
  const isBsptIso7 = parsed?.ok && parsed.thread_system === "BSPT_ISO7";
  const isUnified = parsed?.ok && parsed.thread_system === "UN_ASME_B1_1";

  let iso724, iso965, iso1502, trimos, traceability;

  if (isMetricIso) {
    iso724 = calculateIso724Geometry(parsed);
    iso965 = resolveIso965Limits(parsed);
    iso1502 = resolveIso1502Limits(parsed);
    trimos = buildTrimosThreadSetup(parsed, iso1502);
    traceability = await resolveTraceability({ supabase, parsedThread: parsed, trimosPlan: trimos.plan });
  } else if (isBsppIso228) {
    iso724 = resolveIso228Geometry(parsed);
    iso965 = { ok:true, source:'TMP_ISO228_ROUTER_V70', standard:'ISO 228-1', key:parsed.database_key, summary:iso724.summary, warning:'ISO965 no aplica; familia resuelta por ISO 228-1.' };
    iso1502 = resolveIso228GaugeLimits(parsed);
    trimos = buildTrimosThreadSetup(parsed, iso1502);
    traceability = await resolveTraceability({ supabase, parsedThread: parsed, trimosPlan: trimos.plan });
  } else if (isBsptIso7) {
    const wire = calculateBestWire(parsed);
    iso724 = resolveIso7Info(parsed);
    iso965 = { ok:true, source:'TMP_ISO7_ROUTER_V70', standard:'ISO 7-1', key:parsed.database_key, summary:iso724.summary, warning:'ISO965 no aplica; familia resuelta por ISO 7-1.' };
    iso1502 = { ok:false, source:'TMP_ISO7_2_GAUGING_ENGINE_V70', error:'TAPER_GAUGE_STEP_METHOD_REQUIRED', key:parsed.database_key, status:'ISO7_STEP_GAUGE_MODE', summary:iso724.summary, message:'ISO 7-2 exige verificacion mediante calibre conico y escalon de tolerancia; no se emite objetivo Trimos lineal en esta version.' };
    trimos = { ok:false, source:TMP_TRIMOS_THREAD_ENGINE_VERSION, wire, correction:null, plan:null, setup:null, points:[], error:'ISO7_TAPER_STEP_GAUGE_MODE', message:'Usar procedimiento de calibre conico ISO 7-2. MT16 V61 no inventa objetivo sobre rodillos para rosca conica.' };
    traceability = await resolveTraceability({ supabase, parsedThread: parsed, trimosPlan: null });
  } else if (isUnified) {
    iso724 = resolveUniversalBasicGeometry(parsed);
    iso965 = resolveUnifiedThreadLimits(parsed, iso724);
    iso1502 = iso965?.ok ? { ...iso965, source:'TMP_UNIFIED_GAUGING_ENGINE_V71', standard:'ASME B1.2 EN VALIDACION', status:'UN_GO_NOGO_OPERATIVE_PENDING_OFFICIAL_VALIDATION' } : { ok:false, source:'TMP_UNIFIED_GAUGING_ENGINE_V71', error:'UN_LIMITS_NOT_LOADED', key:parsed.database_key, summary:iso724?.summary || null, message:'Faltan limites para generar PASA/NO PASA en esta rosca UN.' };
    trimos = iso1502?.ok ? buildTrimosThreadSetup(parsed, iso1502) : { ok:false, source:TMP_TRIMOS_THREAD_ENGINE_VERSION, wire:calculateBestWire(parsed), correction:null, plan:null, setup:null, points:[], error:'UN_LIMITS_NOT_READY', message:'Rodillo calculado. Objetivos Trimos bloqueados para esta UN hasta cargar limites.' };
    traceability = await resolveTraceability({ supabase, parsedThread: parsed, trimosPlan: trimos.plan });
  } else {
    const wire = parsed?.ok ? calculateBestWire(parsed) : { ok:false, source:TMP_TRIMOS_THREAD_ENGINE_VERSION, error:"THREAD_NOT_PARSED" };
    iso724 = parsed?.ok ? resolveUniversalBasicGeometry(parsed) : { ok:false, source:'TMP_UNIVERSAL_THREAD_GEOMETRY_V70', error:"THREAD_NOT_PARSED" };
    iso965 = { ok:false, source:'TMP_LIMITS_ROUTER_V70', error: parsed?.ok ? "OFFICIAL_LIMITS_PENDING_FOR_THREAD_FAMILY" : "THREAD_NOT_PARSED", key:parsed?.database_key || null, summary: iso724?.summary || null, message:"Familia detectada y geometria calculada. Faltan limites oficiales PASA/NO PASA para certificar esta familia." };
    iso1502 = { ok:false, source:'TMP_GAUGING_ROUTER_V70', error: parsed?.ok ? "GAUGING_STANDARD_PENDING_FOR_THREAD_FAMILY" : "THREAD_NOT_PARSED", key:parsed?.database_key || null, status:"GEOMETRY_ONLY_SAFE_MODE", summary: iso724?.summary || null, message:"Modo seguro: se muestra geometria, rodillo y procedimiento pendiente. No se calcula APTO/NOK sin tabla normativa oficial." };
    trimos = { ok:false, source:TMP_TRIMOS_THREAD_ENGINE_VERSION, wire, correction:null, plan:null, setup:null, points:[], error:"OBJECTIVES_BLOCKED_WITHOUT_FAMILY_NORMATIVE_LIMITS", message:"Rodillo calculado para preparacion/estudio. Objetivos Trimos bloqueados hasta disponer de limites normativos oficiales." };
    traceability = await resolveTraceability({ supabase, parsedThread: parsed, trimosPlan: null });
  }

  let readings = null, uncertainty = null, decision = null;
  if (readingsByPoint && (isMetricIso || isBsppIso228 || isUnified)) {
    readings = evaluateReadings({ trimos, traceability, readingsByPoint });
    // MT16 TMP: la incertidumbre trazable procede del Trimos. Los rodillos/hilos
    // se modelan como accesorio mediante u_rollers_mm y no exigen certificado individual.
    // El patron de rosca independiente no forma parte de la cadena de incertidumbre del metodo.
    uncertainty = calculateThreadUncertainty({ readingResults: readings.results || [], patterns: { selected_bank: traceability.selected_bank, selected_rollers: null, selected_master: null }, model: { u_rollers_mm: 0.0003, u_master_mm: 0, resolution_mm: 0.001, k: 2 } });
    decision = decideThreadCalibration({ readingResults: readings.results || [], uncertainty });
  }

  const audit = buildMT16Audit({ equipment, parsed, iso724, iso965, iso1502, trimos, traceability });
  const familyRoute = getFamilyRoute(parsed);
  const procedure = getThreadProcedure(parsed);
  const canEvaluate = Boolean((isMetricIso || isBsppIso228 || isUnified) && parsed.ok && iso724.ok && iso965.ok && iso1502.ok && trimos.ok);
  const officialCertificateFamily = Boolean(isMetricIso || isBsppIso228);
  const canEmitTechnicalResult = Boolean(canEvaluate && traceability.ok);
  const canEmitFullCertificate = Boolean(canEvaluate && officialCertificateFamily && traceability.ok_full_traceability && (!readingsByPoint || decision?.global_decision));
  const status = officialCertificateFamily && canEvaluate ? "MT16_CORE_CERTIFICABLE" : (canEvaluate ? "MT16_CORE_OPERATIVO_EN_VALIDACION" : (parsed?.ok ? "MT16_CORE_OPERATIVO_SEGURO_LIMITES_PENDIENTES" : "MT16_CORE_INCOMPLETE"));

  return {
    ok: canEvaluate,
    source: TMP_MT16_MASTER_ENGINE_VERSION,
    version: TMP_MT16_MASTER_ENGINE_VERSION,
    status,
    family_route: familyRoute,
    procedure,
    certification_state: familyRoute.state,
    can_evaluate: canEvaluate,
    can_emit_technical_result: canEmitTechnicalResult,
    can_emit_full_certificate: canEmitFullCertificate,
    equipment,
    engines: { parser: TMP_THREAD_PARSER_VERSION, iso724: TMP_ISO724_GEOMETRY_ENGINE_VERSION, iso965: TMP_ISO965_ENGINE_VERSION, iso1502: TMP_ISO1502_ENGINE_VERSION, trimos: TMP_TRIMOS_THREAD_ENGINE_VERSION, classifier: TMP_THREAD_PATTERN_CLASSIFIER_VERSION, traceability: TMP_THREAD_TRACEABILITY_ENGINE_VERSION, uncertainty: TMP_THREAD_UNCERTAINTY_CORE_VERSION, decision: TMP_THREAD_DECISION_CORE_VERSION, procedure_router: TMP_MT16_PROCEDURE_ROUTER_VERSION },
    parsed, iso724, iso965, iso1502, trimos, traceability, patterns: traceability, readings, uncertainty, decision, audit,
    summary: {
      designation: parsed.normalized,
      thread_system: parsed.thread_system,
      family: parsed.family,
      nominal_label: parsed.nominal_label,
      nominal_mm: parsed.nominal_mm,
      pitch_mm: parsed.pitch_mm,
      tpi: parsed.tpi,
      class: parsed.tolerance_class,
      D2_basic_mm: iso724.internal_thread_basic_mm?.pitch_diameter_D2,
      diameter_basic_label: parsed.thread_system === 'BSPP_ISO228' ? 'Diámetro de paso básico ISO 228-1' : parsed.thread_system === 'BSPT_ISO7' ? 'Diámetro de paso en plano de calibre ISO 7-1' : parsed.thread_system === 'UN_ASME_B1_1' ? 'Diámetro de paso básico ASME B1.1' : 'D2 básico ISO 724',
      pass_limit_label: parsed.thread_system === 'BSPP_ISO228' ? 'Límite PASA / GO ISO 228-2' : parsed.thread_system === 'BSPT_ISO7' ? 'Calibre cónico ISO 7-2' : parsed.thread_system === 'UN_ASME_B1_1' ? 'Límite PASA / GO ASME B1.2' : 'D2 PASA / GO ISO 1502',
      no_pass_limit_label: parsed.thread_system === 'BSPP_ISO228' ? 'Límite NO PASA / NOT GO ISO 228-2' : parsed.thread_system === 'BSPT_ISO7' ? 'Escalón +/- ISO 7-2' : parsed.thread_system === 'UN_ASME_B1_1' ? 'Límite NO PASA / NOT GO ASME B1.2' : 'D2 NO PASA / NOT GO ISO 1502',
      normative_standard: parsed.thread_system === 'BSPP_ISO228' ? 'ISO 228-1 / ISO 228-2' : parsed.thread_system === 'BSPT_ISO7' ? 'ISO 7-1 / ISO 7-2' : parsed.thread_system === 'UN_ASME_B1_1' ? 'ASME B1.1 / ASME B1.2 EN VALIDACION' : 'ISO 724 / ISO 965 / ISO 1502',
      D1_basic_mm: iso724.internal_thread_basic_mm?.minor_diameter_D1,
      rodillo_mm: trimos.wire?.selected_wire_mm,
      ideal_rodillo_mm: trimos.wire?.ideal_wire_mm,
      trimos_correction_mm: trimos.correction?.correction_mm,
      pass_target_trimos_mm: trimos.plan?.points?.[0]?.target_trimos_mm,
      no_pass_target_trimos_mm: trimos.plan?.points?.[1]?.target_trimos_mm,
      bank: traceability.selected_bank?.codigo || null,
      rollers: traceability.selected_rollers?.codigo || null,
      master: traceability.selected_master?.codigo || null,
      traceability_score: traceability.score?.total || 0,
      traceability_percent: traceability.score?.percent || 0,
      global_decision: decision?.global_decision || null,
      family_engine: familyRoute.engine,
      procedure_id: procedure.id,
      procedure_title: procedure.operator?.title,
      procedure_steps: procedure.operator?.steps || [],
      certification_state: familyRoute.state,
      certification_message: familyRoute.message,
      procedure_standard: parsed.thread_system === 'BSPP_ISO228' ? 'ISO 228-2: GO debe pasar a mano sin fuerza excesiva; NOT GO no debe superar el criterio de vueltas indicado por la norma.' : parsed.thread_system === 'BSPT_ISO7' ? 'ISO 7-2: verificacion con calibre conico de forma completa; la cara de la pieza debe quedar entre las caras del escalon +/-.' : parsed.thread_system === 'UN_ASME_B1_1' ? 'ASME B1.2 pendiente de validacion oficial: motor operativo para ensayo interno con limites cargados cuando existan.' : 'ISO 1502: verificacion PASA / NO PASA y calculo por diametro medio sobre rodillos.',
    },
    warnings: [ ...(parsed.warnings || []), ...(iso965.warning ? [iso965.warning] : []), ...(iso1502.warning ? [iso1502.warning] : []), ...(trimos.wire?.warning ? [trimos.wire.warning] : []), ...(traceability.warnings || []) ]
  };
}
export default { TMP_MT16_MASTER_ENGINE_VERSION, resolveMT16Core, evaluateReadings };
