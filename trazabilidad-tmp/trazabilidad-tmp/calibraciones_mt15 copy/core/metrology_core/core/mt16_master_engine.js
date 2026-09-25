/* TMP THREAD CORE V33 - mt16_master_engine.js */
import { parseThreadDesignation, TMP_THREAD_PARSER_VERSION, parseNum } from "./thread_parser.js";
import { calculateIso724Geometry, TMP_ISO724_GEOMETRY_ENGINE_VERSION } from "./iso724_geometry_engine.js";
import { resolveIso965Limits, TMP_ISO965_ENGINE_VERSION } from "./iso965_engine.js";
import { resolveIso1502Limits, TMP_ISO1502_ENGINE_VERSION } from "./iso1502_engine.js";
import { buildTrimosThreadSetup, TMP_TRIMOS_THREAD_ENGINE_VERSION } from "./trimos_engine.js";
import { calculateThreadUncertainty, TMP_THREAD_UNCERTAINTY_CORE_VERSION } from "./thread_uncertainty_engine_core.js";
import { decideThreadCalibration, TMP_THREAD_DECISION_CORE_VERSION } from "./thread_decision_engine_core.js";
import { resolveTraceability, TMP_THREAD_TRACEABILITY_ENGINE_VERSION } from "./thread_traceability_engine.js";
import { TMP_THREAD_PATTERN_CLASSIFIER_VERSION } from "./thread_pattern_classifier.js";

export const TMP_MT16_MASTER_ENGINE_VERSION = "TMP_MT16_MASTER_ENGINE_V39_20260702_AUDITOR";

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

function buildMT16Audit({ equipment, parsed, iso724, iso965, iso1502, trimos, traceability } = {}) {
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
      { step: 'ISO724', ok: !!iso724?.ok, input: { nominal_mm: parsed?.nominal_mm, pitch_mm: parsed?.pitch_mm }, output: iso724?.summary || iso724, version: TMP_ISO724_GEOMETRY_ENGINE_VERSION },
      { step: 'ISO965', ok: !!iso965?.ok, input: { key: iso965?.key, class: parsed?.tolerance_class }, output: iso965?.summary || iso965, version: TMP_ISO965_ENGINE_VERSION, error: iso965?.error || iso965?.message || null },
      { step: 'ISO1502', ok: !!iso1502?.ok, input: { key: iso1502?.key, TD2_mm: iso1502Inner?.summary?.TD2_mm }, output: iso1502?.summary || iso1502, version: TMP_ISO1502_ENGINE_VERSION, error: iso1502?.error || iso1502?.message || iso1502Detail?.error || null, table: iso1502Table },
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
      master: TMP_MT16_MASTER_ENGINE_VERSION
    }
  };
}

export async function resolveMT16Core({ equipment = {}, supabase = null, readingsByPoint = null } = {}) {
  const designation = equipment.rango || equipment.designation || equipment.range || equipment.descripcion || "";
  const parsed = parseThreadDesignation(designation);
  const iso724 = calculateIso724Geometry(parsed);
  const iso965 = resolveIso965Limits(parsed);
  const iso1502 = resolveIso1502Limits(parsed);
  const trimos = buildTrimosThreadSetup(parsed, iso1502);
  const traceability = await resolveTraceability({ supabase, parsedThread: parsed, trimosPlan: trimos.plan });
  let readings = null, uncertainty = null, decision = null;
  if (readingsByPoint) {
    readings = evaluateReadings({ trimos, traceability, readingsByPoint });
    uncertainty = calculateThreadUncertainty({ readingResults: readings.results || [], patterns: { selected_bank: traceability.selected_bank, selected_rollers: traceability.selected_rollers, selected_master: traceability.selected_master }, model: { u_rollers_mm: 0.0003, u_master_mm: 0, resolution_mm: 0.001, k: 2 } });
    decision = decideThreadCalibration({ readingResults: readings.results || [], uncertainty });
  }
  const audit = buildMT16Audit({ equipment, parsed, iso724, iso965, iso1502, trimos, traceability });
  const canEvaluate = Boolean(parsed.ok && iso724.ok && iso965.ok && iso1502.ok && trimos.ok);
  const canEmitTechnicalResult = Boolean(canEvaluate && traceability.ok);
  const canEmitFullCertificate = Boolean(canEvaluate && traceability.ok_full_traceability && (!readingsByPoint || decision?.global_decision));
  return {
    ok: canEvaluate,
    source: TMP_MT16_MASTER_ENGINE_VERSION,
    version: TMP_MT16_MASTER_ENGINE_VERSION,
    status: canEvaluate ? "MT16_CORE_READY" : "MT16_CORE_INCOMPLETE",
    can_evaluate: canEvaluate,
    can_emit_technical_result: canEmitTechnicalResult,
    can_emit_full_certificate: canEmitFullCertificate,
    equipment,
    engines: { parser: TMP_THREAD_PARSER_VERSION, iso724: TMP_ISO724_GEOMETRY_ENGINE_VERSION, iso965: TMP_ISO965_ENGINE_VERSION, iso1502: TMP_ISO1502_ENGINE_VERSION, trimos: TMP_TRIMOS_THREAD_ENGINE_VERSION, classifier: TMP_THREAD_PATTERN_CLASSIFIER_VERSION, traceability: TMP_THREAD_TRACEABILITY_ENGINE_VERSION, uncertainty: TMP_THREAD_UNCERTAINTY_CORE_VERSION, decision: TMP_THREAD_DECISION_CORE_VERSION },
    parsed, iso724, iso965, iso1502, trimos, traceability, patterns: traceability, readings, uncertainty, decision, audit,
    summary: { designation: parsed.normalized, nominal_mm: parsed.nominal_mm, pitch_mm: parsed.pitch_mm, class: parsed.tolerance_class, D2_basic_mm: iso724.internal_thread_basic_mm?.pitch_diameter_D2, D1_basic_mm: iso724.internal_thread_basic_mm?.minor_diameter_D1, rodillo_mm: trimos.wire?.selected_wire_mm, trimos_correction_mm: trimos.correction?.correction_mm, pass_target_trimos_mm: trimos.plan?.points?.[0]?.target_trimos_mm, no_pass_target_trimos_mm: trimos.plan?.points?.[1]?.target_trimos_mm, bank: traceability.selected_bank?.codigo || null, rollers: traceability.selected_rollers?.codigo || null, master: traceability.selected_master?.codigo || null, traceability_score: traceability.score?.total || 0, traceability_percent: traceability.score?.percent || 0, global_decision: decision?.global_decision || null },
    warnings: [ ...(parsed.warnings || []), ...(iso965.warning ? [iso965.warning] : []), ...(iso1502.warning ? [iso1502.warning] : []), ...(trimos.wire?.warning ? [trimos.wire.warning] : []), ...(traceability.warnings || []) ]
  };
}
export default { TMP_MT16_MASTER_ENGINE_VERSION, resolveMT16Core, evaluateReadings };
