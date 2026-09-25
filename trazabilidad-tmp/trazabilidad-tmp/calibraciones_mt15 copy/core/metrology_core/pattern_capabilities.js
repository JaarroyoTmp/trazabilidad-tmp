/* ===========================================================
   TMP METROLOGY CORE - PATTERN CAPABILITIES V1
   -----------------------------------------------------------
   Este archivo NO contiene patrones concretos.
   Define QUE TIPOS DE PATRON sirven para calibrar cada familia.

   Los patrones reales deben venir desde Supabase:
   - patrones
   - instrumentos marcados como patron/equipo patron
   - certificados externos vigentes
   =========================================================== */

export const PATTERN_TYPES = {
  BANCO_HORIZONTAL: "BANCO_HORIZONTAL",
  TRIDIMENSIONAL: "TRIDIMENSIONAL",
  JUEGO_CALAS: "JUEGO_CALAS",
  CALA_INDIVIDUAL: "CALA_INDIVIDUAL",
  ANILLO_PATRON: "ANILLO_PATRON",
  ANILLO_ROSCA: "ANILLO_ROSCA",
  PATRON_ROSCA: "PATRON_ROSCA",
  PATRON_DUREZA: "PATRON_DUREZA",
  PATRON_RUGOSIDAD: "PATRON_RUGOSIDAD",
  TERMOMETRO_PATRON: "TERMOMETRO_PATRON",
  PESA_PATRON: "PESA_PATRON",
  BANCO_TORQUE: "BANCO_TORQUE",
  BLOQUE_ANGULAR: "BLOQUE_ANGULAR",
  REGLA_SENOS: "REGLA_SENOS",
  COMPARADOR_PATRON: "COMPARADOR_PATRON",
  MICROMETRO_MILESIMAL: "MICROMETRO_MILESIMAL"
};

export const PATTERN_ROLES = {
  PATRON_MAESTRO: "PATRON_MAESTRO",
  PATRON_SECUNDARIO: "PATRON_SECUNDARIO",
  EQUIPO_PATRON: "EQUIPO_PATRON",
  EQUIPO_AUXILIAR: "EQUIPO_AUXILIAR"
};

export const TRACEABILITY_REQUIREMENTS = {
  EXTERNA_ENAC: "EXTERNA_ENAC",
  EXTERNA_ACREDITADA: "EXTERNA_ACREDITADA",
  INTERNA_CON_PATRON_MAESTRO: "INTERNA_CON_PATRON_MAESTRO",
  SOLO_CONTROL_INTERNO: "SOLO_CONTROL_INTERNO"
};

/*
  CAPABILITIES:
  familia_equipo -> tipos de patron admisibles y preferencia.

  prioridad 1 = opcion recomendada
  prioridad 2 = alternativa tecnica
  prioridad 3 = alternativa bajo validacion
*/
export const PATTERN_CAPABILITIES = {
  TAMPON_LISO_PNP: {
    requiere_trazabilidad: TRACEABILITY_REQUIREMENTS.EXTERNA_ACREDITADA,
    unidad: "mm",
    patrones_recomendados: [
      { tipo: PATTERN_TYPES.BANCO_HORIZONTAL, rol: PATTERN_ROLES.EQUIPO_PATRON, prioridad: 1 },
      { tipo: PATTERN_TYPES.JUEGO_CALAS, rol: PATTERN_ROLES.PATRON_MAESTRO, prioridad: 1 },
      { tipo: PATTERN_TYPES.COMPARADOR_PATRON, rol: PATTERN_ROLES.EQUIPO_AUXILIAR, prioridad: 2 },
      { tipo: PATTERN_TYPES.MICROMETRO_MILESIMAL, rol: PATTERN_ROLES.EQUIPO_PATRON, prioridad: 3 }
    ],
    notas: [
      "Aplicable a calibres pasa/no pasa lisos por variables.",
      "El banco horizontal debe tener calibracion vigente.",
      "Las calas usadas como referencia deben tener incertidumbre, k y correccion registradas."
    ]
  },

  TAMPON_ROSCA_PNP: {
    requiere_trazabilidad: TRACEABILITY_REQUIREMENTS.EXTERNA_ACREDITADA,
    unidad: "mm",
    patrones_recomendados: [
      { tipo: PATTERN_TYPES.PATRON_ROSCA, rol: PATTERN_ROLES.PATRON_MAESTRO, prioridad: 1 },
      { tipo: PATTERN_TYPES.BANCO_HORIZONTAL, rol: PATTERN_ROLES.EQUIPO_PATRON, prioridad: 2 },
      { tipo: PATTERN_TYPES.TRIDIMENSIONAL, rol: PATTERN_ROLES.EQUIPO_PATRON, prioridad: 3 }
    ],
    notas: [
      "Requiere tratamiento especifico de rosca.",
      "El motor debe validar paso, diametro nominal y tipo de rosca antes de recomendar patron."
    ]
  },

  ANILLO_PATRON: {
    requiere_trazabilidad: TRACEABILITY_REQUIREMENTS.EXTERNA_ACREDITADA,
    unidad: "mm",
    patrones_recomendados: [
      { tipo: PATTERN_TYPES.BANCO_HORIZONTAL, rol: PATTERN_ROLES.EQUIPO_PATRON, prioridad: 1 },
      { tipo: PATTERN_TYPES.JUEGO_CALAS, rol: PATTERN_ROLES.PATRON_MAESTRO, prioridad: 1 },
      { tipo: PATTERN_TYPES.TRIDIMENSIONAL, rol: PATTERN_ROLES.EQUIPO_PATRON, prioridad: 2 }
    ],
    notas: [
      "Seleccionar puntos/patrones segun diametro nominal y rango.",
      "Debe registrarse correccion e incertidumbre del patron utilizado."
    ]
  },

  ANILLO_ROSCA: {
    requiere_trazabilidad: TRACEABILITY_REQUIREMENTS.EXTERNA_ACREDITADA,
    unidad: "mm",
    patrones_recomendados: [
      { tipo: PATTERN_TYPES.PATRON_ROSCA, rol: PATTERN_ROLES.PATRON_MAESTRO, prioridad: 1 },
      { tipo: PATTERN_TYPES.TRIDIMENSIONAL, rol: PATTERN_ROLES.EQUIPO_PATRON, prioridad: 2 }
    ],
    notas: [
      "Requiere validacion de tipo de rosca, paso y diametro.",
      "Puede requerir procedimiento externo si no hay patron adecuado."
    ]
  },

  MICROMETRO_EXTERIORES: {
    requiere_trazabilidad: TRACEABILITY_REQUIREMENTS.EXTERNA_ACREDITADA,
    unidad: "mm",
    patrones_recomendados: [
      { tipo: PATTERN_TYPES.JUEGO_CALAS, rol: PATTERN_ROLES.PATRON_MAESTRO, prioridad: 1 },
      { tipo: PATTERN_TYPES.CALA_INDIVIDUAL, rol: PATTERN_ROLES.PATRON_MAESTRO, prioridad: 2 }
    ],
    notas: [
      "Pauta tipica MT-15: extremo inferior, centro y extremo superior del rango.",
      "Para 0-25 mm: 1, 12.5 y 24 mm."
    ]
  },

  MICROMETRO_INTERIORES_3_CONTACTOS: {
    requiere_trazabilidad: TRACEABILITY_REQUIREMENTS.EXTERNA_ACREDITADA,
    unidad: "mm",
    patrones_recomendados: [
      { tipo: PATTERN_TYPES.ANILLO_PATRON, rol: PATTERN_ROLES.PATRON_MAESTRO, prioridad: 1 },
      { tipo: PATTERN_TYPES.ANILLO_PATRON, rol: PATTERN_ROLES.PATRON_SECUNDARIO, prioridad: 2 }
    ],
    notas: [
      "El anillo recomendado debe estar dentro del rango del micrometro interior.",
      "Si hay varios anillos validos, priorizar nominal mas cercano al rango de uso."
    ]
  },

  PIE_DE_REY: {
    requiere_trazabilidad: TRACEABILITY_REQUIREMENTS.EXTERNA_ACREDITADA,
    unidad: "mm",
    patrones_recomendados: [
      { tipo: PATTERN_TYPES.JUEGO_CALAS, rol: PATTERN_ROLES.PATRON_MAESTRO, prioridad: 1 },
      { tipo: PATTERN_TYPES.ANILLO_PATRON, rol: PATTERN_ROLES.PATRON_MAESTRO, prioridad: 2 }
    ],
    notas: [
      "Debe cubrir boca exterior, puntas interiores y sonda si aplica.",
      "El anillo patron puede usarse para verificacion de interiores."
    ]
  },

  RELOJ_COMPARADOR_MILESIMAL: {
    requiere_trazabilidad: TRACEABILITY_REQUIREMENTS.EXTERNA_ACREDITADA,
    unidad: "mm",
    patrones_recomendados: [
      { tipo: PATTERN_TYPES.BANCO_HORIZONTAL, rol: PATTERN_ROLES.EQUIPO_PATRON, prioridad: 1 },
      { tipo: PATTERN_TYPES.JUEGO_CALAS, rol: PATTERN_ROLES.PATRON_MAESTRO, prioridad: 2 }
    ],
    notas: [
      "Requiere patron/equipo con incertidumbre adecuada a lectura milesimal.",
      "Validar recorrido y division de escala."
    ]
  },

  RELOJ_COMPARADOR_CENTESIMAL: {
    requiere_trazabilidad: TRACEABILITY_REQUIREMENTS.EXTERNA_ACREDITADA,
    unidad: "mm",
    patrones_recomendados: [
      { tipo: PATTERN_TYPES.BANCO_HORIZONTAL, rol: PATTERN_ROLES.EQUIPO_PATRON, prioridad: 1 },
      { tipo: PATTERN_TYPES.JUEGO_CALAS, rol: PATTERN_ROLES.PATRON_MAESTRO, prioridad: 2 }
    ],
    notas: [
      "Menor exigencia que milesimal, pero requiere trazabilidad vigente."
    ]
  },

  GRAMIL: {
    requiere_trazabilidad: TRACEABILITY_REQUIREMENTS.EXTERNA_ACREDITADA,
    unidad: "mm",
    patrones_recomendados: [
      { tipo: PATTERN_TYPES.JUEGO_CALAS, rol: PATTERN_ROLES.PATRON_MAESTRO, prioridad: 1 },
      { tipo: PATTERN_TYPES.BANCO_HORIZONTAL, rol: PATTERN_ROLES.EQUIPO_PATRON, prioridad: 2 },
      { tipo: PATTERN_TYPES.TRIDIMENSIONAL, rol: PATTERN_ROLES.EQUIPO_PATRON, prioridad: 3 }
    ],
    notas: [
      "Validar altura y sistema de lectura.",
      "Puede requerir marmol o base de referencia."
    ]
  },

  SONDA_ALTURA: {
    requiere_trazabilidad: TRACEABILITY_REQUIREMENTS.EXTERNA_ACREDITADA,
    unidad: "mm",
    patrones_recomendados: [
      { tipo: PATTERN_TYPES.JUEGO_CALAS, rol: PATTERN_ROLES.PATRON_MAESTRO, prioridad: 1 },
      { tipo: PATTERN_TYPES.TRIDIMENSIONAL, rol: PATTERN_ROLES.EQUIPO_PATRON, prioridad: 2 }
    ],
    notas: [
      "Validar recorrido, cero y puntos de altura."
    ]
  },

  CALIBRE_CHAFLAN_ANGULO: {
    requiere_trazabilidad: TRACEABILITY_REQUIREMENTS.EXTERNA_ACREDITADA,
    unidad: "grados/mm",
    patrones_recomendados: [
      { tipo: PATTERN_TYPES.BLOQUE_ANGULAR, rol: PATTERN_ROLES.PATRON_MAESTRO, prioridad: 1 },
      { tipo: PATTERN_TYPES.REGLA_SENOS, rol: PATTERN_ROLES.PATRON_MAESTRO, prioridad: 2 },
      { tipo: PATTERN_TYPES.TRIDIMENSIONAL, rol: PATTERN_ROLES.EQUIPO_PATRON, prioridad: 3 }
    ],
    notas: [
      "Seleccionar patron segun angulo nominal: 30, 45, 60 grados, etc.",
      "Si no existe patron angular, derivar a tridimensional o calibracion externa."
    ]
  },

  CALIBRE_HERRADURA: {
    requiere_trazabilidad: TRACEABILITY_REQUIREMENTS.EXTERNA_ACREDITADA,
    unidad: "mm",
    patrones_recomendados: [
      { tipo: PATTERN_TYPES.JUEGO_CALAS, rol: PATTERN_ROLES.PATRON_MAESTRO, prioridad: 1 },
      { tipo: PATTERN_TYPES.BANCO_HORIZONTAL, rol: PATTERN_ROLES.EQUIPO_PATRON, prioridad: 2 }
    ],
    notas: [
      "Tratar como quijada/calibre pasa-no pasa cuando aplique.",
      "Validar lado pasa y no pasa si existe."
    ]
  },

  VARILLA: {
    requiere_trazabilidad: TRACEABILITY_REQUIREMENTS.EXTERNA_ACREDITADA,
    unidad: "mm",
    patrones_recomendados: [
      { tipo: PATTERN_TYPES.BANCO_HORIZONTAL, rol: PATTERN_ROLES.EQUIPO_PATRON, prioridad: 1 },
      { tipo: PATTERN_TYPES.TRIDIMENSIONAL, rol: PATTERN_ROLES.EQUIPO_PATRON, prioridad: 2 }
    ],
    notas: [
      "Seleccionar metodo segun uso: patron dimensional, util o elemento de control."
    ]
  },

  UTILLAJE_FABRICACION_PROPIA: {
    requiere_trazabilidad: TRACEABILITY_REQUIREMENTS.INTERNA_CON_PATRON_MAESTRO,
    unidad: "segun_plano",
    patrones_recomendados: [
      { tipo: PATTERN_TYPES.TRIDIMENSIONAL, rol: PATTERN_ROLES.EQUIPO_PATRON, prioridad: 1 },
      { tipo: PATTERN_TYPES.JUEGO_CALAS, rol: PATTERN_ROLES.PATRON_MAESTRO, prioridad: 2 },
      { tipo: PATTERN_TYPES.BANCO_HORIZONTAL, rol: PATTERN_ROLES.EQUIPO_PATRON, prioridad: 3 }
    ],
    notas: [
      "La pauta debe venir del plano del utillaje.",
      "Puede requerir dimensiones, geometria y atributos funcionales."
    ]
  },

  RUGOSIMETRO: {
    requiere_trazabilidad: TRACEABILITY_REQUIREMENTS.EXTERNA_ACREDITADA,
    unidad: "um",
    patrones_recomendados: [
      { tipo: PATTERN_TYPES.PATRON_RUGOSIDAD, rol: PATTERN_ROLES.PATRON_MAESTRO, prioridad: 1 }
    ],
    notas: [
      "Requiere patron de rugosidad certificado y parametro aplicable Ra/Rz/etc.",
      "Normativa pendiente de configurar con procedimiento interno."
    ]
  },

  DUROMETRO: {
    requiere_trazabilidad: TRACEABILITY_REQUIREMENTS.EXTERNA_ACREDITADA,
    unidad: "HRC/HB/HV",
    patrones_recomendados: [
      { tipo: PATTERN_TYPES.PATRON_DUREZA, rol: PATTERN_ROLES.PATRON_MAESTRO, prioridad: 1 }
    ],
    notas: [
      "Seleccionar bloque patron segun escala Rockwell, Brinell o Vickers.",
      "Validar metodo y rango antes de calibrar/verificar."
    ]
  },

  LLAVE_DINAMOMETRICA: {
    requiere_trazabilidad: TRACEABILITY_REQUIREMENTS.EXTERNA_ACREDITADA,
    unidad: "Nm",
    patrones_recomendados: [
      { tipo: PATTERN_TYPES.BANCO_TORQUE, rol: PATTERN_ROLES.EQUIPO_PATRON, prioridad: 1 }
    ],
    notas: [
      "Norma/procedimiento de torque pendiente de parametrizar.",
      "El patron debe cubrir el rango de par de la llave."
    ]
  },

  BALANZA: {
    requiere_trazabilidad: TRACEABILITY_REQUIREMENTS.EXTERNA_ACREDITADA,
    unidad: "g/kg",
    patrones_recomendados: [
      { tipo: PATTERN_TYPES.PESA_PATRON, rol: PATTERN_ROLES.PATRON_MAESTRO, prioridad: 1 }
    ],
    notas: [
      "Seleccionar pesas segun rango y resolucion de la balanza.",
      "Normativa OIML/ENAC pendiente de parametrizar."
    ]
  }
};

export function getPatternCapability(equipmentFamily) {
  return PATTERN_CAPABILITIES[equipmentFamily] || null;
}

export function getRecommendedPatternTypes(equipmentFamily) {
  const capability = getPatternCapability(equipmentFamily);
  if (!capability) return [];
  return [...capability.patrones_recomendados].sort((a, b) => a.prioridad - b.prioridad);
}
