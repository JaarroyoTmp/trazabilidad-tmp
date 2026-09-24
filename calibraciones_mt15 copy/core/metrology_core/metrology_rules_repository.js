/* ===========================================================
   TMP METROLOGY RULES REPOSITORY V1
   -----------------------------------------------------------
   Base de conocimiento metrológico TMP.

   Objetivo:
   Centralizar por familia:
   - normas aplicables
   - procedimiento TMP
   - funciones a calibrar
   - patrones válidos
   - repeticiones
   - regla de decisión
   - criterios de auditoría
   - campos necesarios
   - evidencias para certificado

   Este módulo NO calcula.
   Alimenta:
   - procedure_builder.js
   - audit_trace_engine.js
   - decision_engine.js
   - certificados PDF
   =========================================================== */

export const TMP_DEFAULT_REPETITIONS = 5;

export const TMP_METROLOGY_RULES = {
  PIE_DE_REY: {
    nombre: "Pie de rey",
    grupo: "DIMENSIONAL",
    procedimiento_tmp: "MT15-CAP-03",
    documentos_base: [
      "SCI D-004 Calibración Pie de Rey",
      "DI-008 Calibración de pies de rey",
      "MT-15 Cap. 3",
      "ILAC-G8",
      "ISO 14253"
    ],
    funciones: [
      {
        id: "EXTERIORES",
        nombre: "Medición de exteriores",
        obligatorio: true,
        patron_preferido: ["BANCO_HORIZONTAL"],
        patron_alternativo: ["JUEGO_CALAS", "TRIDIMENSIONAL"],
        puntos_regla: "segun_rango",
        repeticiones: TMP_DEFAULT_REPETITIONS
      },
      {
        id: "INTERIORES",
        nombre: "Medición de interiores",
        obligatorio: true,
        patron_preferido: ["ANILLO_PATRON"],
        patron_alternativo: ["TRIDIMENSIONAL"],
        puntos_regla: "segun_rango",
        repeticiones: TMP_DEFAULT_REPETITIONS
      },
      {
        id: "SONDA_PROFUNDIDAD",
        nombre: "Sonda de profundidad",
        obligatorio: false,
        visible_si: "rango_max <= 300 && tiene_sonda",
        patron_preferido: ["JUEGO_CALAS"],
        patron_alternativo: ["BANCO_HORIZONTAL"],
        puntos_regla: "segun_rango",
        repeticiones: TMP_DEFAULT_REPETITIONS
      }
    ],
    criterio_tmp: {
      regla_global: "CUALQUIER_FUNCION_NO_OK_ES_NO_APTO",
      permite_uso_restringido: false,
      explicacion: "Si exteriores o interiores fallan, el pie de rey queda NO APTO. La sonda también condiciona el resultado si se incluye en la pauta."
    },
    auditoria: {
      debe_documentar: [
        "Funciones calibradas",
        "Patrones seleccionados por función",
        "Puntos de calibración",
        "5 lecturas por punto",
        "Media, error e incertidumbre",
        "Regla de decisión aplicada",
        "Decisión global TMP"
      ],
      texto_certificado: "La calibración del pie de rey se realiza por funciones de medida, empleando patrones trazables y aplicando regla de decisión documentada."
    }
  },

  MICROMETRO_EXTERIOR: {
    nombre: "Micrómetro de exteriores",
    grupo: "DIMENSIONAL",
    procedimiento_tmp: "MT15-CAP-02",
    documentos_base: [
      "SCI D-002 Calibración Micro Exteriores",
      "MT-15 Cap. 2",
      "ILAC-G8",
      "ISO 14253"
    ],
    funciones: [
      {
        id: "EXTERIORES",
        nombre: "Medición exterior",
        obligatorio: true,
        patron_preferido: ["JUEGO_CALAS"],
        patron_alternativo: ["BANCO_HORIZONTAL"],
        puntos_regla: "segun_rango",
        repeticiones: TMP_DEFAULT_REPETITIONS
      }
    ],
    criterio_tmp: {
      regla_global: "PEOR_PUNTO",
      permite_uso_restringido: false,
      explicacion: "El resultado global se establece según el peor punto evaluado."
    },
    auditoria: {
      debe_documentar: [
        "Bloques patrón o patrón longitudinal empleado",
        "Composición si aplica",
        "Corrección individual de los bloques",
        "Incertidumbre del patrón",
        "5 lecturas por punto",
        "Regla de decisión"
      ],
      texto_certificado: "La calibración del micrómetro exterior se realiza por comparación con patrones longitudinales trazables."
    }
  },

  MICROMETRO_INTERIOR_3_CONTACTOS: {
    nombre: "Micrómetro interior de 3 contactos",
    grupo: "DIMENSIONAL",
    procedimiento_tmp: "MT15-CAP-13",
    documentos_base: [
      "SCI D-018 Calibración Micro Interiores",
      "MT-15 Cap. 13",
      "ILAC-G8",
      "ISO 14253"
    ],
    funciones: [
      {
        id: "INTERIORES",
        nombre: "Medición interior",
        obligatorio: true,
        patron_preferido: ["ANILLO_PATRON"],
        patron_alternativo: ["TRIDIMENSIONAL"],
        puntos_regla: "segun_rango",
        repeticiones: TMP_DEFAULT_REPETITIONS
      }
    ],
    criterio_tmp: {
      regla_global: "PEOR_PUNTO",
      permite_uso_restringido: false,
      explicacion: "La decisión global se toma por el peor punto de calibración."
    },
    auditoria: {
      debe_documentar: [
        "Anillo patrón utilizado",
        "Certificado y vigencia del patrón",
        "Valor nominal y corrección del anillo",
        "5 lecturas por punto",
        "Incertidumbre",
        "Regla de decisión"
      ],
      texto_certificado: "La calibración del micrómetro interior se realiza mediante anillos patrón trazables o medio equivalente documentado."
    }
  },

  TAMPON_LISO_PNP: {
    nombre: "Tampón liso P/NP",
    grupo: "DIMENSIONAL_LIMITES",
    procedimiento_tmp: "MT15-CAP-08",
    documentos_base: [
      "ISO 1938-1",
      "DIN 2250-1",
      "MT-15 Cap. 8",
      "ILAC-G8",
      "ISO 14253"
    ],
    funciones: [
      {
        id: "PASA",
        nombre: "Lado PASA",
        obligatorio: true,
        patron_preferido: ["BANCO_HORIZONTAL"],
        patron_alternativo: ["JUEGO_CALAS", "TRIDIMENSIONAL"],
        nominal_regla: "nominal_pasa",
        repeticiones: TMP_DEFAULT_REPETITIONS
      },
      {
        id: "NO_PASA",
        nombre: "Lado NO PASA",
        obligatorio: true,
        patron_preferido: ["BANCO_HORIZONTAL"],
        patron_alternativo: ["JUEGO_CALAS", "TRIDIMENSIONAL"],
        nominal_regla: "nominal_no_pasa",
        repeticiones: TMP_DEFAULT_REPETITIONS
      }
    ],
    criterio_tmp: {
      regla_global: "CUALQUIER_LADO_NO_OK_ES_NO_APTO",
      permite_uso_restringido: false,
      explicacion: "El lado PASA y NO PASA se evalúan de forma independiente. Si cualquier lado falla, el calibre queda NO APTO."
    },
    auditoria: {
      debe_documentar: [
        "Nominal exacto del lado PASA",
        "Nominal exacto del lado NO PASA",
        "Patrón utilizado por lado",
        "Corrección e incertidumbre del patrón",
        "5 lecturas por lado",
        "Criterio de aceptación",
        "Regla de decisión"
      ],
      texto_certificado: "La calibración del tampón liso P/NP se realiza evaluando de forma independiente los lados PASA y NO PASA."
    }
  },

  TAMPON_ROSCADO_PNP: {
    nombre: "Tampón roscado P/NP",
    grupo: "DIMENSIONAL_ROSCAS",
    procedimiento_tmp: "PT-ROSCA-001",
    documentos_base: [
      "ISO 1502",
      "ISO 1938-1",
      "DIN 13",
      "DIN 2250-1",
      "ILAC-G8",
      "ISO 14253"
    ],
    funciones: [
      {
        id: "PASA",
        nombre: "Rosca lado PASA",
        obligatorio: true,
        patron_preferido: ["BANCO_HORIZONTAL"],
        patron_complementario: ["RODILLOS_ROSCA"],
        nominal_regla: "diametro_medio_pasa",
        repeticiones: TMP_DEFAULT_REPETITIONS
      },
      {
        id: "NO_PASA",
        nombre: "Rosca lado NO PASA",
        obligatorio: true,
        patron_preferido: ["BANCO_HORIZONTAL"],
        patron_complementario: ["RODILLOS_ROSCA"],
        nominal_regla: "diametro_medio_no_pasa",
        repeticiones: TMP_DEFAULT_REPETITIONS
      }
    ],
    criterio_tmp: {
      regla_global: "CUALQUIER_LADO_NO_OK_ES_NO_APTO",
      permite_uso_restringido: false,
      explicacion: "El motor debe calcular o proponer rodillos/hilos y diámetro medio. Cualquier lado no conforme implica NO APTO."
    },
    auditoria: {
      debe_documentar: [
        "Tipo de rosca",
        "Diámetro nominal",
        "Paso",
        "Clase",
        "Rodillo/hilo recomendado",
        "Método de medición sobre rodillos",
        "Banco horizontal utilizado",
        "5 lecturas por lado",
        "Regla de decisión"
      ],
      texto_certificado: "La calibración del tampón roscado se realiza por método de medición sobre rodillos/hilos, documentando tipo de rosca, paso, clase y patrón utilizado."
    },
    pendiente_enriquecer: [
      "Tablas completas para M, G/BSP, BSW, UNC, UNF y Helicoil.",
      "Cálculo normativo completo de diámetro medio y límites por clase.",
      "Desgaste permitido PASA/NO PASA."
    ]
  },

  ANILLO_PATRON: {
    nombre: "Anillo patrón",
    grupo: "PATRONES_DIMENSIONALES",
    procedimiento_tmp: "DI016",
    documentos_base: [
      "CEM DI-016",
      "DIN 2250-1",
      "EA-4/02",
      "ISO 14253"
    ],
    funciones: [
      {
        id: "DIAMETRO_INTERIOR",
        nombre: "Diámetro interior",
        obligatorio: true,
        patron_preferido: ["TRIDIMENSIONAL"],
        patron_alternativo: ["BANCO_HORIZONTAL"],
        puntos_regla: "centro_y_orientaciones",
        repeticiones: TMP_DEFAULT_REPETITIONS
      }
    ],
    criterio_tmp: {
      regla_global: "SEGUN_TOLERANCIA_E_INCERTIDUMBRE",
      permite_uso_restringido: false,
      explicacion: "El anillo se evalúa como patrón cilíndrico de diámetro y debe quedar trazado a patrón superior."
    },
    auditoria: {
      debe_documentar: [
        "Método DI-016 aplicado",
        "Orientaciones y alturas medidas si aplica",
        "Redondez/cilindricidad si aplica",
        "Tridimensional o medidora utilizada",
        "Incertidumbre",
        "Decisión"
      ],
      texto_certificado: "El anillo patrón se evalúa como patrón cilíndrico de diámetro conforme a procedimiento documentado."
    }
  },

  LLAVE_DINAMOMETRICA: {
    nombre: "Llave dinamométrica",
    grupo: "TORQUE",
    procedimiento_tmp: "PC-02-35",
    documentos_base: [
      "ISO 6789-1",
      "PEGC37",
      "EA-4/02",
      "ISO 14253"
    ],
    funciones: [
      {
        id: "TORQUE",
        nombre: "Puntos de par",
        obligatorio: true,
        patron_preferido: ["BANCO_TORQUE"],
        puntos_regla: "minimo_60_100",
        repeticiones: TMP_DEFAULT_REPETITIONS
      }
    ],
    criterio_tmp: {
      regla_global: "PEOR_PUNTO",
      permite_uso_restringido: false,
      explicacion: "La decisión se establece por el peor punto de par evaluado."
    },
    auditoria: {
      debe_documentar: [
        "Banco de torque utilizado",
        "Puntos de par",
        "5 lecturas por punto",
        "Clase/tipo de llave",
        "Criterio de aceptación",
        "Incertidumbre"
      ],
      texto_certificado: "La llave dinamométrica se calibra en puntos representativos del rango conforme a procedimiento documentado."
    }
  },

  BALANZA: {
    nombre: "Balanza",
    grupo: "MASA",
    procedimiento_tmp: "PROC-PC-BALANZA",
    documentos_base: [
      "OIML R76",
      "EA-4/02",
      "ISO 14253"
    ],
    funciones: [
      {
        id: "LINEALIDAD",
        nombre: "Linealidad",
        obligatorio: true,
        patron_preferido: ["PESAS_PATRON"],
        puntos_regla: "segun_alcance",
        repeticiones: TMP_DEFAULT_REPETITIONS
      },
      {
        id: "REPETIBILIDAD",
        nombre: "Repetibilidad",
        obligatorio: true,
        patron_preferido: ["PESAS_PATRON"],
        puntos_regla: "carga_media",
        repeticiones: TMP_DEFAULT_REPETITIONS
      },
      {
        id: "EXCENTRICIDAD",
        nombre: "Excentricidad",
        obligatorio: false,
        patron_preferido: ["PESAS_PATRON"],
        puntos_regla: "segun_plato",
        repeticiones: TMP_DEFAULT_REPETITIONS
      }
    ],
    criterio_tmp: {
      regla_global: "CUALQUIER_PRUEBA_NO_OK_ES_NO_APTO",
      permite_uso_restringido: false,
      explicacion: "Si una prueba obligatoria resulta no apta, la balanza queda NO APTA."
    },
    auditoria: {
      debe_documentar: [
        "Pesas patrón utilizadas",
        "Pruebas realizadas",
        "Condiciones ambientales",
        "Lecturas",
        "Incertidumbre",
        "Decisión"
      ],
      texto_certificado: "La balanza se evalúa mediante pruebas de linealidad, repetibilidad y excentricidad cuando aplique."
    }
  },

  DUROMETRO: {
    nombre: "Durómetro",
    grupo: "DUREZA",
    procedimiento_tmp: "DUR-001",
    documentos_base: [
      "ISO 6506",
      "ISO 6508",
      "ISO 14253"
    ],
    funciones: [
      {
        id: "DUREZA",
        nombre: "Verificación de escala de dureza",
        obligatorio: true,
        patron_preferido: ["PATRON_DUREZA"],
        puntos_regla: "segun_escala",
        repeticiones: TMP_DEFAULT_REPETITIONS
      }
    ],
    criterio_tmp: {
      regla_global: "PEOR_PUNTO",
      permite_uso_restringido: false,
      explicacion: "La decisión se establece por la escala/punto evaluado más desfavorable."
    },
    auditoria: {
      debe_documentar: [
        "Escala de dureza",
        "Patrón de dureza utilizado",
        "Lecturas",
        "Condiciones de ensayo",
        "Criterio de aceptación"
      ],
      texto_certificado: "El durómetro se verifica mediante patrones de dureza trazables en la escala aplicable."
    }
  }
};

export function getMetrologyRules(familyKey) {
  const key = String(familyKey || "").toUpperCase();
  return TMP_METROLOGY_RULES[key] || null;
}

export function listMetrologyRuleFamilies() {
  return Object.keys(TMP_METROLOGY_RULES);
}

export function getAuditRequirements(familyKey) {
  const cfg = getMetrologyRules(familyKey);
  if (!cfg) {
    return {
      family: familyKey,
      debe_documentar: [],
      texto_certificado: "",
      warnings: [`No existe regla documental para ${familyKey}`]
    };
  }

  return {
    family: familyKey,
    procedimiento_tmp: cfg.procedimiento_tmp,
    documentos_base: cfg.documentos_base || [],
    debe_documentar: cfg.auditoria?.debe_documentar || [],
    texto_certificado: cfg.auditoria?.texto_certificado || "",
    criterio_tmp: cfg.criterio_tmp || null,
    warnings: cfg.pendiente_enriquecer || []
  };
}

export function getProcedureHints(familyKey) {
  const cfg = getMetrologyRules(familyKey);
  if (!cfg) return null;

  return {
    family: familyKey,
    procedimiento_tmp: cfg.procedimiento_tmp,
    documentos_base: cfg.documentos_base,
    funciones: cfg.funciones,
    criterio_tmp: cfg.criterio_tmp
  };
}
