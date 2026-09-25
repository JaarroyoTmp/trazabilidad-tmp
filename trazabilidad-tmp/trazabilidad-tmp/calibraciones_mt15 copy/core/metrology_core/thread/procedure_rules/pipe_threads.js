/* TMP MT16 EXPERT CORE V73 - procedure_rules/pipe_threads.js */
import { buildProcedure, buildStepList, COMMON_THREAD_STEPS, PROCEDURE_STATES } from "./shared.js";
export const TMP_MT16_PIPE_PROCEDURE_VERSION = "TMP_MT16_PIPE_PROCEDURE_V73_20260702";
export function getBsppProcedure(parsed = {}) {
  return buildProcedure({
    id: "bspp_iso228_thread_gauge",
    family: "BSPP_ISO228",
    engine: "bspp_engine",
    state: PROCEDURE_STATES.CERTIFICABLE,
    level: "VERDE",
    standards: ["ISO 228-1", "ISO 228-2", "ILAC-G8", "ISO 14253"],
    normativeStatus: "VALIDADO_CORE_TMP",
    canCalculateTargets: true,
    canEvaluateReadings: true,
    canEmitCertificate: true,
    measurementMethod: "THREE_WIRES_OR_ROLLERS_TRIMOS",
    measuringEquipment: ["Banco Trimos horizontal certificado"],
    requiredAccessories: ["Rodillo/bola calculado por motor", "Tampón/anillo patrón G si aplica"],
    operatorTitle: "Rosca G / BSPP ISO 228",
    operatorSummary: "Procedimiento para rosca cilíndrica G: geometría ISO 228-1, verificación ISO 228-2 y objetivos Trimos cuando el instrumento sea tampón P/NP interno.",
    requiredTraceability: ["Banco Trimos certificado", "Rodillos/bolas certificados", "Patrón/maestro de rosca si aplica"],
    uncertaintyModel: "TMP_THREAD_U_MODEL_BSPP_ISO228",
    certificateTemplate: "TMP_MT16_CERT_BSPP_ISO228",
    steps: buildStepList([COMMON_THREAD_STEPS.certificate])
  });
}
export function getBsptProcedure(parsed = {}) {
  return buildProcedure({
    id: "bspt_iso7_thread_gauge",
    family: "BSPT_ISO7",
    engine: "bspt_engine",
    state: PROCEDURE_STATES.OPERATIVO_SEGURO,
    level: "AMARILLO",
    standards: ["ISO 7-1", "ISO 7-2"],
    normativeStatus: "GEOMETRIA_OPERATIVA_CALIBRE_CONICO_PENDIENTE",
    canCalculateTargets: false,
    canEvaluateReadings: false,
    canEmitCertificate: false,
    measurementMethod: "TAPER_FULL_FORM_GAUGE_STEP_ISO7_2",
    measuringEquipment: ["Calibre cónico ISO 7-2 certificado"],
    requiredAccessories: ["Calibre cónico con escalón + / -", "Control visual y limpieza"],
    operatorTitle: "Rosca R/Rc/Rp ISO 7",
    operatorSummary: "Procedimiento seguro para rosca cónica/paralela de estanqueidad. ISO 7-2 usa calibre cónico con escalón; no se inventa objetivo Trimos lineal.",
    requiredTraceability: ["Calibre cónico ISO 7-2 certificado", "Control visual y limpieza"],
    uncertaintyModel: "TMP_THREAD_U_MODEL_ISO7_TAPER_GAUGE",
    certificateTemplate: "TMP_MT16_CERT_ISO7_TAPER_PENDING",
    blocksCertificateReason: "Certificado dimensional completo bloqueado hasta registrar/calibrar el calibre cónico ISO 7-2 y validar procedimiento de lectura por escalón.",
    steps: [COMMON_THREAD_STEPS.identify, COMMON_THREAD_STEPS.clean, COMMON_THREAD_STEPS.stabilize, "Usar calibre cónico ISO 7-2 de forma completa.", "Verificar que la cara queda entre las marcas + / - del escalón.", "Registrar resultado sin emitir certificado dimensional completo hasta validar patrón/calibre."],
    warnings: ["Rosca cónica: no usar objetivo Trimos lineal salvo procedimiento específico aprobado."]
  });
}
