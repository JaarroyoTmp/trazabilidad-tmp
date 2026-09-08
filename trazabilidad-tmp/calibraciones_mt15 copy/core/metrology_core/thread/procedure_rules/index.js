/* TMP MT16 EXPERT CORE V73 - procedure_rules/index.js */
import { getMetricProcedure } from "./metric.js";
import { getBsppProcedure, getBsptProcedure } from "./pipe_threads.js";
import { getUnifiedProcedure } from "./unified.js";
import { getNptProcedure } from "./npt.js";
import { getWhitworthProcedure } from "./whitworth.js";
import { buildProcedure, PROCEDURE_STATES } from "./shared.js";

export const TMP_MT16_PROCEDURE_ROUTER_VERSION = "TMP_MT16_PROCEDURE_ROUTER_V73_20260702";

export function getThreadProcedure(parsed = {}) {
  if (!parsed?.ok) {
    return buildProcedure({
      id: "not_identified",
      family: "NO_IDENTIFICADA",
      engine: "no_route",
      state: PROCEDURE_STATES.NO_IDENTIFICADA,
      level: "ROJO",
      standards: [],
      canCalculateGeometry: false,
      canSelectWire: false,
      operatorTitle: "Rosca no identificada",
      operatorSummary: "No se ha podido interpretar la designación. Revisar rango/descripción del instrumento en Supabase.",
      measurementMethod: "NO_APLICA",
      blocksCertificateReason: "No se emite certificado porque la designación no ha sido interpretada por el parser."
    });
  }
  switch (parsed.thread_system) {
    case "METRIC_ISO": return getMetricProcedure(parsed);
    case "BSPP_ISO228": return getBsppProcedure(parsed);
    case "BSPT_ISO7": return getBsptProcedure(parsed);
    case "UN_ASME_B1_1": return getUnifiedProcedure(parsed);
    case "NPT_ASME_B1_20": return getNptProcedure(parsed);
    case "BSW_BS84": return getWhitworthProcedure(parsed);
    default:
      return buildProcedure({
        id: "generic_safe_geometry",
        family: parsed.thread_system || parsed.family || "UNKNOWN",
        engine: "generic_geometry_engine",
        state: PROCEDURE_STATES.OPERATIVO_SEGURO,
        level: "AMARILLO",
        standards: [parsed.standard_hint || "Norma pendiente"],
        canCalculateTargets: false,
        canEvaluateReadings: false,
        canEmitCertificate: false,
        operatorTitle: "Rosca en modo geométrico seguro",
        operatorSummary: "Familia identificada parcialmente. Se permite geometría/rodillo si hay datos suficientes, pero no certificado final.",
        measurementMethod: "GEOMETRY_ONLY",
        blocksCertificateReason: "Certificado bloqueado hasta crear procedimiento normativo de esta familia."
      });
  }
}
