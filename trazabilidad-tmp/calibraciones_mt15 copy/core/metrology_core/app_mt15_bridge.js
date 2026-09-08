/* ===========================================================
   TMP APP MT15 BRIDGE V1
   -----------------------------------------------------------
   Puente entre app.js actual y el motor metrologico TMP/MT15.

   Objetivo:
   - NO reescribir app.js.
   - Reutilizar state.plan, state.mediciones, state.instrumento.
   - Sustituir progresivamente cálculo manual por:
     uncertainty_engine.js
     decision_engine.js
     family_resolver.js
     normative_registry.js
     metrology_rules_repository.js

   Este bridge está pensado para integrarse poco a poco.
   =========================================================== */

import { resolveFamilyFromInstrument } from "./metrology_core/family_resolver.js";

import {
  calculateUncertainty,
  mean,
  sampleStd,
  parseNum,
  roundTo
} from "./metrology_core/uncertainty_engine.js";

import {
  decidePoint,
  decideGlobal
} from "./metrology_core/decision_engine.js";

import {
  getNormativeTraceForFamily
} from "./metrology_core/normative_registry.js";

import {
  getAuditRequirements
} from "./metrology_core/metrology_rules_repository.js";

/* ===========================================================
   Utilidades
   =========================================================== */

export function calcularDecisionTMPPoint(input = {}) {
  const familia = input.familia || input.family || "DESCONOCIDO";

  const lecturas = input.lecturas || [];
  const media = lecturas.length ? mean(lecturas) : parseNum(input.media);

  const valorReferencia = parseNum(
    input.valor_referencia ??
    input.referencia ??
    input.nominal ??
    0
  );

  const error = media - valorReferencia;

  const incertidumbre = calculateUncertainty({
    family: familia,
    familia,
    nominal: valorReferencia,
    lecturas,
    resolucion: input.resolucion,
    unidad: input.unidad || "mm",
    patron: {
      incertidumbre: input.u_patron ?? input.incertidumbre_patron ?? 0,
      incertidumbre_unidad: input.u_patron_unidad || "mm",
      k: input.k_patron || 2
    },
    k: input.k || 2
  });

  const decision = decidePoint({
    id: input.id,
    etiqueta: input.etiqueta,
    nominal: valorReferencia,
    valor_medido: media,
    error,
    tolerancia: input.tolerancia,
    tolerancia_abs: input.tolerancia_abs,
    tolerancia_min: input.tolerancia_min,
    tolerancia_max: input.tolerancia_max,
    U: incertidumbre.U,
    regla_decision: input.regla_decision || "ERROR_ABSOLUTO_ILAC_G8"
  });

  return {
    ok: true,
    familia,
    nominal: valorReferencia,
    valor_referencia: valorReferencia,
    media: roundTo(media, 9),
    s: roundTo(sampleStd(lecturas), 9),
    n: lecturas.length,
    error: roundTo(error, 9),
    error_um: roundTo(error * 1000, 6),
    incertidumbre,
    U: incertidumbre.U,
    U_um: roundTo(incertidumbre.U * 1000, 6),
    decision
  };
}

/* ===========================================================
   Convertir state actual de app.js a resultados motor
   =========================================================== */

export function calcularResultadosDesdeStateTMP(state = {}, domValues = {}) {
  const instrumento = state.instrumento || {};
  const familyResolved = resolveFamilyFromInstrument(instrumento);
  const familia = familyResolved.family;

  const normativa = getNormativeTraceForFamily(familia);
  const auditoriaReq = getAuditRequirements(familia);

  const plan = state.plan || [];
  const mediciones = state.mediciones || {};

  const tolMm = parseNum(domValues.tolGlobalMm ?? domValues.tolerancia ?? 0);
  const uBaseMm = parseNum(domValues.uBaseMm ?? domValues.uBase ?? 0);
  const reglaDecision = domValues.regla_decision || "ERROR_ABSOLUTO_ILAC_G8";

  const puntos = [];
  const bloques = [];

  for (const bloque of plan) {
    const puntosBloque = [];

    for (const punto of bloque.puntos || []) {
      const key = `${bloque.id}|${punto.id}`;
      const med = mediciones[key] || {};
      const lecturas = Array.isArray(med.r)
        ? med.r.filter((v) => v !== null && v !== "" && Number.isFinite(Number(v))).map(Number)
        : [];

      const valorReferencia = parseNum(
        punto.valor_referencia ??
        punto.valor_nominal ??
        punto.nominal ??
        0
      );

      const uPatron = parseNum(
        punto.u_k2 ??
        punto.u_patron ??
        bloque.patron?.u_k2 ??
        uBaseMm
      );

      const resultado = calcularDecisionTMPPoint({
        id: punto.id,
        etiqueta: `${bloque.tipo || ""} ${punto.valor_nominal ?? punto.nominal ?? ""}`.trim(),
        familia,
        nominal: valorReferencia,
        valor_referencia: valorReferencia,
        lecturas,
        resolucion: instrumento.resolucion_equipo ?? instrumento.resolucion ?? 0,
        unidad: instrumento.unidad_base || punto.unidad || "mm",
        u_patron: uPatron,
        u_patron_unidad: "mm",
        tolerancia_abs: tolMm,
        regla_decision: reglaDecision
      });

      const puntoResultado = {
        bloque_id: bloque.id,
        bloque_tipo: bloque.tipo,
        lado: bloque.lado || null,
        patron: bloque.patron || null,
        punto,
        lecturas,
        ...resultado
      };

      puntos.push(puntoResultado);
      puntosBloque.push(puntoResultado);
    }

    const decisionesBloque = puntosBloque.map((p) => ({
      status: p.decision.status,
      decision: p.decision.decision,
      motivo: p.decision.motivo,
      raw: p.decision
    }));

    const globalBloque = decideGlobal({
      family: familia,
      familia,
      regla_global: bloque.tipo?.includes("PNP")
        ? "CUALQUIER_LADO_NO_OK_ES_NO_APTO"
        : null,
      decisions: decisionesBloque
    });

    bloques.push({
      id: bloque.id,
      tipo: bloque.tipo,
      lado: bloque.lado,
      patron: bloque.patron,
      puntos: puntosBloque,
      decision_bloque: globalBloque
    });
  }

  const decisiones = puntos.map((p) => ({
    id: p.punto?.id,
    etiqueta: p.etiqueta,
    status: p.decision.status,
    decision: p.decision.decision,
    motivo: p.decision.motivo,
    raw: p.decision
  }));

  const global = decideGlobal({
    family: familia,
    familia,
    regla_global: auditoriaReq?.criterio_tmp?.regla_global,
    decisions: decisiones
  });

  return {
    ok: true,
    version: "TMP_APP_MT15_BRIDGE_V1",
    familia,
    family_resolved: familyResolved,
    normativa,
    auditoria_requisitos: auditoriaReq,
    instrumento,
    bloques,
    puntos,
    decision_global: global,
    resumen: {
      total_puntos: puntos.length,
      aptos: puntos.filter((p) => p.decision.status === "APTO").length,
      no_aptos: puntos.filter((p) => p.decision.status === "NO_APTO").length,
      indeterminados: puntos.filter((p) => p.decision.status === "INDETERMINADO").length,
      no_evaluables: puntos.filter((p) => p.decision.status === "NO_EVALUABLE").length
    }
  };
}

/* ===========================================================
   Construir bloque extra para certificado JSON actual
   =========================================================== */

export function buildMT15CertificateBlock(resultadoTMP = {}) {
  return {
    motor: {
      nombre: "TMP MT15 Metrology Engine",
      version: resultadoTMP.version || "TMP_APP_MT15_BRIDGE_V1",
      familia_motor: resultadoTMP.familia,
      family_resolved: resultadoTMP.family_resolved
    },
    normativa: resultadoTMP.normativa || null,
    auditoria_requisitos: resultadoTMP.auditoria_requisitos || null,
    decision_global: resultadoTMP.decision_global || null,
    resumen: resultadoTMP.resumen || null,
    puntos: (resultadoTMP.puntos || []).map((p) => ({
      bloque_id: p.bloque_id,
      bloque_tipo: p.bloque_tipo,
      lado: p.lado,
      etiqueta: p.etiqueta,
      valor_referencia: p.valor_referencia,
      media: p.media,
      error: p.error,
      error_um: p.error_um,
      U: p.U,
      U_um: p.U_um,
      decision: p.decision,
      incertidumbre: p.incertidumbre,
      patron: p.patron
    }))
  };
}

/* ===========================================================
   Textos HTML simples para app.js actual
   =========================================================== */

export function renderMT15TraceHTML(resultadoTMP = {}) {
  const normasGenerales = resultadoTMP.normativa?.referencias_generales || [];
  const normasFamilia = resultadoTMP.normativa?.referencias_familia || [];
  const req = resultadoTMP.auditoria_requisitos || {};

  return `
    <div class="card" style="margin-top:12px">
      <div class="row">
        <div class="pill success">TMP · TRAZABILIDAD AUDITORÍA</div>
        <div class="chip">${resultadoTMP.familia || "SIN_FAMILIA"}</div>
      </div>

      <p class="mini" style="margin-top:8px">
        <strong>Procedimiento TMP:</strong> ${req.procedimiento_tmp || resultadoTMP.normativa?.procedimiento_tmp || "No definido"}<br>
        <strong>Regla global:</strong> ${req.criterio_tmp?.regla_global || resultadoTMP.decision_global?.regla_global || "No definida"}<br>
        <strong>Decisión global:</strong> ${resultadoTMP.decision_global?.status || "No calculada"}
      </p>

      <p class="mini">
        <strong>Referencias generales:</strong><br>
        ${normasGenerales.map((n) => `${n.codigo} · ${n.uso}`).join("<br>") || "No informadas"}
      </p>

      <p class="mini">
        <strong>Referencias específicas:</strong><br>
        ${normasFamilia.map((n) => `${n.codigo} · ${n.uso}`).join("<br>") || "No informadas"}
      </p>

      <p class="mini">
        <strong>Debe documentar:</strong><br>
        ${(req.debe_documentar || []).map((x) => `• ${x}`).join("<br>") || "No definido"}
      </p>
    </div>
  `;
}
