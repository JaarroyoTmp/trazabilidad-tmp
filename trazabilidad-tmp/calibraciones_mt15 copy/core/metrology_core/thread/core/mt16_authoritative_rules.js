/* TMP MT16 AUTHORITATIVE RULES V1 - 2026-10-05
   FUENTE ACTIVA DE VERDAD para decisiones transversales MT16.

   REGLAS BLOQUEANTES:
   1) Rosca metrica ISO certificable: el rodillo se selecciona EXCLUSIVAMENTE de la tabla TMP validada por paso.
      No se aproxima al comercial mas cercano. Si el paso no existe, se bloquean objetivos/certificado.
   2) Banco Trimos certificado = patron trazable principal del montaje MT16.
   3) Rodillos/hilos = utiles/accesorios de medicion. No son patron trazable requerido por defecto y su ausencia en Supabase NO bloquea certificado.
   4) Patron/maestro roscado = opcional/diagnostico salvo procedimiento especifico que lo exija expresamente.
   5) Correccion metrologica aplicable por trazabilidad = correccion vigente del banco Trimos.
      La correccion geometrica C=3w-0.8660254038P se calcula aparte y no es una correccion de certificado.
   6) Incertidumbre: no se introduce una u de rodillos ni de maestro fija/hardcodeada. Solo se incluye una contribucion accesoria si un modelo especifico, documentado y validado la activa expresamente.

   MODULOS LEGACY/NO AUTORITATIVOS: se conservan por compatibilidad e historico, pero no deben gobernar MT16 activo.
*/
export const TMP_MT16_AUTHORITATIVE_RULES_VERSION = "TMP_MT16_AUTHORITATIVE_RULES_V1_20261005";

export const TMP_METRIC_WIRE_BY_PITCH_MM = Object.freeze({
  "0.25": 0.170,
  "0.30": 0.170,
  "0.35": 0.220,
  "0.40": 0.250,
  "0.45": 0.290,
  "0.50": 0.290,
  "0.60": 0.335,
  "0.70": 0.455,
  "0.80": 0.455,
  "0.90": 0.530,
  "1.00": 0.620,
  "1.25": 0.725,
  "1.50": 0.895,
  "1.75": 1.100,
  "2.00": 1.350,
  "2.50": 1.650,
  "3.00": 2.050,
  "3.50": 2.050,
  "4.00": 2.550,
  "4.50": 2.550,
  "5.00": 3.200,
  "5.50": 3.200
});

export const MT16_TRACEABILITY_POLICY = Object.freeze({
  principal_pattern: "BANCO_TRIMOS_CERTIFICADO",
  required_for_certificate: Object.freeze(["BANCO_TRIMOS_CERTIFICADO"]),
  rollers_role: "MEASUREMENT_ACCESSORY",
  rollers_block_certificate: false,
  threaded_master_role: "OPTIONAL_DIAGNOSTIC",
  threaded_master_block_certificate: false,
  apply_bank_certificate_correction: true,
  apply_roller_certificate_correction: false,
  apply_thread_master_certificate_correction: false
});

export const MT16_UNCERTAINTY_POLICY = Object.freeze({
  required_components: Object.freeze(["u_bank", "u_resolution", "u_repeatability", "u_temperature"]),
  rollers_default_u_mm: 0,
  master_default_u_mm: 0,
  accessory_uncertainty_requires_explicit_validated_model: true
});

export const MT16_LEGACY_MODULES_DO_NOT_USE = Object.freeze([
  "thread/engines/thread_trimos_engine.js",
  "thread/thread_mt16_workflow.js",
  "metrology_core/core/mt16_master_engine.js"
]);

function pitchKey(value) {
  const n = Number(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toFixed(2);
}

export function resolveValidatedMetricWire(pitchMm) {
  const key = pitchKey(pitchMm);
  if (!key) return { ok:false, error:"INVALID_METRIC_PITCH", pitch_mm:null, source:TMP_MT16_AUTHORITATIVE_RULES_VERSION };
  const wire = TMP_METRIC_WIRE_BY_PITCH_MM[key];
  if (!Number.isFinite(wire)) {
    return {
      ok:false,
      error:"TMP_METRIC_WIRE_NOT_VALIDATED_FOR_PITCH",
      pitch_mm:Number(key),
      source:TMP_MT16_AUTHORITATIVE_RULES_VERSION,
      message:`Paso ${Number(key)} mm sin rodillo TMP validado. No aproximar: bloquear objetivos MT16 hasta validar la fila.`
    };
  }
  return {
    ok:true,
    pitch_mm:Number(key),
    wire_mm:wire,
    selected_wire_mm:wire,
    method:"TMP_VALIDATED_WIRE_TABLE_EXACT",
    source:TMP_MT16_AUTHORITATIVE_RULES_VERSION
  };
}

export function getMT16AuthoritativePolicy() {
  return {
    version: TMP_MT16_AUTHORITATIVE_RULES_VERSION,
    traceability: MT16_TRACEABILITY_POLICY,
    uncertainty: MT16_UNCERTAINTY_POLICY,
    legacy_modules_do_not_use: MT16_LEGACY_MODULES_DO_NOT_USE,
    metric_wire_table: TMP_METRIC_WIRE_BY_PITCH_MM
  };
}
