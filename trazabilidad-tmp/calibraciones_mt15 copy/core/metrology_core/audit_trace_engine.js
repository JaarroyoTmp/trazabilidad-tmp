/* ===========================================================
   TMP AUDIT TRACE ENGINE V1
   -----------------------------------------------------------
   Genera trazabilidad documental para auditoría.

   Entrada:
   - execution generado por calibration_execution_engine.js

   Salida:
   - informe técnico estructurado:
     normas usadas
     procedimiento aplicado
     patrón seleccionado
     valores de referencia
     incertidumbre
     regla de decisión
     resultado por punto
     decisión global

   Este módulo NO calcula.
   Documenta y ordena evidencias.
   =========================================================== */

import { getNormativeTraceForFamily } from "./normative_registry.js";

export function buildAuditTrace(execution = {}) {
  const family = execution.family || execution.familia || execution.instrumento?.familia_motor;
  const normative = getNormativeTraceForFamily(family);

  const results = execution.results || {};
  const puntos = results.puntos || [];

  return {
    ok: true,
    version: "TMP_AUDIT_TRACE_ENGINE_V1",
    execution_id: execution.execution_id || null,
    fecha: execution.created_at || execution.fecha_calibracion || null,
    operario: execution.operario || null,
    instrumento: {
      id: execution.instrumento?.id || null,
      codigo: execution.instrumento?.codigo || null,
      descripcion: execution.instrumento?.descripcion || execution.instrumento?.nombre || null,
      familia_motor: family || null,
      rango: execution.instrumento?.rango || null,
      resolucion: execution.instrumento?.resolucion || execution.instrumento?.resolucion_equipo || null
    },
    procedimiento: {
      codigo: execution.procedimiento || execution.pauta?.procedimiento || normative.procedimiento_tmp || null,
      descripcion: execution.pauta?.descripcion || null,
      norma_pauta: execution.pauta?.norma || []
    },
    normativa: normative,
    trazabilidad_patrones: buildPatternTrace(execution),
    puntos: puntos.map(buildPointAuditTrace),
    decision_global: buildGlobalDecisionTrace(results.decision_global),
    resumen_auditoria: buildAuditSummary(execution, normative)
  };
}

export function buildPatternTrace(execution = {}) {
  const selections = Object.values(execution.pattern_selections || {});

  return selections.map((s) => ({
    patron_id: s.patron_id,
    codigo: s.codigo,
    descripcion: s.label,
    categoria: s.categoria,
    seleccionado_por: s.seleccionado_por,
    fecha_seleccion: s.fecha_seleccion,
    motivo: s.motivo,
    requirement: s.requirement || null
  }));
}

export function buildPointAuditTrace(pointResult = {}) {
  const ref = pointResult.referencia?.referencia || pointResult.referencia || {};
  const unc = pointResult.incertidumbre || {};
  const decision = pointResult.decision || {};

  return {
    funcion: pointResult.funcion_id,
    punto_id: pointResult.punto_id,
    etiqueta: pointResult.etiqueta,
    nominal_pauta: pointResult.nominal_pauta,
    valor_referencia: pointResult.valor_referencia,
    unidad: pointResult.unidad,
    patron: pointResult.patron_seleccionado || null,
    referencia: {
      tipo: ref.tipo_referencia || null,
      metodo: ref.metodo_referencia || null,
      valor_real: ref.valor_real || pointResult.valor_referencia || null,
      correccion_total_mm: ref.correccion_total_mm || null,
      correccion_total_um: ref.correccion_total_um || null,
      incertidumbre_total_mm: ref.incertidumbre_total_mm || null,
      componentes: ref.componentes || []
    },
    lecturas: {
      valores: pointResult.lecturas || [],
      media: pointResult.media,
      desviacion_tipica: pointResult.s,
      n: pointResult.n
    },
    incertidumbre: {
      uc: unc.uc || null,
      U: unc.U || pointResult.U || null,
      k: unc.k || null,
      unidad: unc.unidad || pointResult.unidad || null,
      componentes: unc.componentes || []
    },
    decision: {
      status: decision.status || decision.decision || null,
      regla_decision: decision.regla_decision || null,
      motivo: decision.motivo || null,
      certificado_texto: decision.certificado_texto || null,
      error: decision.error || pointResult.error || null,
      limites: decision.limites || null,
      intervalo_expandido: decision.intervalo_expandido || null
    }
  };
}

export function buildGlobalDecisionTrace(global = {}) {
  return {
    status: global?.status || global?.decision || null,
    conforme: global?.conforme ?? null,
    regla_global: global?.regla_global || null,
    motivo: global?.motivo || null,
    certificado_texto: global?.certificado_texto || null,
    puntos_totales: global?.puntos_totales || null,
    puntos_aptos: global?.puntos_aptos || null,
    puntos_no_aptos: global?.puntos_no_aptos || null,
    puntos_indeterminados: global?.puntos_indeterminados || null,
    puntos_no_evaluables: global?.puntos_no_evaluables || null
  };
}

export function buildAuditSummary(execution = {}, normative = {}) {
  return {
    texto: [
      "La calibración se ha realizado conforme a la pauta generada por el motor metrológico TMP.",
      "La trazabilidad documental incluye procedimiento aplicado, referencias normativas, patrones utilizados, lecturas registradas, cálculo de incertidumbre y regla de decisión.",
      "Las referencias normativas generales se basan en guías de incertidumbre y reglas de decisión aplicables.",
      normative.procedimiento_tmp ? `Procedimiento TMP aplicado: ${normative.procedimiento_tmp}.` : null
    ].filter(Boolean).join(" "),
    advertencias: [
      ...(normative.warnings || []),
      ...(execution.warnings || [])
    ]
  };
}

export function buildAuditReportText(audit = {}) {
  const lines = [];

  lines.push("INFORME DE TRAZABILIDAD METROLÓGICA Y DECISIÓN");
  lines.push("");
  lines.push(`Ejecución: ${audit.execution_id || "-"}`);
  lines.push(`Instrumento: ${audit.instrumento?.codigo || "-"} - ${audit.instrumento?.descripcion || "-"}`);
  lines.push(`Familia motor: ${audit.instrumento?.familia_motor || "-"}`);
  lines.push(`Procedimiento: ${audit.procedimiento?.codigo || "-"}`);
  lines.push("");

  lines.push("1. Referencias normativas generales");
  for (const r of audit.normativa?.referencias_generales || []) {
    lines.push(`- ${r.codigo}: ${r.uso}`);
  }

  lines.push("");
  lines.push("2. Referencias específicas de familia");
  for (const r of audit.normativa?.referencias_familia || []) {
    lines.push(`- ${r.codigo}: ${r.uso}`);
  }

  lines.push("");
  lines.push("3. Patrones utilizados");
  for (const p of audit.trazabilidad_patrones || []) {
    lines.push(`- ${p.codigo || "-"}: ${p.descripcion || "-"} (${p.categoria || "-"})`);
  }

  lines.push("");
  lines.push("4. Resultados por punto");
  for (const p of audit.puntos || []) {
    lines.push(`- ${p.etiqueta || p.punto_id}: ${p.decision?.status || "-"} | error=${p.decision?.error ?? "-"} | U=${p.incertidumbre?.U ?? "-"}`);
  }

  lines.push("");
  lines.push("5. Decisión global");
  lines.push(`${audit.decision_global?.status || "-"} - ${audit.decision_global?.motivo || ""}`);

  return lines.join("\n");
}
