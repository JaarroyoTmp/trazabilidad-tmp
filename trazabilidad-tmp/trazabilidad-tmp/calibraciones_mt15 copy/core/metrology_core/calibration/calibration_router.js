/* ===========================================================
   TMP CALIBRATION ROUTER V2
   -----------------------------------------------------------
   Router único para calibración guiada.

   Objetivo:
   - Una sola pantalla de calibración.
   - Un solo flujo de búsqueda/selección/guardado/histórico/PDF.
   - Motores metrológicos separados por familia.

   Estado:
   - MT15 operativo.
   - MT16 en beta técnica/normativa.
   - MT17+ pendientes.
   =========================================================== */

import {
  classifyEquipment,
  TMP_EQUIPMENT_FAMILIES
} from "./equipment_classifier.js";

export const TMP_CALIBRATION_ROUTER_VERSION = "TMP_CALIBRATION_ROUTER_V2";

export const TMP_PROCEDURE_STATUS = {
  OPERATIVO: "OPERATIVO",
  BETA_OPERATIVA: "BETA_OPERATIVA",
  EN_DESARROLLO_NORMATIVO: "EN_DESARROLLO_NORMATIVO",
  PENDIENTE: "PENDIENTE",
  BLOQUEADO: "BLOQUEADO"
};

export const TMP_PROCEDURES = {
  MT15: {
    code: "MT15",
    name: "Tampón liso P/NP",
    family: TMP_EQUIPMENT_FAMILIES.TAMPON_LISO_PNP,
    status: TMP_PROCEDURE_STATUS.OPERATIVO,
    engine_group: "plain_limit_gauge",
    can_save: true,
    can_emit_certificate: false,
    modules: [
      "plain_limit_gauge_engine.js",
      "calibration_execution_engine.js",
      "calibration_save_helper.js"
    ],
    warnings: [
      "Pendiente recuperar generación y guardado automático de PDF en Supabase."
    ]
  },

  MT16: {
    code: "MT16",
    name: "Tampón roscado P/NP",
    family: TMP_EQUIPMENT_FAMILIES.TAMPON_ROSCADO_PNP,
    status: TMP_PROCEDURE_STATUS.BETA_OPERATIVA,
    engine_group: "thread",
    can_save: false,
    can_emit_certificate: false,
    modules: [
      "thread_parser_engine.js",
      "thread_geometry_engine.js",
      "thread_iso724_database.js",
      "thread_iso965_database.js",
      "thread_iso1502_database.js",
      "thread_wire_database.js",
      "thread_trimos_engine.js",
      "thread_gauge_limits_engine.js",
      "thread_decision_engine.js"
    ],
    warnings: [
      "MT16 puede abrirse en modo beta técnica.",
      "No debe emitir decisión final ni certificado hasta completar ISO965/ISO1502 y validación.",
      "El operario no debe elegir rodillo: el motor debe calcularlo automáticamente."
    ]
  },

  MT17: {
    code: "MT17",
    name: "Reloj comparador",
    family: TMP_EQUIPMENT_FAMILIES.RELOJ_COMPARADOR,
    status: TMP_PROCEDURE_STATUS.PENDIENTE,
    engine_group: "dial_indicator",
    can_save: false,
    can_emit_certificate: false,
    modules: [],
    warnings: [
      "MT17 pendiente de desarrollo."
    ]
  },

  MT18: {
    code: "MT18",
    name: "Micrómetro exterior",
    family: TMP_EQUIPMENT_FAMILIES.MICROMETRO_EXTERIOR,
    status: TMP_PROCEDURE_STATUS.PENDIENTE,
    engine_group: "external_micrometer",
    can_save: false,
    can_emit_certificate: false,
    modules: [],
    warnings: [
      "MT18 pendiente de desarrollo."
    ]
  },

  MT19: {
    code: "MT19",
    name: "Micrómetro interior",
    family: TMP_EQUIPMENT_FAMILIES.MICROMETRO_INTERIOR,
    status: TMP_PROCEDURE_STATUS.PENDIENTE,
    engine_group: "internal_micrometer",
    can_save: false,
    can_emit_certificate: false,
    modules: [],
    warnings: [
      "MT19 pendiente de desarrollo."
    ]
  },

  MT20: {
    code: "MT20",
    name: "Pie de rey",
    family: TMP_EQUIPMENT_FAMILIES.PIE_DE_REY,
    status: TMP_PROCEDURE_STATUS.PENDIENTE,
    engine_group: "caliper",
    can_save: false,
    can_emit_certificate: false,
    modules: [],
    warnings: [
      "MT20 pendiente de desarrollo."
    ]
  },

  MT21: {
    code: "MT21",
    name: "Alexómetro",
    family: TMP_EQUIPMENT_FAMILIES.ALEXOMETRO,
    status: TMP_PROCEDURE_STATUS.PENDIENTE,
    engine_group: "bore_gauge",
    can_save: false,
    can_emit_certificate: false,
    modules: [],
    warnings: [
      "MT21 pendiente de desarrollo."
    ]
  }
};

export function resolveProcedureByFamily(family) {
  for (const proc of Object.values(TMP_PROCEDURES)) {
    if (proc.family === family) return proc;
  }

  return null;
}

export function resolveCalibrationProcedure(equipo = {}) {
  const classification = classifyEquipment(equipo);
  const procedure = resolveProcedureByFamily(classification.family);

  if (!procedure) {
    return {
      ok: false,
      source: "calibration_router",
      version: TMP_CALIBRATION_ROUTER_VERSION,
      classification,
      error: "PROCEDIMIENTO_NO_ENCONTRADO",
      message:
        "No existe procedimiento de calibración asociado a esta familia. Revisar alta del equipo o crear motor correspondiente."
    };
  }

  return {
    ok: true,
    source: "calibration_router",
    version: TMP_CALIBRATION_ROUTER_VERSION,
    classification,
    procedure,
    route: {
      procedure_code: procedure.code,
      procedure_name: procedure.name,
      engine_group: procedure.engine_group,
      status: procedure.status,
      can_save: procedure.can_save,
      can_emit_certificate: procedure.can_emit_certificate,
      modules: procedure.modules
    },
    warnings: [
      ...(classification.warnings || []),
      ...(procedure.warnings || [])
    ]
  };
}

export function canStartCalibration(routeResult = {}) {
  if (!routeResult?.ok) {
    return {
      ok: false,
      reason: "ROUTE_INVALIDA",
      message: "No se puede iniciar calibración sin ruta válida."
    };
  }

  const proc = routeResult.procedure;

  if (!proc) {
    return {
      ok: false,
      reason: "PROCEDIMIENTO_NO_RESUELTO",
      message: "No se ha resuelto ningún procedimiento."
    };
  }

  if (proc.status === TMP_PROCEDURE_STATUS.BLOQUEADO) {
    return {
      ok: false,
      reason: "PROCEDIMIENTO_BLOQUEADO",
      message: `El procedimiento ${proc.code} está bloqueado.`
    };
  }

  if (proc.status === TMP_PROCEDURE_STATUS.PENDIENTE) {
    return {
      ok: false,
      reason: "PROCEDIMIENTO_PENDIENTE",
      message: `El procedimiento ${proc.code} está pendiente de desarrollo.`
    };
  }

  if (proc.status === TMP_PROCEDURE_STATUS.EN_DESARROLLO_NORMATIVO) {
    return {
      ok: true,
      reason: "PROCEDIMIENTO_EN_DESARROLLO",
      message:
        "Se puede abrir en modo prueba/desarrollo, pero no emitir decisión final hasta completar norma."
    };
  }

  if (proc.status === TMP_PROCEDURE_STATUS.BETA_OPERATIVA) {
    return {
      ok: true,
      reason: "PROCEDIMIENTO_BETA",
      message:
        "Se puede abrir en modo beta técnica. No emitir certificado final hasta validación normativa completa."
    };
  }

  if (proc.status === TMP_PROCEDURE_STATUS.OPERATIVO) {
    return {
      ok: true,
      reason: "PROCEDIMIENTO_OPERATIVO",
      message: "Procedimiento operativo."
    };
  }

  return {
    ok: false,
    reason: "ESTADO_DESCONOCIDO",
    message: `Estado de procedimiento no reconocido: ${proc.status}`
  };
}

export function canSaveCalibration(routeResult = {}) {
  if (!routeResult?.ok) {
    return {
      ok: false,
      reason: "ROUTE_INVALIDA",
      message: "No se puede guardar sin ruta válida."
    };
  }

  const proc = routeResult.procedure;

  if (!proc?.can_save) {
    return {
      ok: false,
      reason: "GUARDADO_NO_AUTORIZADO",
      message: `El procedimiento ${proc?.code || "-"} no tiene guardado habilitado.`
    };
  }

  return {
    ok: true,
    reason: "GUARDADO_AUTORIZADO",
    message: "Guardado permitido."
  };
}

export function canEmitCertificate(routeResult = {}) {
  if (!routeResult?.ok) {
    return {
      ok: false,
      reason: "ROUTE_INVALIDA",
      message: "No se puede emitir certificado sin ruta válida."
    };
  }

  const proc = routeResult.procedure;

  if (!proc?.can_emit_certificate) {
    return {
      ok: false,
      reason: "CERTIFICADO_NO_AUTORIZADO",
      message: `El procedimiento ${proc?.code || "-"} no tiene emisión de certificado habilitada.`
    };
  }

  return {
    ok: true,
    reason: "CERTIFICADO_AUTORIZADO",
    message: "Emisión de certificado permitida."
  };
}

export function listCalibrationProcedures() {
  return Object.values(TMP_PROCEDURES).map((proc) => ({
    code: proc.code,
    name: proc.name,
    family: proc.family,
    status: proc.status,
    engine_group: proc.engine_group,
    can_save: proc.can_save,
    can_emit_certificate: proc.can_emit_certificate,
    modules: proc.modules
  }));
}