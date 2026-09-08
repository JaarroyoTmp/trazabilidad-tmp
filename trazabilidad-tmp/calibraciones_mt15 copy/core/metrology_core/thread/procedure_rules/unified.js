/* TMP MT16 EXPERT CORE V73 - procedure_rules/unified.js */
import { buildProcedure, buildStepList, PROCEDURE_STATES } from "./shared.js";
export const TMP_MT16_UNIFIED_PROCEDURE_VERSION = "TMP_MT16_UNIFIED_PROCEDURE_V73_20260702";
export function getUnifiedProcedure(parsed = {}) {
  return buildProcedure({
    id: "unified_asme_thread_gauge",
    family: "UN_ASME_B1_1",
    engine: "unified_engine",
    state: PROCEDURE_STATES.OPERATIVO_EN_VALIDACION,
    level: "AMARILLO",
    standards: ["ASME B1.1", "ASME B1.2 pendiente de validación oficial"],
    normativeStatus: "MOTOR_OPERATIVO_LIMITES_EN_VALIDACION",
    canCalculateTargets: true,
    canEvaluateReadings: true,
    canEmitCertificate: false,
    measurementMethod: "THREE_WIRES_OR_ROLLERS_TRIMOS_UNIFIED",
    measuringEquipment: ["Banco Trimos horizontal certificado"],
    requiredAccessories: ["Rodillo/bola calculado por motor", "Tabla ASME validada"],
    operatorTitle: "Rosca Unified UNC/UNF/UNEF",
    operatorSummary: "Motor operativo para ensayo interno: geometría, rodillo y objetivos cuando la combinación está cargada. Certificado final bloqueado hasta validar ASME B1.1/B1.2 oficial.",
    requiredTraceability: ["Banco Trimos certificado", "Rodillos/bolas certificados", "Tabla ASME validada"],
    uncertaintyModel: "TMP_THREAD_U_MODEL_UNIFIED_ASME",
    certificateTemplate: "TMP_MT16_CERT_UNIFIED_ASME_PENDING",
    blocksCertificateReason: "Motor UN operativo en validación. Certificado final bloqueado hasta validar límites ASME oficiales y registrar tabla normativa controlada.",
    steps: buildStepList(["Resultado técnico interno en validación; no emitir certificado final hasta validar norma."]),
    warnings: ["Los límites UN cargados son operativos para ensayo interno y deben revisarse contra ASME oficial antes de certificado."]
  });
}
