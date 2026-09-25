/* ===========================================================
   TMP THREAD MT16 WORKFLOW V24
   -----------------------------------------------------------
   Workflow MT16 apoyado en el motor normativo único.

   Archivo opcional:
   core/metrology_core/thread/thread_mt16_workflow_v24.js

   Este archivo NO sustituye al workflow estable todavía.
   Sirve para que podamos migrar MT16 al nuevo motor sin romper V23.
   =========================================================== */

import {
  buildThreadNormativeSheet,
  TMP_THREAD_NORMATIVE_ENGINE_VERSION
} from "./engines/thread_normative_engine.js";

export const TMP_THREAD_MT16_WORKFLOW_V24_VERSION =
  "TMP_THREAD_MT16_WORKFLOW_V24_20260629_NORMATIVE_ENGINE";

export function buildMT16WorkflowV24(equipment = {}) {
  const designation =
    equipment.designation ||
    equipment.rango ||
    equipment.range ||
    equipment.descripcion ||
    "";

  const normative = buildThreadNormativeSheet(designation);

  return {
    ok: normative.ok,
    source: "thread_mt16_workflow_v24",
    version: TMP_THREAD_MT16_WORKFLOW_V24_VERSION,
    normative_engine: TMP_THREAD_NORMATIVE_ENGINE_VERSION,
    status: normative.can_evaluate ? "READY_FOR_BETA_EVALUATION" : "NORMATIVE_DATA_INCOMPLETE",
    can_save: false,
    can_emit_certificate: false,
    input: {
      codigo: equipment.codigo || equipment.code || "",
      descripcion: equipment.descripcion || equipment.description || "",
      rango: equipment.rango || equipment.range || "",
      raw_equipment: equipment
    },
    parsed: normative.parsed,
    geometry: normative.geometry,
    iso965: normative.iso965,
    iso1502: normative.iso1502,
    trimos: normative.trimos,
    normative,
    warnings: normative.warnings || []
  };
}

export default {
  TMP_THREAD_MT16_WORKFLOW_V24_VERSION,
  buildMT16WorkflowV24
};
