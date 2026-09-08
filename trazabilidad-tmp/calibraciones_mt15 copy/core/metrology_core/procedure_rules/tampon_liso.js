import { createPoint, parseNum } from "./shared.js";
import { resolvePlainPlugGoNoGo } from "../plain_limit_gauge_engine.js";
import { buildPlainPlugGaugeLimits } from "../gauge_limits_engine.js";

/* ===========================================================
   TMP PROCEDURE RULE - TAMPON LISO P/NP V2
   -----------------------------------------------------------
   Genera pauta MT15 para tampones lisos PASA / NO PASA.

   V2:
   - Mantiene compatibilidad con V1.
   - Siempre intenta resolver ISO286 desde designacion/rango.
   - Usa plain_limit_gauge_engine.js como fuente principal de PASA/NO PASA.
   - Conserva gauge_limits_engine.js para limites de aceptacion del calibre.
   - Anade trazabilidad ISO286 en cada punto.
   - No inventa limites si gauge_limits_engine.js no los devuelve.
   =========================================================== */

function buildDesignationInput(ctx = {}, instrumento = {}) {
  return {
    designacion:
      ctx.designacion ??
      instrumento.designacion ??
      instrumento.tolerancia_iso ??
      instrumento.rango ??
      "",
    rango: instrumento.rango,
    descripcion: instrumento.descripcion,
    nombre: instrumento.nombre,
    modelo: instrumento.modelo,
    observaciones: instrumento.observaciones
  };
}

function firstValidNumber(...values) {
  for (const value of values) {
    const n = parseNum(value, NaN);
    if (Number.isFinite(n) && n !== 0) return n;
  }
  return 0;
}

function safeBuildGaugeLimits(input = {}) {
  try {
    return buildPlainPlugGaugeLimits(input);
  } catch (err) {
    console.warn("TMP buildPlainPlugGaugeLimits error:", err);
    return null;
  }
}

function getGaugeSideLimits(gaugeLimits = null, side = "pasa") {
  const data = gaugeLimits?.[side] || null;

  return {
    limite_inferior: data?.limite_inferior ?? null,
    limite_superior: data?.limite_superior ?? null,
    tolerancia_abs: data?.tolerancia_abs ?? null,
    criterio_normativo: data?.criterio ?? null,
    gauge_limits: data
  };
}

function buildPointExtra({ side, auto, gaugeLimits }) {
  const key = side === "PASA" ? "pasa" : "no_pasa";
  const sideLimits = getGaugeSideLimits(gaugeLimits, key);

  return {
    lado: side,
    calculo_automatico: Boolean(auto?.ok),
    plain_limit_data: auto?.ok ? auto : null,

    iso286: auto?.ok ? {
      nominal_base: auto.parsed?.nominal ?? null,
      tolerancia: auto.parsed?.tolerance ?? null,
      tipo: auto.parsed?.tipo ?? null,
      desviaciones_um: auto.limits?.deviations_um ?? null,
      limites_mm: auto.limits?.limits_mm ?? null,
      formula_it: auto.audit?.formula_it ?? null,
      formula_desviacion: auto.audit?.formula_desviacion ?? null
    } : null,

    ...sideLimits
  };
}

export function buildTamponLisoProcedure(ctx = {}) {
  const i = ctx.instrumento || {};
  const rep = ctx.repeticiones || 5;

  const designationInput = buildDesignationInput(ctx, i);
  const auto = resolvePlainPlugGoNoGo(designationInput);

  const nominalPasa = firstValidNumber(
    ctx.nominal_pasa,
    i.nominal_pasa,
    i.valor_nominal,
    ctx.nominal,
    auto?.ok ? auto.nominal_pasa : null
  );

  const nominalNoPasa = firstValidNumber(
    ctx.nominal_no_pasa,
    i.nominal_no_pasa,
    i.no_pasa,
    i.nogo,
    auto?.ok ? auto.nominal_no_pasa : null
  );

  const gaugeLimits = safeBuildGaugeLimits({
    ...designationInput,
    nominal_pasa: nominalPasa || null,
    nominal_no_pasa: nominalNoPasa || null,
    plain_limit_data: auto?.ok ? auto : null
  });

  const puntos = [];

  if (nominalPasa) {
    puntos.push(createPoint({
      id: "PASA",
      etiqueta: `Lado PASA ${nominalPasa} mm`,
      funcion: "PASA",
      nominal: nominalPasa,
      patron_tipo: "BANCO_HORIZONTAL",
      repeticiones: rep,
      extra: buildPointExtra({
        side: "PASA",
        auto,
        gaugeLimits
      })
    }));
  }

  if (nominalNoPasa) {
    puntos.push(createPoint({
      id: "NO_PASA",
      etiqueta: `Lado NO PASA ${nominalNoPasa} mm`,
      funcion: "NO_PASA",
      nominal: nominalNoPasa,
      patron_tipo: "BANCO_HORIZONTAL",
      repeticiones: rep,
      extra: buildPointExtra({
        side: "NO_PASA",
        auto,
        gaugeLimits
      })
    }));
  }

  const warnings = [];

  if (!nominalPasa) {
    warnings.push("Falta nominal PASA. Debe completarse para evaluar correctamente el calibre.");
  }

  if (!nominalNoPasa) {
    warnings.push("Falta nominal NO PASA. Debe completarse para evaluar correctamente el calibre.");
  }

  if (auto?.ok) {
    warnings.push(...(auto.audit?.observaciones || []));
  }

  if (auto && !auto.ok) {
    warnings.push(auto.message || "No se pudo calcular automaticamente PASA/NO PASA.");
  }

  if (!gaugeLimits?.pasa || !gaugeLimits?.no_pasa) {
    warnings.push(
      "No hay limites normativos completos de aceptacion del calibre en gauge_limits_engine.js. " +
      "La decision se realizara por tolerancia/error disponible hasta completar la tabla de calibre."
    );
  }

  return {
    procedimiento: "MT15-CAP-08",
    norma: ["MT-15 Cap.8", "DIN 7162", "ISO 1938-1", "ISO 286", "ILAC-G8", "ISO 14253"],
    descripcion: "Pauta automatica tampon liso P/NP",

    datos_calculados: auto?.ok ? {
      engine_version: auto.engine_version || "V2",
      nominal_base: auto.parsed.nominal,
      tolerancia: auto.parsed.tolerance,
      tipo: auto.parsed.tipo,
      limite_inferior: auto.limits.limits_mm.lower,
      limite_superior: auto.limits.limits_mm.upper,
      nominal_pasa: auto.nominal_pasa,
      nominal_no_pasa: auto.nominal_no_pasa,
      desviaciones_um: auto.limits.deviations_um,
      formula_it: auto.audit?.formula_it || null,
      formula_desviacion: auto.audit?.formula_desviacion || null
    } : null,

    gauge_limits: gaugeLimits,

    funciones: [
      {
        id: "PASA_NO_PASA",
        nombre: "Calibre liso Pasa / No Pasa",
        patron_tipo: "BANCO_HORIZONTAL",
        puntos
      }
    ],

    regla_global: "CUALQUIER_LADO_NO_OK_ES_NO_APTO",
    warnings
  };
}
