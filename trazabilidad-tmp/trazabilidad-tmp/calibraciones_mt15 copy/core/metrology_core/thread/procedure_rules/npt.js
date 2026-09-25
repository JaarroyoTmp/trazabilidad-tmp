/* TMP MT16 EXPERT CORE V73 - procedure_rules/npt.js */
import { buildProcedure, COMMON_THREAD_STEPS, PROCEDURE_STATES } from "./shared.js";
export const TMP_MT16_NPT_PROCEDURE_VERSION = "TMP_MT16_NPT_PROCEDURE_V73_20260702";
export function getNptProcedure(parsed = {}) {
  return buildProcedure({
    id: "npt_asme_thread_gauge",
    family: "NPT_ASME_B1_20",
    engine: "npt_engine",
    state: PROCEDURE_STATES.OPERATIVO_SEGURO,
    level: "AMARILLO",
    standards: ["ASME B1.20.x pendiente de validación oficial"],
    normativeStatus: "GEOMETRIA_OPERATIVA_CALIBRE_CONICO_PENDIENTE",
    canCalculateTargets: false,
    canEvaluateReadings: false,
    canEmitCertificate: false,
    measurementMethod: "NPT_TAPER_GAUGE_STEP",
    measuringEquipment: ["Calibre NPT/NPTF certificado"],
    requiredAccessories: ["Calibre cónico NPT/NPTF", "Tabla ASME validada"],
    operatorTitle: "Rosca NPT/NPTF",
    operatorSummary: "Familia identificada y geometría/rodillo disponibles. La verificación certificable queda bloqueada hasta cargar norma y procedimiento de calibre cónico.",
    requiredTraceability: ["Calibre NPT/NPTF certificado", "Tabla ASME validada"],
    uncertaintyModel: "TMP_THREAD_U_MODEL_NPT_TAPER_GAUGE",
    certificateTemplate: "TMP_MT16_CERT_NPT_PENDING",
    blocksCertificateReason: "Certificado bloqueado hasta validar ASME B1.20.x y procedimiento de calibre cónico NPT/NPTF.",
    steps: [COMMON_THREAD_STEPS.identify, COMMON_THREAD_STEPS.clean, COMMON_THREAD_STEPS.stabilize, "Usar procedimiento de calibre cónico NPT/NPTF cuando esté validado.", "Registrar ensayo interno si procede; no emitir certificado final."],
    warnings: ["Rosca cónica NPT/NPTF: no usar objetivo Trimos lineal como decisión certificable."]
  });
}
