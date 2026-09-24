/* TMP MT16 EXPERT CORE V73 - procedure_rules/shared.js */
export const TMP_MT16_PROCEDURE_SHARED_VERSION = "TMP_MT16_PROCEDURE_SHARED_V73_20260702";

export const PROCEDURE_STATES = {
  CERTIFICABLE: "CERTIFICABLE",
  OPERATIVO_EN_VALIDACION: "OPERATIVO_EN_VALIDACION",
  OPERATIVO_SEGURO: "OPERATIVO_SEGURO",
  NO_IDENTIFICADA: "NO_IDENTIFICADA"
};

export function buildProcedure({
  id,
  family,
  engine,
  state = PROCEDURE_STATES.OPERATIVO_SEGURO,
  level = "AMARILLO",
  standards = [],
  canCalculateGeometry = true,
  canSelectWire = true,
  canCalculateTargets = false,
  canEvaluateReadings = false,
  canEmitCertificate = false,
  measurementMethod = "THREE_WIRES_OR_ROLLERS",
  measuringEquipment = [],
  requiredAccessories = [],
  requiredEnvironment = ["Sala 20 ±1 °C", "Equipo estabilizado", "Limpieza previa"],
  operatorTitle = "Procedimiento MT16",
  operatorSummary = "El sistema ha identificado la familia y guiará al operario.",
  steps = [],
  requiredTraceability = [],
  uncertaintyModel = "TMP_THREAD_U_MODEL_GENERIC",
  decisionRule = "ILAC-G8 / ISO 14253",
  certificateTemplate = "TMP_MT16_CERT_THREAD_GENERIC",
  normativeStatus = "PENDIENTE_VALIDACION",
  blocksCertificateReason = null,
  warnings = []
} = {}) {
  const certificateBlockedReason = canEmitCertificate ? null : (blocksCertificateReason || "Certificado final bloqueado hasta disponer de todos los límites normativos y trazabilidad completa.");
  return {
    ok: true,
    version: TMP_MT16_PROCEDURE_SHARED_VERSION,
    id,
    family,
    engine,
    state,
    level,
    standards,
    normative_status: normativeStatus,
    capabilities: {
      can_calculate_geometry: !!canCalculateGeometry,
      can_select_wire: !!canSelectWire,
      can_calculate_targets: !!canCalculateTargets,
      can_evaluate_readings: !!canEvaluateReadings,
      can_emit_certificate: !!canEmitCertificate
    },
    measurement: {
      method: measurementMethod,
      equipment: measuringEquipment,
      accessories: requiredAccessories,
      repetitions: 5,
      points: ["PASA", "NO PASA"],
      input_unit: "mm",
      output_unit: "mm"
    },
    environment: {
      required: requiredEnvironment,
      default_temperature_c: 20,
      tolerance_c: 1
    },
    operator: {
      title: operatorTitle,
      summary: operatorSummary,
      steps,
      must_confirm_preparation: true,
      can_override_decision: false
    },
    traceability: {
      required: requiredTraceability,
      required_status: "vigente",
      block_if_expired: true
    },
    uncertainty: {
      model: uncertaintyModel,
      k: 2,
      components: ["u_patron", "u_resolucion", "u_repetibilidad", "u_temperatura"],
      engine: "thread_uncertainty_engine_core"
    },
    decision: {
      rule: decisionRule,
      engine: "thread_decision_engine_core",
      operator_decides: false
    },
    certificate: {
      template: certificateTemplate,
      can_emit: !!canEmitCertificate,
      blocked_reason: certificateBlockedReason,
      include_audit_json: true,
      include_traceability: true,
      include_uncertainty: true,
      include_decision_rule: true
    },
    warnings,
    certificate_blocked_reason: certificateBlockedReason
  };
}

export const COMMON_THREAD_STEPS = {
  identify: "Identificar instrumento en Supabase y verificar código/rango.",
  clean: "Limpiar rosca, rodillos/bolas y superficies de contacto.",
  stabilize: "Asegurar estabilización térmica en sala 20 ±1 °C.",
  bank: "Preparar banco Trimos certificado y aplicar corrección vigente.",
  wire: "Montar el rodillo/bola indicado por el motor. El operario no lo selecciona.",
  readingsGo: "Tomar 5 lecturas del lado PASA siguiendo el objetivo indicado.",
  readingsNoGo: "Tomar 5 lecturas del lado NO PASA siguiendo el objetivo indicado.",
  decide: "El motor calcula media, incertidumbre, regla de decisión y resultado.",
  certificate: "Guardar calibración, JSON técnico y certificado cuando el procedimiento sea certificable."
};

export function buildStepList(extra = []) {
  return [
    COMMON_THREAD_STEPS.identify,
    COMMON_THREAD_STEPS.clean,
    COMMON_THREAD_STEPS.stabilize,
    COMMON_THREAD_STEPS.bank,
    COMMON_THREAD_STEPS.wire,
    COMMON_THREAD_STEPS.readingsGo,
    COMMON_THREAD_STEPS.readingsNoGo,
    COMMON_THREAD_STEPS.decide,
    ...extra
  ];
}
