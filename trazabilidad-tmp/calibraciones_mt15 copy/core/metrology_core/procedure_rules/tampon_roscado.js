import { createPoint, parseNum } from "./shared.js";

export const TAMPON_ROSCADO_PROCEDURE_VERSION =
  "TMP_TAMPON_ROSCADO_PROCEDURE_V2_20260630_GUIDED_KNOWLEDGE";

function rodilloMetricoISO(paso) {
  const p = parseNum(paso);
  if (!p) return null;
  return Math.round((0.57735026919 * p) * 1000) / 1000;
}

function parseThreadFromText(text = "") {
  const t = String(text).toUpperCase().replace(",", ".");
  const m = t.match(/M\s*(\d+(?:\.\d+)?)\s*[Xx]\s*(\d+(?:\.\d+)?)(?:\s*[- ]?\s*([0-9][A-Z]))?/);
  if (!m) return {};
  return {
    tipo_rosca: "ISO_METRICA",
    diametro_nominal: parseNum(m[1]),
    paso: parseNum(m[2]),
    clase: m[3] || null,
    angulo: 60
  };
}

function buildGuidedSteps({ tipoRosca, diametro, paso, clase, angulo, rodillo, rep }) {
  return [
    {
      id: "IDENTIFICAR_EQUIPO",
      titulo: "Instrumento identificado",
      tipo: "CONFIRMACION",
      texto: `Verifique que el equipo corresponde a un tampón roscado P/NP ${tipoRosca} M${diametro}x${paso} ${clase}.`
    },
    {
      id: "NORMA_APLICABLE",
      titulo: "Método normativo",
      tipo: "INFORMATIVO",
      texto: "El sistema aplica ISO 1502 / ISO 965 / ISO 724 para definir límites y método de verificación."
    },
    {
      id: "PREPARAR_BANCO",
      titulo: "Preparar banco patrón Trimos",
      tipo: "CONFIRMACION",
      texto: "Utilice el banco patrón Trimos certificado. El banco es el patrón trazable que aporta corrección e incertidumbre."
    },
    {
      id: "MONTAR_RODILLOS",
      titulo: "Montar rodillos/hilos",
      tipo: "CONFIRMACION",
      texto: rodillo
        ? `Monte los rodillos/hilos Ø ${rodillo} mm calculados por norma. Son útiles de medición, no el patrón principal.`
        : "No se pudo calcular el rodillo. Revise paso/designación antes de continuar."
    },
    {
      id: "MEDIR_PASA",
      titulo: "Medir lado PASA",
      tipo: "LECTURAS",
      punto_id: "PASA",
      lecturas: rep,
      texto: `Coloque el lado PASA y tome ${rep} lecturas consecutivas en el banco Trimos.`
    },
    {
      id: "MEDIR_NO_PASA",
      titulo: "Medir lado NO PASA",
      tipo: "LECTURAS",
      punto_id: "NO_PASA",
      lecturas: rep,
      texto: `Coloque el lado NO PASA y tome ${rep} lecturas consecutivas en el banco Trimos.`
    },
    {
      id: "CALCULAR_DECISION",
      titulo: "Calcular resultado",
      tipo: "CALCULO",
      texto: "El sistema aplicará corrección del banco, incertidumbre, repetibilidad y regla de decisión ILAC-G8."
    }
  ];
}

export function buildTamponRoscadoProcedure(ctx = {}) {
  const i = ctx.instrumento || {};
  const rep = ctx.repeticiones || 5;

  const parsed = parseThreadFromText(`${i.descripcion || ""} ${i.rango || ""} ${i.modelo || ""}`);

  const tipoRosca = ctx.tipo_rosca || i.tipo_rosca || parsed.tipo_rosca || "ISO_METRICA";
  const diametro = parseNum(ctx.diametro_nominal ?? i.diametro_nominal ?? parsed.diametro_nominal);
  const paso = parseNum(ctx.paso ?? i.paso ?? parsed.paso);
  const clase = ctx.clase || i.clase || parsed.clase || "6H";
  const angulo = parseNum(ctx.angulo ?? i.angulo ?? parsed.angulo, 60);

  const rodillo = ctx.rodillo ?? rodilloMetricoISO(paso);

  const extraComun = {
    tipo_rosca: tipoRosca,
    diametro_nominal: diametro,
    paso,
    clase,
    angulo,
    rodillo_recomendado: rodillo,
    magnitud: "diametro_medio_sobre_rodillos",
    patron_principal: "BANCO_TRIMOS_CERTIFICADO",
    rodillos_son_patron: false,
    rodillos_son_util_medicion: true
  };

  const puntos = [
    createPoint({
      id: "PASA",
      etiqueta: `Rosca PASA ${tipoRosca} M${diametro}x${paso} ${clase}`,
      funcion: "PASA",
      nominal: diametro,
      patron_tipo: "BANCO_HORIZONTAL",
      repeticiones: rep,
      extra: {
        ...extraComun,
        lado: "PASA"
      }
    }),
    createPoint({
      id: "NO_PASA",
      etiqueta: `Rosca NO PASA ${tipoRosca} M${diametro}x${paso} ${clase}`,
      funcion: "NO_PASA",
      nominal: diametro,
      patron_tipo: "BANCO_HORIZONTAL",
      repeticiones: rep,
      extra: {
        ...extraComun,
        lado: "NO_PASA"
      }
    })
  ];

  return {
    procedimiento: "PT-ROSCA-001",
    version: TAMPON_ROSCADO_PROCEDURE_VERSION,
    familia: "TAMPON_ROSCADO",
    descripcion: "Pauta guiada para tampón roscado P/NP",

    norma: ["ISO 1502", "ISO 965", "ISO 724", "DIN 2269", "ILAC-G8", "GUM"],

    criterio_metrologico: {
      patron_principal: "Banco patrón Trimos certificado",
      utiles_medicion: "Rodillos/hilos calculados por norma",
      regla:
        "El banco Trimos es el patrón trazable para corrección e incertidumbre. Los rodillos son útiles necesarios para obtener la lectura, pero no bloquean la calibración por no estar en Supabase."
    },

    datos_rosca: {
      tipo_rosca: tipoRosca,
      diametro_nominal: diametro,
      paso,
      clase,
      angulo,
      rodillo_recomendado: rodillo
    },

    instrucciones_operario: [
      "Usar banco patrón Trimos certificado.",
      rodillo
        ? `Montar rodillos/hilos Ø ${rodillo} mm calculados por norma.`
        : "Falta paso de rosca: no se puede recomendar rodillo.",
      "Limpiar rosca, rodillos y superficies de contacto.",
      "Tomar 5 lecturas del lado PASA.",
      "Tomar 5 lecturas del lado NO PASA.",
      "No decidir manualmente el resultado. El sistema aplicará la regla de decisión."
    ],

    pasos_guiados: buildGuidedSteps({
      tipoRosca,
      diametro,
      paso,
      clase,
      angulo,
      rodillo,
      rep
    }),

    funciones: [
      {
        id: "ROSCA_PASA_NO_PASA",
        nombre: "Tampón roscado Pasa / No Pasa",
        patron_tipo: "BANCO_HORIZONTAL",
        patron_principal: "BANCO_TRIMOS_CERTIFICADO",
        patron_complementario: "RODILLOS_ROSCA_UTIL_MEDICION",
        rodillos_bloquean_calibracion: false,
        puntos
      }
    ],

    regla_global: "CUALQUIER_LADO_NO_OK_ES_NO_APTO",
    decision_operario_permitida: false,
    resultado_permitido: ["OK", "NOK", "INDETERMINADO"],

    warnings: rodillo
      ? []
      : ["No se pudo calcular rodillo recomendado. Revisar tipo de rosca/paso."]
  };
}