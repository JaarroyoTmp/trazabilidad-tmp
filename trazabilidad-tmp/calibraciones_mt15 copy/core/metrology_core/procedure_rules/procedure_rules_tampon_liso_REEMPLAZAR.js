import { createPoint, parseNum } from "./shared.js";
import { resolvePlainPlugGoNoGo } from "../plain_limit_gauge_engine.js";

export function buildTamponLisoProcedure(ctx = {}) {
  const i = ctx.instrumento || {};
  const rep = ctx.repeticiones || 5;

  let nominalPasa = parseNum(ctx.nominal_pasa ?? i.nominal_pasa ?? i.valor_nominal ?? ctx.nominal);
  let nominalNoPasa = parseNum(ctx.nominal_no_pasa ?? i.nominal_no_pasa ?? i.no_pasa ?? i.nogo);

  let auto = null;

  if (!nominalPasa || !nominalNoPasa) {
    auto = resolvePlainPlugGoNoGo({
      designacion: ctx.designacion,
      rango: i.rango,
      descripcion: i.descripcion,
      nombre: i.nombre,
      modelo: i.modelo,
      observaciones: i.observaciones
    });

    if (auto.ok) {
      nominalPasa = nominalPasa || auto.nominal_pasa;
      nominalNoPasa = nominalNoPasa || auto.nominal_no_pasa;
    }
  }

  const puntos = [];

  if (nominalPasa) {
    puntos.push(createPoint({
      id: "PASA",
      etiqueta: `Lado PASA ${nominalPasa} mm`,
      funcion: "PASA",
      nominal: nominalPasa,
      patron_tipo: "BANCO_HORIZONTAL",
      repeticiones: rep,
      extra: {
        lado: "PASA",
        calculo_automatico: Boolean(auto?.ok),
        plain_limit_data: auto?.ok ? auto : null
      }
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
      extra: {
        lado: "NO_PASA",
        calculo_automatico: Boolean(auto?.ok),
        plain_limit_data: auto?.ok ? auto : null
      }
    }));
  }

  const warnings = [];

  if (!nominalPasa) warnings.push("Falta nominal PASA. Debe completarse para evaluar correctamente el calibre.");
  if (!nominalNoPasa) warnings.push("Falta nominal NO PASA. Debe completarse para evaluar correctamente el calibre.");
  if (auto?.ok) warnings.push(...(auto.audit?.observaciones || []));
  if (auto && !auto.ok) warnings.push(auto.message || "No se pudo calcular automaticamente PASA/NO PASA.");

  return {
    procedimiento: "MT15-CAP-08",
    norma: ["MT-15 Cap.8", "DIN 7162", "ISO 1938-1", "ISO 286", "ILAC-G8", "ISO 14253"],
    descripcion: "Pauta automatica tampon liso P/NP",
    datos_calculados: auto?.ok ? {
      nominal_base: auto.parsed.nominal,
      tolerancia: auto.parsed.tolerance,
      tipo: auto.parsed.tipo,
      limite_inferior: auto.limits.limits_mm.lower,
      limite_superior: auto.limits.limits_mm.upper,
      nominal_pasa: auto.nominal_pasa,
      nominal_no_pasa: auto.nominal_no_pasa
    } : null,
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
