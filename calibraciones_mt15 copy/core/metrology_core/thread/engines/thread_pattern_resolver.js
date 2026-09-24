/* ===========================================================
   TMP THREAD PATTERN RESOLVER V3 BRIDGE
   -----------------------------------------------------------
   Puente de compatibilidad para MT16.

   Este archivo mantiene las funciones que usa el HTML actual:
   - resolveMT16RealPatterns(...)
   - resolveTrimosBench(...)
   - resolveWireSet(...)
   - resolveThreadMasterPattern(...)

   Pero internamente ya usa:
   thread_traceability_resolver.js

   Sustituir:
   core/metrology_core/thread/engines/thread_pattern_resolver.js
   =========================================================== */

import {
  TMP_THREAD_TRACEABILITY_RESOLVER_VERSION,
  resolveThreadTraceability
} from "./thread_traceability_resolver.js";

export const TMP_THREAD_PATTERN_RESOLVER_VERSION =
  "TMP_THREAD_PATTERN_RESOLVER_V3_BRIDGE_TO_TRACEABILITY_V1_20260625";

export async function resolveMT16RealPatterns(sb, context = {}) {
  const trace = await resolveThreadTraceability(sb, context);

  return {
    ok: trace.ok,
    source: "thread_pattern_resolver_bridge",
    version: TMP_THREAD_PATTERN_RESOLVER_VERSION,
    traceability_version: TMP_THREAD_TRACEABILITY_RESOLVER_VERSION,
    can_emit_certificate: trace.can_emit_certificate,
    can_save: trace.can_save,
    workflow: context.workflow || null,
    view: trace.view,

    trimos: {
      ok: trace.banco?.ok || false,
      type: "TRIMOS_BENCH",
      source: trace.banco?.certificate?.source || "thread_traceability_resolver",
      instrument: trace.banco?.instrument || null,
      certificate: trace.banco?.certificate || null,
      error: trace.banco?.error || null
    },

    wires: {
      ok: trace.rodillos?.ok || false,
      type: "WIRE_SET",
      source: trace.rodillos?.certificate?.source || "thread_traceability_resolver",
      target_wire_mm: trace.rodillos?.target_wire_mm || trace.workflow_summary?.wire_mm || null,
      instrument: trace.rodillos?.instrument || null,
      certificate: trace.rodillos?.certificate || null,
      error: trace.rodillos?.error || null
    },

    pattern: {
      ok: trace.patron?.ok || false,
      type: "THREAD_MASTER_PATTERN",
      source: trace.patron?.certificate?.source || "thread_traceability_resolver",
      instrument: trace.patron?.instrument || null,
      certificate: trace.patron?.certificate || null,
      error: trace.patron?.error || null
    },

    corrections: trace.corrections,
    uncertainty_model: trace.uncertainty_model,
    total_correction_mm: trace.corrections?.total_correction_mm || 0,
    certificate_permission: trace.certificate_permission,
    traceability: trace,
    warnings: trace.warnings || []
  };
}

export async function resolveTrimosBench(sb, context = {}) {
  const trace = await resolveThreadTraceability(sb, context);
  return {
    ok: trace.banco?.ok || false,
    type: "TRIMOS_BENCH",
    instrument: trace.banco?.instrument || null,
    certificate: trace.banco?.certificate || null,
    error: trace.banco?.error || null
  };
}

export async function resolveWireSet(sb, context = {}) {
  const trace = await resolveThreadTraceability(sb, context);
  return {
    ok: trace.rodillos?.ok || false,
    type: "WIRE_SET",
    target_wire_mm: trace.workflow_summary?.wire_mm || null,
    instrument: trace.rodillos?.instrument || null,
    certificate: trace.rodillos?.certificate || null,
    error: trace.rodillos?.error || null
  };
}

export async function resolveThreadMasterPattern(sb, context = {}) {
  const trace = await resolveThreadTraceability(sb, context);
  return {
    ok: trace.patron?.ok || false,
    type: "THREAD_MASTER_PATTERN",
    instrument: trace.patron?.instrument || null,
    certificate: trace.patron?.certificate || null,
    error: trace.patron?.error || null
  };
}

export function buildRealUncertaintyModel(resolved = {}) {
  return resolved.uncertainty_model || {
    source: "THREAD_PATTERN_RESOLVER_BRIDGE_EMPTY",
    status: "NO_TRACEABILITY",
    can_emit_certificate: false,
    warnings: ["No hay trazabilidad resuelta."]
  };
}

export function calculateTotalRealCorrection(realModel = {}) {
  return realModel?.corrections?.total_correction_mm || 0;
}

export default {
  TMP_THREAD_PATTERN_RESOLVER_VERSION,
  resolveMT16RealPatterns,
  resolveTrimosBench,
  resolveWireSet,
  resolveThreadMasterPattern,
  buildRealUncertaintyModel,
  calculateTotalRealCorrection
};
