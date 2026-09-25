/* TMP MT16 EXPERT CORE V73 - procedure_rules/whitworth.js */
import { buildProcedure, buildStepList, PROCEDURE_STATES } from "./shared.js";
export const TMP_MT16_WHITWORTH_PROCEDURE_VERSION = "TMP_MT16_WHITWORTH_PROCEDURE_V73_20260702";
export function getWhitworthProcedure(parsed = {}) {
  return buildProcedure({
    id: "whitworth_thread_gauge",
    family: "BSW_BS84",
    engine: "whitworth_engine",
    state: PROCEDURE_STATES.OPERATIVO_SEGURO,
    level: "AMARILLO",
    standards: ["BS 84 / Whitworth pendiente de validación oficial"],
    normativeStatus: "GEOMETRIA_OPERATIVA_LIMITES_PENDIENTES",
    canCalculateTargets: false,
    canEvaluateReadings: false,
    canEmitCertificate: false,
    measurementMethod: "THREE_WIRES_OR_ROLLERS_WHITWORTH_55",
    measuringEquipment: ["Banco Trimos horizontal certificado"],
    requiredAccessories: ["Rodillo/bola calculado por motor", "Tabla Whitworth validada"],
    operatorTitle: "Rosca Whitworth / BSW",
    operatorSummary: "Familia identificada y geometría/rodillo disponibles. Límites oficiales y certificado final pendientes.",
    requiredTraceability: ["Banco Trimos certificado", "Rodillos/bolas certificados", "Tabla Whitworth validada"],
    uncertaintyModel: "TMP_THREAD_U_MODEL_WHITWORTH_55",
    certificateTemplate: "TMP_MT16_CERT_WHITWORTH_PENDING",
    blocksCertificateReason: "Certificado bloqueado hasta validar tabla Whitworth/BS84 oficial y límites de calibre.",
    steps: buildStepList(["Resultado técnico interno; certificado bloqueado hasta validar norma."]),
    warnings: ["Perfil 55°. Validar límites oficiales antes de decisión final certificable."]
  });
}
