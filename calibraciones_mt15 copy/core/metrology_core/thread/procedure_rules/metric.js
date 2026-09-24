/* TMP MT16 EXPERT CORE V73 - procedure_rules/metric.js */
import { buildProcedure, buildStepList, COMMON_THREAD_STEPS, PROCEDURE_STATES } from "./shared.js";
export const TMP_MT16_METRIC_PROCEDURE_VERSION = "TMP_MT16_METRIC_PROCEDURE_V73_20260702";
export function getMetricProcedure(parsed = {}) {
  return buildProcedure({
    id: "metric_iso_thread_gauge",
    family: "METRIC_ISO",
    engine: "metric_engine",
    state: PROCEDURE_STATES.CERTIFICABLE,
    level: "VERDE",
    standards: ["ISO 68-1", "ISO 724", "ISO 965", "ISO 1502", "ILAC-G8", "ISO 14253"],
    normativeStatus: "VALIDADO_CORE_TMP",
    canCalculateTargets: true,
    canEvaluateReadings: true,
    canEmitCertificate: true,
    measurementMethod: "THREE_WIRES_OR_ROLLERS_TRIMOS",
    measuringEquipment: ["Banco Trimos horizontal certificado"],
    requiredAccessories: ["Rodillo/bola calculado por motor", "Patrón o maestro roscado si aplica"],
    operatorTitle: "Rosca métrica ISO",
    operatorSummary: "Procedimiento completo: ISO 724 para geometría, ISO 965 para tolerancias, ISO 1502 para calibre y Trimos para objetivo.",
    requiredTraceability: ["Banco Trimos certificado", "Rodillos/bolas certificados", "Patrón/maestro de rosca si aplica"],
    uncertaintyModel: "TMP_THREAD_U_MODEL_METRIC_ISO",
    certificateTemplate: "TMP_MT16_CERT_METRIC_ISO",
    steps: buildStepList([COMMON_THREAD_STEPS.certificate])
  });
}
