/* ===========================================================
   TMP NORMATIVE REGISTRY V1
   -----------------------------------------------------------
   Registro de referencias normativas/procedimentales TMP.

   Objetivo:
   - No calcular.
   - Documentar qué documentos soportan cada familia/proceso.
   - Servir al informe de auditoría de calibración.

   Nota:
   Este registro se irá enriqueciendo al exprimir la documentación.
   =========================================================== */

export const TMP_NORMATIVE_REGISTRY = {
  GENERAL_METROLOGY: {
    titulo: "Metrología general e incertidumbre",
    referencias: [
      {
        codigo: "EA-4/02",
        titulo: "Expression of the Uncertainty of Measurement in Calibration",
        uso: "Criterio general para evaluación y expresión de incertidumbre de medida.",
        tipo: "guia_incertidumbre"
      },
      {
        codigo: "GUM",
        titulo: "Guía para la expresión de la incertidumbre de medida",
        uso: "Base para incertidumbre típica, combinada y expandida.",
        tipo: "guia_incertidumbre"
      },
      {
        codigo: "VIM",
        titulo: "Vocabulario Internacional de Metrología",
        uso: "Terminología metrológica.",
        tipo: "vocabulario"
      },
      {
        codigo: "ILAC-G8",
        titulo: "Decision Rules and Statements of Conformity",
        uso: "Regla de decisión para declaración de conformidad.",
        tipo: "regla_decision"
      },
      {
        codigo: "ISO 14253-1",
        titulo: "Decision rules for proving conformity or nonconformity with specifications",
        uso: "Reglas de decisión GPS para conformidad/no conformidad.",
        tipo: "regla_decision"
      }
    ]
  },

  PIE_DE_REY: {
    titulo: "Pie de rey",
    procedimiento_tmp: "MT15-CAP-03",
    referencias: [
      {
        codigo: "DI-008",
        titulo: "Procedimiento para la calibración de pies de rey",
        uso: "Método, puntos de calibración, patrones, repetibilidad e incertidumbre.",
        tipo: "procedimiento_calibracion"
      },
      {
        codigo: "SCI D-004",
        titulo: "Calibración de pie de rey",
        uso: "Procedimiento interno/de referencia complementario.",
        tipo: "procedimiento_calibracion"
      },
      {
        codigo: "MT15-CAP-03",
        titulo: "Pie de rey",
        uso: "Procedimiento TMP / MT15 aplicado.",
        tipo: "procedimiento_tmp"
      }
    ],
    reglas_extraidas: [
      "Calibrar los palpadores o funciones disponibles del pie de rey.",
      "Para exteriores se deben cubrir varias longitudes del campo de medida, incluyendo mínimo y máximo o próximo.",
      "Para exteriores se pueden usar bloques patrón longitudinales o barras patrón.",
      "Para interiores se pueden usar patrones lisos de diámetro interior o accesorios con bloques patrón.",
      "TMP mantiene 5 registros por punto como regla interna de ejecución."
    ]
  },

  MICROMETRO_EXTERIOR: {
    titulo: "Micrómetro de exteriores",
    procedimiento_tmp: "MT15-CAP-02",
    referencias: [
      {
        codigo: "SCI D-002",
        titulo: "Calibración de micrómetro de exteriores",
        uso: "Procedimiento de calibración de micrómetros exteriores.",
        tipo: "procedimiento_calibracion"
      },
      {
        codigo: "MT15-CAP-02",
        titulo: "Micrómetro de exteriores",
        uso: "Procedimiento TMP / MT15 aplicado.",
        tipo: "procedimiento_tmp"
      }
    ],
    reglas_extraidas: [
      "Calibración por puntos dentro del rango del micrómetro.",
      "Uso preferente de bloques patrón longitudinales.",
      "TMP mantiene 5 registros por punto como regla interna de ejecución."
    ]
  },

  MICROMETRO_INTERIOR_3_CONTACTOS: {
    titulo: "Micrómetro interior de 3 contactos",
    procedimiento_tmp: "MT15-CAP-13",
    referencias: [
      {
        codigo: "SCI D-018",
        titulo: "Calibración de micrómetro de interiores",
        uso: "Procedimiento de calibración de micrómetros interiores.",
        tipo: "procedimiento_calibracion"
      },
      {
        codigo: "MT15-CAP-13",
        titulo: "Micrómetro de interiores",
        uso: "Procedimiento TMP / MT15 aplicado.",
        tipo: "procedimiento_tmp"
      }
    ],
    reglas_extraidas: [
      "Uso de anillos patrón o medios equivalentes trazables.",
      "Evaluación por puntos dentro del rango.",
      "TMP mantiene 5 registros por punto como regla interna de ejecución."
    ]
  },

  TAMPON_LISO_PNP: {
    titulo: "Tampón liso P/NP",
    procedimiento_tmp: "MT15-CAP-08",
    referencias: [
      {
        codigo: "ISO 1938-1",
        titulo: "GPS - Dimensional measuring equipment - Plain limit gauges",
        uso: "Características de calibres límite y reglas de uso para calibres lisos.",
        tipo: "norma_producto"
      },
      {
        codigo: "DIN 2250-1",
        titulo: "Gauges / limit gauges",
        uso: "Criterios para calibres límite y desgaste cuando aplique.",
        tipo: "norma_producto"
      },
      {
        codigo: "MT15-CAP-08",
        titulo: "Calibres pasa / no pasa",
        uso: "Procedimiento TMP / MT15 aplicado.",
        tipo: "procedimiento_tmp"
      }
    ],
    reglas_extraidas: [
      "Evaluación separada de lado PASA y lado NO PASA.",
      "Cualquier lado NO APTO convierte el equipo en NO APTO según criterio TMP.",
      "El nominal del lado PASA y NO PASA debe tratarse de forma independiente."
    ]
  },

  TAMPON_ROSCADO_PNP: {
    titulo: "Tampón roscado P/NP",
    procedimiento_tmp: "PT-ROSCA-001",
    referencias: [
      {
        codigo: "ISO 1938-1",
        titulo: "GPS - Dimensional measuring equipment - Limit gauges",
        uso: "Criterios generales de calibres límite.",
        tipo: "norma_producto"
      },
      {
        codigo: "DIN 2250-1",
        titulo: "Gauges / limit gauges",
        uso: "Criterios de calibres y desgaste.",
        tipo: "norma_producto"
      },
      {
        codigo: "ISO 1502",
        titulo: "ISO general purpose metric screw threads - Gauges and gauging",
        uso: "Referencia futura para roscas métricas y calibres de rosca.",
        tipo: "norma_roscas"
      },
      {
        codigo: "DIN 13",
        titulo: "Métrica ISO",
        uso: "Datos de rosca métrica.",
        tipo: "norma_roscas"
      }
    ],
    reglas_extraidas: [
      "Evaluación separada de lado PASA y NO PASA.",
      "El operario no calcula rodillos: el motor debe proponer rodillo/hilo adecuado.",
      "La lectura reportada debe corresponder al diámetro medio/sobre rodillos según tipo de rosca.",
      "Cualquier lado NO APTO convierte el equipo en NO APTO según criterio TMP."
    ]
  },

  BLOQUES_PATRON: {
    titulo: "Bloques patrón longitudinales",
    referencias: [
      {
        codigo: "DI-014",
        titulo: "Calibración de bloques patrón longitudinales por comparación",
        uso: "Criterios de calibración, repetición, variación de longitud e incertidumbre.",
        tipo: "procedimiento_calibracion"
      },
      {
        codigo: "ISO 3650",
        titulo: "Geometrical product specifications - Length standards - Gauge blocks",
        uso: "Requisitos de bloques patrón.",
        tipo: "norma_producto"
      }
    ],
    reglas_extraidas: [
      "Los bloques patrón pueden tener corrección e incertidumbre individual.",
      "Las composiciones deben limitar el número de bloques cuando sea posible.",
      "La incertidumbre de composición se calcula combinando contribuciones de cada bloque."
    ]
  },

  LLAVE_DINAMOMETRICA: {
    titulo: "Llave dinamométrica",
    procedimiento_tmp: "PC-02-35",
    referencias: [
      {
        codigo: "ISO 6789-1",
        titulo: "Assembly tools for screws and nuts - Hand torque tools",
        uso: "Requisitos y clasificación de herramientas dinamométricas.",
        tipo: "norma_producto"
      },
      {
        codigo: "PEGC37",
        titulo: "Calibración de llaves dinamométricas",
        uso: "Procedimiento complementario.",
        tipo: "procedimiento_calibracion"
      },
      {
        codigo: "PC-02-35",
        titulo: "Calibración de llaves dinamométricas",
        uso: "Procedimiento TMP aplicado.",
        tipo: "procedimiento_tmp"
      }
    ],
    reglas_extraidas: [
      "Evaluar puntos representativos del rango.",
      "Cualquier punto fuera de criterio afecta al resultado global según peor punto o criterio TMP."
    ]
  },

  BALANZA: {
    titulo: "Balanza / báscula",
    procedimiento_tmp: "PROC-PC-BALANZA",
    referencias: [
      {
        codigo: "OIML R76",
        titulo: "Non-automatic weighing instruments",
        uso: "Referencia metrológica para instrumentos de pesaje.",
        tipo: "norma_producto"
      },
      {
        codigo: "PROC-PC-BALANZA",
        titulo: "Calibración de báscula",
        uso: "Procedimiento TMP aplicado.",
        tipo: "procedimiento_tmp"
      }
    ],
    reglas_extraidas: [
      "Evaluación de linealidad, repetibilidad y excentricidad cuando aplique.",
      "Cualquier prueba NO APTA convierte el equipo en NO APTO según criterio TMP."
    ]
  },

  DUROMETRO: {
    titulo: "Durómetro",
    referencias: [
      {
        codigo: "ISO 6506",
        titulo: "Brinell hardness test",
        uso: "Requisitos para dureza Brinell.",
        tipo: "norma_producto"
      },
      {
        codigo: "ISO 6508",
        titulo: "Rockwell hardness test",
        uso: "Requisitos para dureza Rockwell.",
        tipo: "norma_producto"
      }
    ],
    reglas_extraidas: [
      "Uso de patrones de dureza trazables.",
      "Evaluación por escala de dureza y puntos/patrones aplicables."
    ]
  }
};

export function getNormativeTraceForFamily(familyKey) {
  const key = String(familyKey || "").toUpperCase();
  const general = TMP_NORMATIVE_REGISTRY.GENERAL_METROLOGY;
  const family = TMP_NORMATIVE_REGISTRY[key];

  if (!family) {
    return {
      family: key,
      referencias_generales: general.referencias,
      referencias_familia: [],
      reglas_extraidas: [],
      warnings: [`No hay registro normativo especifico para ${key}.`]
    };
  }

  return {
    family: key,
    titulo: family.titulo,
    procedimiento_tmp: family.procedimiento_tmp || null,
    referencias_generales: general.referencias,
    referencias_familia: family.referencias || [],
    reglas_extraidas: family.reglas_extraidas || [],
    warnings: []
  };
}

export function listNormativeFamilies() {
  return Object.keys(TMP_NORMATIVE_REGISTRY).filter((k) => k !== "GENERAL_METROLOGY");
}
