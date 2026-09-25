/* ===========================================================
   TMP METROLOGY CORE - CALIBRATION STRATEGY RULES V1
   Reglas de estrategia de calibracion por tipo de equipo.

   Objetivo:
   - No sustituye al calculo.
   - Define que funciones se calibran, que preguntas hacer,
     que patrones son preferentes y como decidir el resultado global.
   =========================================================== */

export const CALIBRATION_STRATEGY_RULES = {
  PIE_DE_REY: {
    id: "PIE_DE_REY",
    procedimiento: "MT15-CAP-03",
    norma: "MT-15 Cap. 3 - Pie de Rey",
    metodo: "VARIABLES",
    repeticiones: 5,
    unidad: "mm",
    seleccion_dinamica: true,

    preguntas: [
      {
        id: "calibrar_exteriores",
        texto: "¿Calibrar exteriores / boca?",
        defecto: true,
        visible_si: "siempre",
        obligatorio: true
      },
      {
        id: "calibrar_interiores",
        texto: "¿Calibrar interiores / puntas?",
        defecto: true,
        visible_si: "siempre",
        obligatorio: true
      },
      {
        id: "calibrar_sonda",
        texto: "¿Calibrar sonda de profundidad?",
        defecto: true,
        visible_si: "rango_max <= 300 && tiene_sonda !== false",
        obligatorio: false
      }
    ],

    estrategias: {
      exteriores: {
        id: "exteriores",
        nombre: "Calibracion de exteriores / boca",
        activar_con: "calibrar_exteriores",
        patron_preferido: ["BANCO_HORIZONTAL", "JUEGO_CALAS"],
        patron_alternativo: ["CALAS_PATRON"],
        puntos: "segun_rango_equipo",
        repeticiones: 5,
        resultado_obligatorio: true
      },
      interiores: {
        id: "interiores",
        nombre: "Calibracion de interiores / puntas",
        activar_con: "calibrar_interiores",
        patron_preferido: ["ANILLO_PATRON"],
        patron_alternativo: ["BANCO_HORIZONTAL"],
        puntos: "segun_rango_equipo",
        repeticiones: 5,
        resultado_obligatorio: true
      },
      sonda: {
        id: "sonda",
        nombre: "Calibracion de sonda de profundidad",
        activar_con: "calibrar_sonda",
        patron_preferido: ["JUEGO_CALAS", "CALAS_PATRON"],
        patron_alternativo: ["BANCO_HORIZONTAL"],
        puntos: "segun_rango_equipo",
        repeticiones: 5,
        resultado_obligatorio: true
      }
    },

    decision_global: {
      regla: "CUALQUIER_FUNCION_NO_OK_ES_NO_APTO",
      permite_uso_restringido: false,
      mensaje_no_apto: "Pie de rey NO APTO: si falla exteriores, interiores o la sonda incluida en la pauta, el equipo completo queda no apto."
    }
  },

  TAMPON_LISO_PNP: {
    id: "TAMPON_LISO_PNP",
    procedimiento: "MT15-CAP-08",
    norma: "MT-15 Cap. 8 - Calibres Pasa-No Pasa",
    norma_apoyo: "DIN 7162",
    metodo: "VARIABLES",
    repeticiones: 5,
    unidad: "mm",
    seleccion_dinamica: false,

    estrategias: {
      lado_pasa: {
        id: "lado_pasa",
        nombre: "Calibracion lado PASA / GO",
        patron_preferido: ["BANCO_HORIZONTAL"],
        patron_alternativo: ["MICROMETRO_MILESIMAL"],
        puntos: "nominal_lado_pasa",
        repeticiones: 5,
        resultado_obligatorio: true
      },
      lado_no_pasa: {
        id: "lado_no_pasa",
        nombre: "Calibracion lado NO PASA / NO GO",
        patron_preferido: ["BANCO_HORIZONTAL"],
        patron_alternativo: ["MICROMETRO_MILESIMAL"],
        puntos: "nominal_lado_no_pasa",
        repeticiones: 5,
        resultado_obligatorio: true
      }
    },

    decision_global: {
      regla: "CUALQUIER_LADO_NO_OK_ES_NO_APTO",
      permite_uso_restringido: false
    }
  },

  MICROMETRO_EXTERIOR: {
    id: "MICROMETRO_EXTERIOR",
    procedimiento: "MT15-CAP-02",
    norma: "MT-15 Cap. 2 - Micrometro de Exteriores",
    metodo: "VARIABLES",
    repeticiones: 5,
    unidad: "mm",
    estrategias: {
      cero: {
        id: "cero",
        nombre: "Comprobacion del cero",
        patron_preferido: ["JUEGO_CALAS", "CALAS_PATRON"],
        puntos: "extremo_inferior",
        repeticiones: 5,
        resultado_obligatorio: true
      },
      calibracion: {
        id: "calibracion",
        nombre: "Calibracion en extremo inferior, centro y extremo superior",
        patron_preferido: ["JUEGO_CALAS", "CALAS_PATRON"],
        puntos: "segun_rango_mt15_cap2",
        repeticiones: 5,
        resultado_obligatorio: true
      }
    },
    decision_global: {
      regla: "CUALQUIER_FUNCION_NO_OK_ES_NO_APTO",
      permite_uso_restringido: false
    }
  },

  MICROMETRO_INTERIOR_3_CONTACTOS: {
    id: "MICROMETRO_INTERIOR_3_CONTACTOS",
    procedimiento: "MT15-CAP-13",
    norma: "MT-15 Cap. 13 - Micrometro de Interiores",
    metodo: "VARIABLES",
    repeticiones: 5,
    unidad: "mm",
    estrategias: {
      cero: {
        id: "cero",
        nombre: "Comprobacion del cero",
        patron_preferido: ["ANILLO_PATRON"],
        puntos: "anillo_segun_rango",
        repeticiones: 5,
        resultado_obligatorio: true
      },
      calibracion: {
        id: "calibracion",
        nombre: "Calibracion con anillo patron",
        patron_preferido: ["ANILLO_PATRON"],
        puntos: "anillo_segun_rango",
        repeticiones: 5,
        resultado_obligatorio: true
      }
    },
    decision_global: {
      regla: "CUALQUIER_FUNCION_NO_OK_ES_NO_APTO",
      permite_uso_restringido: false
    }
  },

  ANILLO_PATRON: {
    id: "ANILLO_PATRON",
    procedimiento: "TMP-DIM-ANILLO",
    norma: "Procedimiento interno TMP - Anillo patron",
    metodo: "VARIABLES",
    repeticiones: 5,
    unidad: "mm",
    estrategias: {
      diametro: {
        id: "diametro",
        nombre: "Calibracion de diametro de anillo patron",
        patron_preferido: ["TRIDIMENSIONAL"],
        patron_alternativo: ["BANCO_HORIZONTAL"],
        puntos: "diametro_nominal",
        repeticiones: 5,
        resultado_obligatorio: true
      }
    },
    decision_global: {
      regla: "CUALQUIER_FUNCION_NO_OK_ES_NO_APTO",
      permite_uso_restringido: false
    }
  }
};

export function obtenerEstrategiaCalibracion(tipoEquipo) {
  return CALIBRATION_STRATEGY_RULES[tipoEquipo] || null;
}

export function evaluarVisibilidadPregunta(pregunta, instrumento = {}) {
  if (!pregunta || pregunta.visible_si === "siempre") return true;

  const rangoMax = Number(
    instrumento.rango_max ??
    instrumento.rangoMax ??
    instrumento.max ??
    extraerRangoMaxDesdeTexto(instrumento.rango || instrumento.descripcion || "") ??
    0
  );

  const tieneSonda = instrumento.tiene_sonda !== false;

  if (pregunta.visible_si === "rango_max <= 300 && tiene_sonda !== false") {
    return rangoMax > 0 && rangoMax <= 300 && tieneSonda;
  }

  return true;
}

export function extraerRangoMaxDesdeTexto(texto = "") {
  const t = String(texto).replace(",", ".");
  const matchRango = t.match(/(\d+(?:\.\d+)?)\s*[-a]\s*(\d+(?:\.\d+)?)/i);
  if (matchRango) return Number(matchRango[2]);

  const nums = [...t.matchAll(/\d+(?:\.\d+)?/g)].map(m => Number(m[0]));
  if (!nums.length) return null;
  return Math.max(...nums);
}

export function construirPreguntasEstrategia(tipoEquipo, instrumento = {}) {
  const regla = obtenerEstrategiaCalibracion(tipoEquipo);
  if (!regla || !Array.isArray(regla.preguntas)) return [];

  return regla.preguntas.filter(p => evaluarVisibilidadPregunta(p, instrumento));
}

export function construirEstrategiasActivas(tipoEquipo, respuestas = {}) {
  const regla = obtenerEstrategiaCalibracion(tipoEquipo);
  if (!regla) return [];

  const estrategias = Object.values(regla.estrategias || {});

  return estrategias.filter(est => {
    if (!est.activar_con) return true;
    return respuestas[est.activar_con] === true;
  });
}
