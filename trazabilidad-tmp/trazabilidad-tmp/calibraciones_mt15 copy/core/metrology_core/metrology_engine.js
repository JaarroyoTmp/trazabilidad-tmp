/* ===========================================================
   TMP METROLOGY ENGINE - STRATEGY V1
   Orquestador principal del motor metrologico TMP

   Flujo:
   instrumento -> clasificacion -> procedimiento -> estrategias
   -> requisitos de patrones -> pauta guiada -> decision
   =========================================================== */

import { classifyEquipment } from "./equipment_classifier.js";
import { getStandardForEquipment } from "./standards_catalog.js";
import {
  getCalibrationStrategy,
  buildStrategiesForEquipment,
  validateStrategyAnswers
} from "./calibration_strategy_rules.js";
import {
  getPatternCapabilitiesForEquipment,
  buildPatternRequirementsForStrategies
} from "./pattern_capabilities.js";
import {
  buildPatternSearchRequest,
  rankPatternCandidates
} from "./pattern_selector.js";
import { buildProcedure } from "./procedure_builder.js";
import { calculateUncertainty } from "./uncertainty_engine.js";
import { evaluateDecision } from "./decision_engine.js";

function safeCall(fn, fallback, ...args) {
  try {
    if (typeof fn !== "function") return fallback;
    const result = fn(...args);
    return result === undefined || result === null ? fallback : result;
  } catch (err) {
    console.warn("Metrology engine safeCall fallback:", err);
    return fallback;
  }
}

function normalizeInstrument(instrumento = {}) {
  const descripcion = [
    instrumento.codigo,
    instrumento.descripcion,
    instrumento.familia,
    instrumento.tipo,
    instrumento.tipo_calibracion,
    instrumento.rango
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return {
    ...instrumento,
    _texto_clasificacion: descripcion,
    rango_min: Number(instrumento.rango_min ?? instrumento.rango_minimo ?? 0) || null,
    rango_max: Number(instrumento.rango_max ?? instrumento.rango_maximo ?? extraerRangoMaximo(instrumento.rango)) || null,
    resolucion: Number(instrumento.resolucion ?? instrumento.division_escala ?? instrumento.precision ?? 0) || null
  };
}

function extraerRangoMaximo(rango) {
  if (!rango) return null;
  const nums = String(rango)
    .replace(/,/g, ".")
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number) || [];
  if (!nums.length) return null;
  return Math.max(...nums);
}

function fallbackClassification(instrumento = {}) {
  const txt = instrumento._texto_clasificacion || "";

  if (txt.includes("pie") || txt.includes("rey") || txt.includes("calibre")) return "PIE_DE_REY";
  if (txt.includes("microm") && txt.includes("inter")) return "MICROMETRO_INTERIOR_3_CONTACTOS";
  if (txt.includes("microm")) return "MICROMETRO_EXTERIOR";
  if (txt.includes("tampon") || txt.includes("tampón") || txt.includes("p/np") || txt.includes("pasa")) return "TAMPON_LISO_PNP";
  if (txt.includes("anillo") && txt.includes("rosca")) return "ANILLO_ROSCA";
  if (txt.includes("anillo")) return "ANILLO_PATRON";
  if (txt.includes("comparador") || txt.includes("reloj")) return "RELOJ_COMPARADOR";
  if (txt.includes("gramil") || txt.includes("altura")) return "GRAMIL";
  if (txt.includes("rugos")) return "RUGOSIMETRO";
  if (txt.includes("durom")) return "DUROMETRO";
  if (txt.includes("dinam")) return "LLAVE_DINAMOMETRICA";
  if (txt.includes("balanza")) return "BALANZA";

  return "GENERICO";
}

function fallbackStandard(familia) {
  const map = {
    PIE_DE_REY: { codigo: "MT15-CAP-03", titulo: "Pie de Rey", norma: "MT-15 Cap. 3" },
    MICROMETRO_EXTERIOR: { codigo: "MT15-CAP-02", titulo: "Micrometro de Exteriores", norma: "MT-15 Cap. 2" },
    MICROMETRO_INTERIOR_3_CONTACTOS: { codigo: "MT15-CAP-13", titulo: "Micrometro de Interiores", norma: "MT-15 Cap. 13" },
    TAMPON_LISO_PNP: { codigo: "MT15-CAP-08", titulo: "Calibres Pasa - No Pasa", norma: "MT-15 Cap. 8 + DIN 7162" },
    ANILLO_PATRON: { codigo: "TMP-DIM-ANILLO", titulo: "Anillo patron", norma: "Procedimiento interno dimensional" },
    RELOJ_COMPARADOR: { codigo: "MT15-CAP-05", titulo: "Comparadores", norma: "MT-15 Cap. 5" },
    GRAMIL: { codigo: "MT15-CAP-04", titulo: "Gramil", norma: "MT-15 Cap. 4" },
    RUGOSIMETRO: { codigo: "TMP-RUG-01", titulo: "Rugosimetro", norma: "ISO 4287 / ISO 4288 / ISO 21920" },
    DUROMETRO: { codigo: "TMP-DUR-01", titulo: "Durometro", norma: "ISO 6506 / ISO 6507 / ISO 6508 segun escala" },
    LLAVE_DINAMOMETRICA: { codigo: "TMP-TORQ-01", titulo: "Llave dinamometrica", norma: "ISO 6789" },
    BALANZA: { codigo: "TMP-MASS-01", titulo: "Balanza", norma: "OIML R76" },
    GENERICO: { codigo: "TMP-GEN-01", titulo: "Procedimiento generico", norma: "ISO/IEC 17025 + ILAC-G8" }
  };
  return map[familia] || map.GENERICO;
}

function fallbackStrategies(familia, instrumento, respuestas = {}) {
  const rangoMax = instrumento.rango_max || 0;
  const tieneSonda = instrumento.tiene_sonda !== false;

  if (familia === "PIE_DE_REY") {
    const estrategias = [];

    if (respuestas.calibrar_exteriores !== false) {
      estrategias.push({
        id: "EXTERIORES",
        nombre: "Calibracion de exteriores / boca",
        patron_preferido: ["BANCO_HORIZONTAL", "JUEGO_CALAS"],
        repeticiones: 5,
        decision_critica: true
      });
    }

    if (respuestas.calibrar_interiores !== false) {
      estrategias.push({
        id: "INTERIORES",
        nombre: "Calibracion de interiores / puntas",
        patron_preferido: ["ANILLO_PATRON"],
        repeticiones: 5,
        decision_critica: true
      });
    }

    if (rangoMax <= 300 && tieneSonda && respuestas.calibrar_sonda !== false) {
      estrategias.push({
        id: "SONDA_PROFUNDIDAD",
        nombre: "Calibracion de sonda de profundidad",
        patron_preferido: ["JUEGO_CALAS"],
        repeticiones: 5,
        decision_critica: true
      });
    }

    return {
      requiere_preguntas: true,
      preguntas: [
        { id: "calibrar_exteriores", texto: "¿Calibrar exteriores?", defecto: true },
        { id: "calibrar_interiores", texto: "¿Calibrar interiores?", defecto: true },
        { id: "calibrar_sonda", texto: "¿Calibrar sonda de profundidad?", defecto: rangoMax <= 300 && tieneSonda, visible: rangoMax <= 300 && tieneSonda }
      ],
      estrategias,
      decision_global: { regla: "CUALQUIER_FUNCION_NO_OK_ES_NO_APTO", permite_uso_restringido: false }
    };
  }

  if (familia === "TAMPON_LISO_PNP") {
    return {
      requiere_preguntas: false,
      estrategias: [
        { id: "LADO_PASA_GO", nombre: "Calibracion lado pasa / GO", patron_preferido: ["BANCO_HORIZONTAL", "JUEGO_CALAS"], repeticiones: 5, decision_critica: true },
        { id: "LADO_NO_PASA_NOGO", nombre: "Calibracion lado no pasa / NO GO", patron_preferido: ["BANCO_HORIZONTAL", "JUEGO_CALAS"], repeticiones: 5, decision_critica: true }
      ],
      decision_global: { regla: "CUALQUIER_LADO_NO_OK_ES_NO_APTO", permite_uso_restringido: false }
    };
  }

  if (familia === "MICROMETRO_EXTERIOR") {
    return {
      requiere_preguntas: false,
      estrategias: [
        { id: "CERO", nombre: "Comprobacion del cero", patron_preferido: ["JUEGO_CALAS"], repeticiones: 5, decision_critica: true },
        { id: "CALIBRACION", nombre: "Calibracion de escala", patron_preferido: ["JUEGO_CALAS"], repeticiones: 5, decision_critica: true }
      ],
      decision_global: { regla: "CUALQUIER_FUNCION_NO_OK_ES_NO_APTO", permite_uso_restringido: false }
    };
  }

  if (familia === "MICROMETRO_INTERIOR_3_CONTACTOS") {
    return {
      requiere_preguntas: false,
      estrategias: [
        { id: "CERO", nombre: "Comprobacion del cero", patron_preferido: ["ANILLO_PATRON"], repeticiones: 5, decision_critica: true },
        { id: "CALIBRACION", nombre: "Calibracion con anillo patron", patron_preferido: ["ANILLO_PATRON"], repeticiones: 5, decision_critica: true }
      ],
      decision_global: { regla: "CUALQUIER_FUNCION_NO_OK_ES_NO_APTO", permite_uso_restringido: false }
    };
  }

  return {
    requiere_preguntas: false,
    estrategias: [
      { id: "CALIBRACION", nombre: "Calibracion", patron_preferido: ["PATRON_TRAZABLE"], repeticiones: 5, decision_critica: true }
    ],
    decision_global: { regla: "CUALQUIER_FUNCION_NO_OK_ES_NO_APTO", permite_uso_restringido: false }
  };
}

function buildPatternRequirements(estrategias = [], instrumento = {}) {
  return estrategias.map(estrategia => ({
    estrategia_id: estrategia.id,
    estrategia_nombre: estrategia.nombre,
    tipos_patron: estrategia.patron_preferido || ["PATRON_TRAZABLE"],
    nominal_requerido: estrategia.nominal_requerido || instrumento.nominal || null,
    rango_min: instrumento.rango_min,
    rango_max: instrumento.rango_max,
    unidad: instrumento.unidad_base || "mm",
    requiere_certificado_vigente: true,
    requiere_estado_en_uso: true,
    requiere_trazabilidad: true,
    prioridad: "mejor_incertidumbre_y_rango"
  }));
}

export function analyzeEquipmentForCalibration(instrumento = {}, respuestas = {}) {
  const equipo = normalizeInstrument(instrumento);

  const familia = safeCall(
    classifyEquipment,
    fallbackClassification(equipo),
    equipo
  );

  const procedimiento = safeCall(
    getStandardForEquipment,
    fallbackStandard(familia),
    familia,
    equipo
  );

  const estrategiaBase = safeCall(
    getCalibrationStrategy,
    null,
    familia,
    equipo
  );

  const estrategias = safeCall(
    buildStrategiesForEquipment,
    null,
    familia,
    equipo,
    respuestas,
    estrategiaBase
  ) || fallbackStrategies(familia, equipo, respuestas);

  const validacionRespuestas = safeCall(
    validateStrategyAnswers,
    { ok: true, warnings: [] },
    familia,
    equipo,
    respuestas,
    estrategias
  );

  const capacidades = safeCall(
    getPatternCapabilitiesForEquipment,
    null,
    familia,
    equipo,
    estrategias
  );

  const requisitosPatron = safeCall(
    buildPatternRequirementsForStrategies,
    null,
    estrategias.estrategias || [],
    equipo,
    capacidades
  ) || buildPatternRequirements(estrategias.estrategias || [], equipo);

  const solicitudesBusqueda = requisitosPatron.map(req => safeCall(
    buildPatternSearchRequest,
    req,
    req,
    equipo
  ));

  const pauta = safeCall(
    buildProcedure,
    {
      procedimiento,
      familia,
      estrategias: estrategias.estrategias || [],
      requisitos_patron: requisitosPatron,
      repeticiones_por_defecto: 5
    },
    {
      instrumento: equipo,
      familia,
      procedimiento,
      estrategias,
      requisitos_patron: requisitosPatron
    }
  );

  return {
    ok: true,
    instrumento: equipo,
    familia,
    procedimiento,
    estrategias,
    validacion_respuestas: validacionRespuestas,
    capacidades_patron: capacidades,
    requisitos_patron: requisitosPatron,
    solicitudes_busqueda_patron: solicitudesBusqueda,
    pauta,
    siguiente_accion: estrategias.requiere_preguntas && !respuestas.__confirmadas
      ? "CONFIRMAR_ESTRATEGIAS"
      : "BUSCAR_PATRONES"
  };
}

export function selectPatternsForCalibration(analysis, patronesDisponibles = []) {
  const requisitos = analysis?.requisitos_patron || [];

  return requisitos.map(req => {
    const candidatos = patronesDisponibles.filter(p => {
      const tipoOk = !req.tipos_patron?.length || req.tipos_patron.includes(p.tipo_patron || p.tipo || p.familia);
      const estadoOk = !req.requiere_estado_en_uso || ["EN_USO", "ACTIVO", "VIGENTE", "en uso"].includes(p.estado || p.estado_actual || "EN_USO");
      const fechaOk = !req.requiere_certificado_vigente || !p.fecha_proxima_calibracion || new Date(p.fecha_proxima_calibracion) >= new Date();
      return tipoOk && estadoOk && fechaOk;
    });

    const ordenados = safeCall(rankPatternCandidates, candidatos, candidatos, req);

    return {
      requisito: req,
      candidatos: ordenados,
      recomendado: ordenados[0] || null,
      estado: ordenados.length ? "PATRON_RECOMENDADO" : "SIN_PATRON_VALIDO"
    };
  });
}

export function calculateCalibrationPoint(input = {}) {
  return safeCall(calculateUncertainty, null, input) || {
    ...input,
    incertidumbre_expandida: input.U ?? input.incertidumbre ?? 0,
    correccion: input.correccion ?? input.error ?? 0
  };
}

export function evaluateCalibration(input = {}) {
  return safeCall(evaluateDecision, null, input) || {
    decision: input.conforme === false ? "NO_APTO" : "APTO",
    regla: "FALLBACK_SIMPLE"
  };
}

export default {
  analyzeEquipmentForCalibration,
  selectPatternsForCalibration,
  calculateCalibrationPoint,
  evaluateCalibration
};
