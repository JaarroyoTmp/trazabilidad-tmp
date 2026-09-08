/* ===========================================================
   TMP CALIBRATION EXECUTION ENGINE V2
   -----------------------------------------------------------
   Director de orquesta del motor metrologico TMP.

   Este modulo une:
   - procedure_builder.js
   - pattern_options_engine.js
   - reference_point_resolver.js
   - uncertainty_engine.js
   - decision_engine.js

   Objetivo:
   Ejecutar una calibracion de principio a fin sin que el operario
   tenga que calcular:
   - pauta
   - puntos
   - patron valido
   - valor referencia
   - media
   - error
   - incertidumbre
   - decision auditoria
   - decision operativa TMP

   V2:
   - Mantiene compatibilidad con V1.
   - Anade resultado_auditoria.
   - Anade resultado_operativo.
   - Anade conforme_auditoria.
   - Anade conforme_operativo.
   - Prepara payload Supabase con doble resultado.
   =========================================================== */

import { buildProcedure } from "./procedure_builder.js";

import {
  attachPatternOptionsToProcedure,
  selectPatternOption
} from "./pattern_options_engine.js";

import {
  resolveProcedurePoint
} from "./reference_point_resolver.js";

import {
  calculateUncertainty,
  mean,
  sampleStd,
  parseNum,
  roundTo
} from "./uncertainty_engine.js";

import {
  decidePoint,
  decideGlobal
} from "./decision_engine.js";

export const EXECUTION_STATUS = {
  DRAFT: "DRAFT",
  WAITING_PATTERN_SELECTION: "WAITING_PATTERN_SELECTION",
  WAITING_READINGS: "WAITING_READINGS",
  CALCULATED: "CALCULATED",
  READY_TO_SAVE: "READY_TO_SAVE",
  ERROR: "ERROR"
};

export function nowISO() {
  return new Date().toISOString();
}

export function makeExecutionId() {
  return `TMP-CAL-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function normalizeFamily(value) {
  return String(value || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s\-]+/g, "_")
    .trim();
}

/* ===========================================================
   1. Crear ejecucion inicial
   =========================================================== */

export async function createCalibrationExecution(supabase, input = {}, options = {}) {
  const instrumento = input.instrumento || input.equipo;

  if (!instrumento) {
    return {
      ok: false,
      status: EXECUTION_STATUS.ERROR,
      error: "SIN_INSTRUMENTO",
      message: "No se ha indicado instrumento/equipo."
    };
  }

  const family = normalizeFamily(
    input.family ||
    input.familia ||
    instrumento.familia_motor ||
    instrumento.familia
  );

  const procedure = buildProcedure({
    ...input,
    instrumento,
    family,
    familia: family
  });

  let procedureWithOptions = procedure;

  if (supabase && options.attachPatternOptions !== false) {
    procedureWithOptions = await attachPatternOptionsToProcedure(
      supabase,
      procedure,
      options.patternOptions || {}
    );
  }

  return {
    ok: true,
    execution_id: input.execution_id || makeExecutionId(),
    status: EXECUTION_STATUS.WAITING_PATTERN_SELECTION,
    created_at: nowISO(),
    updated_at: nowISO(),
    instrumento,
    family,
    operario: input.operario || null,
    procedimiento: procedureWithOptions.procedimiento,
    norma: procedureWithOptions.norma || [],
    pauta: procedureWithOptions,
    pattern_selections: {},
    readings: {},
    results: null,
    warnings: procedureWithOptions.warnings || []
  };
}

/* ===========================================================
   2. Seleccion de patron por operario
   =========================================================== */

export function makePointKey(funcionId, puntoId) {
  return `${funcionId}::${puntoId}`;
}

export function getPointFromExecution(execution = {}, funcionId, puntoId) {
  for (const funcion of execution.pauta?.funciones || []) {
    if (funcion.id !== funcionId) continue;

    for (const punto of funcion.puntos || []) {
      if (punto.id === puntoId) {
        return { funcion, punto };
      }
    }
  }

  return null;
}

/**
 * Selecciona un patron para un punto concreto.
 * selectedPatronId debe venir de las opciones validas.
 */
export function selectPatternForExecutionPoint(
  execution = {},
  funcionId,
  puntoId,
  selectedPatronId,
  meta = {}
) {
  const found = getPointFromExecution(execution, funcionId, puntoId);

  if (!found) {
    return {
      ...execution,
      ok: false,
      status: EXECUTION_STATUS.ERROR,
      error: "PUNTO_NO_ENCONTRADO"
    };
  }

  const optionsResult = found.punto.pattern_options;

  if (!optionsResult) {
    return {
      ...execution,
      ok: false,
      status: EXECUTION_STATUS.ERROR,
      error: "PUNTO_SIN_OPCIONES_PATRON"
    };
  }

  const selection = selectPatternOption(optionsResult, selectedPatronId, meta);

  if (!selection.ok) {
    return {
      ...execution,
      ok: false,
      status: EXECUTION_STATUS.ERROR,
      error: selection.error,
      message: selection.message
    };
  }

  const key = makePointKey(funcionId, puntoId);

  return {
    ...execution,
    ok: true,
    updated_at: nowISO(),
    pattern_selections: {
      ...(execution.pattern_selections || {}),
      [key]: selection.seleccion
    }
  };
}

/**
 * Seleccion masiva:
 * selecciona automaticamente la primera opcion valida solo para pruebas.
 * En produccion, el operario debe elegir.
 */
export function autoSelectFirstValidPatternsForTest(execution = {}, meta = {}) {
  let next = {
    ...execution,
    pattern_selections: {
      ...(execution.pattern_selections || {})
    }
  };

  for (const funcion of execution.pauta?.funciones || []) {
    for (const punto of funcion.puntos || []) {
      const first = punto.pattern_options?.options?.[0];
      if (!first) continue;

      const key = makePointKey(funcion.id, punto.id);

      next.pattern_selections[key] = {
        patron_id: first.patron_id,
        codigo: first.codigo,
        label: first.label,
        categoria: first.categoria,
        seleccionado_por: meta.operario || meta.usuario || "AUTO_TEST",
        fecha_seleccion: meta.fecha || nowISO(),
        motivo: meta.motivo || "Auto seleccion de prueba. En produccion debe seleccionar el operario.",
        requirement: punto.pattern_options.requirement
      };
    }
  }

  return {
    ...next,
    updated_at: nowISO()
  };
}

/* ===========================================================
   3. Introducir lecturas
   =========================================================== */

export function setPointReadings(execution = {}, funcionId, puntoId, lecturas = [], meta = {}) {
  const found = getPointFromExecution(execution, funcionId, puntoId);

  if (!found) {
    return {
      ...execution,
      ok: false,
      status: EXECUTION_STATUS.ERROR,
      error: "PUNTO_NO_ENCONTRADO"
    };
  }

  const expected = found.punto.repeticiones || 5;
  const nums = lecturas.map((v) => parseNum(v, NaN)).filter(Number.isFinite);

  const warnings = [];

  if (nums.length !== expected) {
    warnings.push(`Se esperaban ${expected} lecturas y se recibieron ${nums.length}.`);
  }

  const key = makePointKey(funcionId, puntoId);

  return {
    ...execution,
    ok: true,
    status: EXECUTION_STATUS.WAITING_READINGS,
    updated_at: nowISO(),
    readings: {
      ...(execution.readings || {}),
      [key]: {
        funcion_id: funcionId,
        punto_id: puntoId,
        lecturas: nums,
        media: roundTo(mean(nums), 9),
        s: roundTo(sampleStd(nums), 9),
        n: nums.length,
        registrado_por: meta.operario || meta.usuario || execution.operario || null,
        fecha_registro: meta.fecha || nowISO(),
        warnings
      }
    },
    warnings: [...(execution.warnings || []), ...warnings]
  };
}

export function hasAllRequiredPatternSelections(execution = {}) {
  for (const funcion of execution.pauta?.funciones || []) {
    for (const punto of funcion.puntos || []) {
      const key = makePointKey(funcion.id, punto.id);
      if (!execution.pattern_selections?.[key]) return false;
    }
  }

  return true;
}

export function hasAllRequiredReadings(execution = {}) {
  for (const funcion of execution.pauta?.funciones || []) {
    for (const punto of funcion.puntos || []) {
      const key = makePointKey(funcion.id, punto.id);
      const r = execution.readings?.[key];

      if (!r || !Array.isArray(r.lecturas) || !r.lecturas.length) return false;
    }
  }

  return true;
}

/* ===========================================================
   4. Resolver referencia usando patron seleccionado
   =========================================================== */

export async function resolveSelectedReferenceForPoint(
  supabase,
  execution = {},
  funcion = {},
  punto = {},
  options = {}
) {
  const key = makePointKey(funcion.id, punto.id);
  const selection = execution.pattern_selections?.[key];

  if (!selection) {
    return {
      ok: false,
      error: "SIN_PATRON_SELECCIONADO",
      message: "El punto no tiene patrón seleccionado."
    };
  }

  const selectedCandidate =
    selection.selected_pattern?.raw ||
    selection.raw ||
    {
      patron_id: selection.patron_id,
      id: selection.patron_id,
      codigo: selection.codigo,
      descripcion: selection.label,
      tipo_patron: punto.patron_tipo || funcion.patron_tipo,
      activo: true,
      fecha_vencimiento: selection.fecha_vencimiento
    };

  const resolved = await resolveProcedurePoint(
    supabase,
    {
      procedure: execution.pauta,
      funcion,
      punto
    },
    {
      ...options,
      candidates: [selectedCandidate],
      patron_id: selection.patron_id
    }
  );

  return resolved;
}

/* ===========================================================
   5. Calcular punto
   =========================================================== */

export async function calculateExecutionPoint(
  supabase,
  execution = {},
  funcion = {},
  punto = {},
  options = {}
) {
  const key = makePointKey(funcion.id, punto.id);
  const reading = execution.readings?.[key];

  if (!reading) {
    return {
      ok: false,
      error: "SIN_LECTURAS",
      funcion_id: funcion.id,
      punto_id: punto.id
    };
  }

  const resolvedPoint = await resolveSelectedReferenceForPoint(
    supabase,
    execution,
    funcion,
    punto,
    options.reference || {}
  );

  if (!resolvedPoint.ok && !resolvedPoint.referencia?.ok) {
    return {
      ok: false,
      error: "REFERENCIA_NO_RESUELTA",
      funcion_id: funcion.id,
      punto_id: punto.id,
      resolvedPoint
    };
  }

  const referencia = resolvedPoint.referencia || {};

  const valorReferencia = parseNum(
    resolvedPoint.valor_referencia_esperado ??
    referencia.valor_real ??
    punto.nominal
  );

  const media = parseNum(reading.media);
  const error = media - valorReferencia;

  const uncertainty = calculateUncertainty({
    family: execution.family,
    familia: execution.family,
    nominal: punto.nominal,
    lecturas: reading.lecturas,
    resolucion:
      execution.instrumento?.resolucion_equipo ??
      execution.instrumento?.resolucion ??
      options.resolucion,
    unidad: punto.unidad || "mm",
    patron: {
      incertidumbre:
        referencia.incertidumbre_total_mm ??
        resolvedPoint.incertidumbre_referencia ??
        0,
      incertidumbre_unidad: "mm",
      k: referencia.k || 2
    },
    temperatura: options.temperatura || null,
    componentes_extra: options.componentes_extra || []
  });

  const U = uncertainty.U;

  const decision = decidePoint({
    id: punto.id,
    etiqueta: punto.etiqueta,
    funcion: funcion.id,
    nominal: valorReferencia,
    valor_medido: media,
    media,
    media_corregida: media,
    error,
    tolerancia: punto.tolerancia ?? punto.tolerancia_abs ?? options.tolerancia,
    tolerancia_abs: punto.tolerancia_abs ?? punto.tolerancia ?? options.tolerancia,
    tolerancia_min: punto.tolerancia_min,
    tolerancia_max: punto.tolerancia_max,
    limite_inferior: punto.limite_inferior ?? punto.li,
    limite_superior: punto.limite_superior ?? punto.ls,
    U,
    regla_decision: punto.regla_decision || options.regla_decision || "ILAC-G8"
  });

  return {
    ok: true,

    funcion_id: funcion.id,
    funcion_nombre: funcion.nombre,

    punto_id: punto.id,
    etiqueta: punto.etiqueta,

    nominal_pauta: punto.nominal,
    valor_referencia: valorReferencia,
    unidad: punto.unidad || "mm",

    lecturas: reading.lecturas,
    media,
    s: reading.s,
    n: reading.n,

    error: roundTo(error, 9),

    referencia: resolvedPoint,
    incertidumbre: uncertainty,
    U,

    decision,

    resultado_auditoria: decision.resultado_auditoria || decision.status,
    resultado_operativo: decision.resultado_operativo || decision.status,

    conforme_auditoria: decision.conforme,
    conforme_operativo: decision.conforme_operativo,

    patron_seleccionado: execution.pattern_selections?.[key] || null
  };
}

/* ===========================================================
   6. Calcular calibracion completa
   =========================================================== */

export async function calculateExecution(supabase, execution = {}, options = {}) {
  const pointResults = [];
  const errors = [];

  for (const funcion of execution.pauta?.funciones || []) {
    for (const punto of funcion.puntos || []) {
      const result = await calculateExecutionPoint(
        supabase,
        execution,
        funcion,
        punto,
        options
      );

      if (result.ok) {
        pointResults.push(result);
      } else {
        errors.push(result);
      }
    }
  }

  const decisions = pointResults.map((r) => ({
    id: r.punto_id,
    etiqueta: r.etiqueta,

    status: r.decision.status,
    decision: r.decision.decision,

    resultado_auditoria:
      r.decision.resultado_auditoria ||
      r.decision.status,

    decision_auditoria:
      r.decision.decision_auditoria ||
      r.decision.status,

    resultado_operativo:
      r.decision.resultado_operativo ||
      r.decision.status,

    decision_operativa:
      r.decision.decision_operativa ||
      r.decision.resultado_operativo ||
      r.decision.status,

    conforme:
      r.decision.conforme,

    conforme_auditoria:
      r.decision.conforme,

    conforme_operativo:
      r.decision.conforme_operativo,

    reason: r.decision.reason,
    motivo: r.decision.motivo,

    motivo_operativo:
      r.decision.motivo_operativo || null,

    raw: r.decision
  }));

  const global = decideGlobal({
    family: execution.family,
    familia: execution.family,
    regla_global: execution.pauta?.regla_global,
    decisions
  });

  const finalExecution = {
    ...execution,
    ok: errors.length === 0,
    status: errors.length ? EXECUTION_STATUS.ERROR : EXECUTION_STATUS.CALCULATED,
    updated_at: nowISO(),

    results: {
      calculated_at: nowISO(),

      puntos: pointResults,
      errors,

      decision_global: global,

      status: global.status,
      decision: global.status,

      resultado_auditoria:
        global.resultado_auditoria ||
        global.status,

      decision_auditoria:
        global.decision_auditoria ||
        global.resultado_auditoria ||
        global.status,

      resultado_operativo:
        global.resultado_operativo ||
        global.status,

      decision_operativa:
        global.decision_operativa ||
        global.resultado_operativo ||
        global.status,

      conforme:
        global.conforme,

      conforme_auditoria:
        global.conforme,

      conforme_operativo:
        global.conforme_operativo,

      motivo_auditoria:
        global.motivo || "",

      motivo_operativo:
        global.motivo_operativo || "",

      resumen: {
        total_puntos: pointResults.length,
        errores: errors.length,

        aptos: global.puntos_aptos,
        no_aptos: global.puntos_no_aptos,
        indeterminados: global.puntos_indeterminados,
        no_evaluables: global.puntos_no_evaluables,

        operativos_aptos: global.puntos_operativos_aptos,
        operativos_no_aptos: global.puntos_operativos_no_aptos,
        operativos_no_evaluables: global.puntos_operativos_no_evaluables
      }
    }
  };

  return finalExecution;
}

/* ===========================================================
   7. Preparar payload para Supabase
   =========================================================== */

export function buildSupabasePayload(execution = {}) {
  const results = execution.results || {};
  const global = results.decision_global || {};

  const resultadoAuditoria =
    global.resultado_auditoria ||
    results.resultado_auditoria ||
    global.status ||
    null;

  const resultadoOperativo =
    global.resultado_operativo ||
    results.resultado_operativo ||
    global.status ||
    null;

  const conformeAuditoria =
    global.conforme ??
    results.conforme_auditoria ??
    null;

  const conformeOperativo =
    global.conforme_operativo ??
    results.conforme_operativo ??
    null;

  const calibracion = {
    instrumento_id: execution.instrumento?.id || null,
    procedimiento_id: null,
    codigo: execution.execution_id,
    fecha_calibracion: execution.created_at,

    resultado: resultadoOperativo,
    resultado_auditoria: resultadoAuditoria,
    resultado_operativo: resultadoOperativo,

    conforme: conformeOperativo,
    conforme_auditoria: conformeAuditoria,
    conforme_operativo: conformeOperativo,

    estado_final: resultadoOperativo,

    observaciones:
      global.motivo_operativo ||
      global.motivo ||
      "",

    observaciones_auditoria:
      global.motivo ||
      "",

    observaciones_operativo:
      global.motivo_operativo ||
      "",

    operador: execution.operario || "",
    incertidumbre: null,
    patrones_usados: collectUsedPatternCodes(execution)
  };

  const puntos = (results.puntos || []).map((p, index) => {
    const decision = p.decision || {};

    return {
      punto_ordinal: index + 1,
      nominal: p.nominal_pauta,
      unidad: p.unidad,
      media: p.media,
      error: p.error,

      tolerancia_min: decision?.limites?.li ?? null,
      tolerancia_max: decision?.limites?.ls ?? null,

      conforme:
        decision.resultado_operativo === "APTO" ||
        decision.status === "APTO",

      resultado_auditoria:
        decision.resultado_auditoria ||
        decision.status ||
        null,

      resultado_operativo:
        decision.resultado_operativo ||
        decision.status ||
        null,

      conforme_auditoria:
        decision.conforme ?? null,

      conforme_operativo:
        decision.conforme_operativo ?? null,

      extras: {
        funcion: p.funcion_id,
        etiqueta: p.etiqueta,
        valor_referencia: p.valor_referencia,
        U: p.U,

        decision,
        resultado_auditoria:
          decision.resultado_auditoria ||
          decision.status ||
          null,

        resultado_operativo:
          decision.resultado_operativo ||
          decision.status ||
          null,

        incertidumbre: p.incertidumbre,
        patron: p.patron_seleccionado
      }
    };
  });

  const lecturas = [];

  (results.puntos || []).forEach((p, pointIndex) => {
    (p.lecturas || []).forEach((valor, idx) => {
      lecturas.push({
        punto_index: pointIndex,
        lectura_ordinal: idx + 1,
        valor
      });
    });
  });

  const patrones = Object.values(execution.pattern_selections || {}).map((s) => ({
    patron_id: s.patron_id,
    factor_aplicacion: s.motivo || "Seleccionado por operario"
  }));

  return {
    calibracion,
    puntos,
    lecturas,
    patrones,
    raw_execution: execution
  };
}

export function collectUsedPatternCodes(execution = {}) {
  const codes = [];

  for (const s of Object.values(execution.pattern_selections || {})) {
    if (s.codigo) codes.push(s.codigo);
  }

  return [...new Set(codes)];
}

/* ===========================================================
   8. Flujo de prueba completo
   =========================================================== */

export async function runTestExecutionFlow(supabase, input = {}, options = {}) {
  let execution = await createCalibrationExecution(supabase, input, options);

  if (!execution.ok) return execution;

  execution = autoSelectFirstValidPatternsForTest(execution, {
    operario: input.operario || "AUTO_TEST"
  });

  for (const funcion of execution.pauta?.funciones || []) {
    for (const punto of funcion.puntos || []) {
      const ref = parseNum(punto.nominal);

      const simulated = [
        ref,
        ref + 0.001,
        ref,
        ref - 0.001,
        ref
      ];

      execution = setPointReadings(
        execution,
        funcion.id,
        punto.id,
        simulated,
        {
          operario: input.operario || "AUTO_TEST"
        }
      );
    }
  }

  execution = await calculateExecution(
    supabase,
    execution,
    options.calculation || {}
  );

  return {
    ...execution,
    payload: buildSupabasePayload(execution)
  };
}