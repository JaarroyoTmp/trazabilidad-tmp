/* ===========================================================
   TMP PROCEDURE BUILDER V1
   -----------------------------------------------------------
   Generador automatico de pautas de calibracion TMP.
   =========================================================== */

import { buildPieDeReyProcedure } from "./procedure_rules/pie_de_rey.js";
import { buildMicrometroExteriorProcedure } from "./procedure_rules/micrometro_exterior.js";
import { buildMicrometroInteriorProcedure } from "./procedure_rules/micrometro_interior.js";
import { buildTamponLisoProcedure } from "./procedure_rules/tampon_liso.js";
import { buildTamponRoscadoProcedure } from "./procedure_rules/tampon_roscado.js";
import { buildComparadorProcedure } from "./procedure_rules/comparador.js";
import { buildAlturaProcedure } from "./procedure_rules/altura.js";
import { buildLlaveDinamometricaProcedure } from "./procedure_rules/llave_dinamometrica.js";
import { buildBalanzaProcedure } from "./procedure_rules/balanza.js";

export const TMP_DEFAULT_REPETITIONS = 5;

export function parseNum(value, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;

  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeFamily(value) {
  return String(value || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\/\s\-]+/g, "_")
    .trim();
}

export function extractRangeMax(instrumento = {}) {
  const direct = parseNum(
    instrumento.rango_max ??
    instrumento.alcance ??
    instrumento.valor_nominal,
    NaN
  );

  if (Number.isFinite(direct) && direct > 0) return direct;

  const txt = String(instrumento.rango || instrumento.descripcion || "");
  const nums = txt.match(/\d+(?:[\.,]\d+)?/g)?.map((x) => parseNum(x)) || [];

  if (!nums.length) return 0;
  return Math.max(...nums);
}

export function extractRangeMin(instrumento = {}) {
  const direct = parseNum(instrumento.rango_min, NaN);
  if (Number.isFinite(direct)) return direct;

  const txt = String(instrumento.rango || "");
  const nums = txt.match(/\d+(?:[\.,]\d+)?/g)?.map((x) => parseNum(x)) || [];

  if (!nums.length) return 0;
  return Math.min(...nums);
}

export function createPoint({
  id,
  nominal,
  unidad = "mm",
  repeticiones = TMP_DEFAULT_REPETITIONS,
  patron_tipo,
  etiqueta,
  funcion,
  extra = {}
}) {
  return {
    id,
    etiqueta: etiqueta || id,
    funcion: funcion || null,
    nominal,
    unidad,
    repeticiones,
    patron_tipo,
    lecturas_requeridas: Array.from({ length: repeticiones }, (_, i) => ({
      ordinal: i + 1,
      valor: null
    })),
    ...extra
  };
}

export function buildProcedure(input = {}) {
  const instrumento = input.instrumento || input.equipo || input;

  const familyRaw =
    input.family ||
    input.familia ||
    instrumento.familia_motor ||
    instrumento.familia ||
    "";

  const familyKey = normalizeFamily(familyRaw);

  const ctx = {
    ...input,
    instrumento,
    family: familyKey,
    familia: familyKey,
    rango_min: extractRangeMin(instrumento),
    rango_max: extractRangeMax(instrumento),
    repeticiones: parseNum(input.repeticiones, TMP_DEFAULT_REPETITIONS)
  };

  console.log("TMP buildProcedure familyRaw =", familyRaw);
  console.log("TMP buildProcedure familyKey =", familyKey);
  console.log("TMP buildProcedure ctx =", ctx);

  let procedure;

  switch (familyKey) {
    case "PIE_DE_REY":
    case "PIE_REY":
    case "CALIBRE":
    case "CALIBRE_DIGITAL":
    case "CALIBRE_ANALOGICO":
      procedure = buildPieDeReyProcedure(ctx);
      break;

    case "MICROMETRO_EXTERIOR":
    case "MICROMETRO_EXTERIORES":
    case "MICROMETRO":
      procedure = buildMicrometroExteriorProcedure(ctx);
      break;

    case "MICROMETRO_INTERIOR_3_CONTACTOS":
    case "MICROMETRO_INTERIORES_3_CONTACTOS":
    case "MICROMETRO_INTERIOR":
    case "MICROMETRO_INTERIORES":
      procedure = buildMicrometroInteriorProcedure(ctx);
      break;

    case "TAMPON_LISO_PNP":
    case "TAMPON_LISO_P_NP":
    case "TAMPON_LISO":
    case "TAPON_LISO_PNP":
    case "TAPON_LISO_P_NP":
    case "TAPON_LISO":
    case "TAMPON_LISO_PASA_NO_PASA":
    case "TAPON_LISO_PASA_NO_PASA":
      procedure = buildTamponLisoProcedure(ctx);
      break;

    case "TAMPON_ROSCADO_PNP":
    case "TAMPON_ROSCA_PNP":
    case "TAMPON_ROSCADO":
    case "TAMPON_ROSCA":
    case "TAPON_ROSCADO_PNP":
    case "TAPON_ROSCA_PNP":
    case "TAPON_ROSCADO":
    case "TAPON_ROSCA":
      procedure = buildTamponRoscadoProcedure(ctx);
      break;

    case "RELOJ_COMPARADOR_CENTESIMAL":
    case "RELOJ_COMPARADOR_MILESIMAL":
    case "RELOJ_COMPARADOR":
    case "COMPARADOR":
      procedure = buildComparadorProcedure(ctx);
      break;

    case "GRAMIL":
    case "SONDA_ALTURA":
    case "SONDA_DE_ALTURA":
      procedure = buildAlturaProcedure(ctx);
      break;

    case "LLAVE_DINAMOMETRICA":
    case "LLAVE_DINAMOMETRICA_DIGITAL":
    case "LLAVE_DINAMOMETRICA_ANALOGICA":
      procedure = buildLlaveDinamometricaProcedure(ctx);
      break;

    case "BALANZA":
    case "BASCULA":
      procedure = buildBalanzaProcedure(ctx);
      break;

    default:
      procedure = buildGenericProcedure(ctx);
      break;
  }

  return {
    ok: true,
    version: "TMP_PROCEDURE_BUILDER_V1",
    family: familyKey,
    instrumento_codigo: instrumento.codigo || null,
    instrumento_descripcion: instrumento.descripcion || instrumento.nombre || null,
    ...procedure
  };
}

export function buildGenericProcedure(ctx = {}) {
  const max = ctx.rango_max || parseNum(ctx.nominal || ctx.valor_nominal, 0);

  const puntos = max
    ? [max * 0.25, max * 0.5, max * 0.9].map((x) => Math.round(x * 1000) / 1000)
    : [];

  return {
    procedimiento: "GENERIC-TMP",
    norma: ["criterio TMP"],
    descripcion: "Pauta generica provisional",
    funciones: [
      {
        id: "GENERAL",
        nombre: "Medicion general",
        patron_tipo: "PATRON_REQUERIDO",
        puntos: puntos.map((p, i) =>
          createPoint({
            id: `P${i + 1}`,
            nominal: p,
            patron_tipo: "PATRON_REQUERIDO",
            funcion: "GENERAL",
            repeticiones: ctx.repeticiones
          })
        )
      }
    ],
    warnings: [
      `Familia sin regla especifica: ${ctx.family}. Revisar procedimiento antes de usar en produccion.`
    ]
  };
}