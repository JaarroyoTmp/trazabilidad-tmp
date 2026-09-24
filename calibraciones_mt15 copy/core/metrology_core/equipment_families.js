/* ===========================================================
   TMP EQUIPMENT FAMILIES V1
   Catálogo de familias reales del taller TMP
   -----------------------------------------------------------
   Este archivo NO calcula.
   Define qué familias existen y hacia qué motor/procedimiento
   debe dirigirse cada instrumento.
   =========================================================== */

export const TMP_EQUIPMENT_FAMILIES = {
  TAMPON_LISO_PNP: {
    grupo: "DIMENSIONAL",
    nombre: "Tampón liso P/NP",
    procedimiento_base: "MT15-CAP-08",
    motor: "dimensional_engine",
    metodo: "PASA_NO_PASA_VARIABLES",
    unidad: "mm",
    repeticiones_defecto: 5,
    requiere: ["diametro_nominal", "tolerancia", "lado_pasa", "lado_no_pasa"],
    patrones_requeridos: ["BANCO_HORIZONTAL"],
    patrones_opcionales: ["JUEGO_CALAS"],
    decision_global: "CUALQUIER_LADO_NO_OK_ES_NO_APTO"
  },

  TAMPON_ROSCADO_PNP: {
    grupo: "DIMENSIONAL_ROSCAS",
    nombre: "Tampón roscado P/NP",
    procedimiento_base: "PT-ROSCA-001",
    motor: "thread_gauge_engine",
    metodo: "MEDICION_SOBRE_RODILLOS",
    unidad: "mm",
    repeticiones_defecto: 5,
    requiere: ["tipo_rosca", "diametro_nominal", "paso", "clase", "lado_pasa", "lado_no_pasa"],
    patrones_requeridos: ["BANCO_HORIZONTAL", "RODILLOS_ROSCA"],
    patrones_opcionales: [],
    decision_global: "CUALQUIER_LADO_NO_OK_ES_NO_APTO"
  },

  VARILLA: {
    grupo: "DIMENSIONAL",
    nombre: "Varilla calibrada",
    procedimiento_base: "DI016",
    motor: "cylindrical_pattern_engine",
    metodo: "DIAMETRO_CILINDRICO",
    unidad: "mm",
    repeticiones_defecto: 5,
    requiere: ["diametro_nominal"],
    patrones_requeridos: ["BANCO_HORIZONTAL", "TRIDIMENSIONAL"],
    patrones_opcionales: [],
    decision_global: "SEGUN_TOLERANCIA_E_INCERTIDUMBRE"
  },

  RELOJ_COMPARADOR_MILESIMAL: {
    grupo: "DIMENSIONAL",
    nombre: "Reloj comparador milesimal",
    procedimiento_base: "MT15-CAP-05",
    motor: "dimensional_engine",
    metodo: "ERROR_INDICACION_COMPARADOR",
    unidad: "mm",
    repeticiones_defecto: 5,
    requiere: ["rango", "resolucion"],
    patrones_requeridos: ["BANCO_HORIZONTAL"],
    patrones_opcionales: [],
    decision_global: "PEOR_PUNTO"
  },

  RELOJ_COMPARADOR_CENTESIMAL: {
    grupo: "DIMENSIONAL",
    nombre: "Reloj comparador centesimal",
    procedimiento_base: "MT15-CAP-05",
    motor: "dimensional_engine",
    metodo: "ERROR_INDICACION_COMPARADOR",
    unidad: "mm",
    repeticiones_defecto: 5,
    requiere: ["rango", "resolucion"],
    patrones_requeridos: ["BANCO_HORIZONTAL"],
    patrones_opcionales: [],
    decision_global: "PEOR_PUNTO"
  },

  MICROMETRO_EXTERIOR: {
    grupo: "DIMENSIONAL",
    nombre: "Micrómetro de exteriores",
    procedimiento_base: "MT15-CAP-02",
    motor: "dimensional_engine",
    metodo: "ERROR_INDICACION",
    unidad: "mm",
    repeticiones_defecto: 5,
    requiere: ["rango", "resolucion"],
    patrones_requeridos: ["JUEGO_CALAS"],
    patrones_opcionales: ["BANCO_HORIZONTAL"],
    decision_global: "PEOR_PUNTO"
  },

  MICROMETRO_INTERIOR_3_CONTACTOS: {
    grupo: "DIMENSIONAL",
    nombre: "Micrómetro interior de 3 contactos",
    procedimiento_base: "MT15-CAP-13",
    motor: "dimensional_engine",
    metodo: "COMPARACION_CON_ANILLOS",
    unidad: "mm",
    repeticiones_defecto: 5,
    requiere: ["rango", "resolucion"],
    patrones_requeridos: ["ANILLO_PATRON"],
    patrones_opcionales: ["TRIDIMENSIONAL"],
    decision_global: "PEOR_PUNTO"
  },

  PIE_DE_REY: {
    grupo: "DIMENSIONAL",
    nombre: "Pie de rey",
    procedimiento_base: "MT15-CAP-03",
    motor: "dimensional_engine",
    metodo: "ESTRATEGIA_MULTIFUNCION",
    unidad: "mm",
    repeticiones_defecto: 5,
    requiere: ["rango", "resolucion", "tipo_indicacion"],
    estrategias: ["EXTERIORES", "INTERIORES", "SONDA_PROFUNDIDAD"],
    patrones_requeridos: ["BANCO_HORIZONTAL", "ANILLO_PATRON", "JUEGO_CALAS"],
    patrones_opcionales: [],
    decision_global: "CUALQUIER_FUNCION_NO_OK_ES_NO_APTO"
  },

  SONDA_ALTURA: {
    grupo: "DIMENSIONAL",
    nombre: "Sonda de altura",
    procedimiento_base: "MT15-CAP-04",
    motor: "dimensional_engine",
    metodo: "ERROR_INDICACION_ALTURAS",
    unidad: "mm",
    repeticiones_defecto: 5,
    requiere: ["rango", "resolucion"],
    patrones_requeridos: ["BANCO_HORIZONTAL", "JUEGO_CALAS"],
    patrones_opcionales: ["TRIDIMENSIONAL"],
    decision_global: "PEOR_PUNTO"
  },

  GRAMIL: {
    grupo: "DIMENSIONAL",
    nombre: "Gramil",
    procedimiento_base: "MT15-CAP-04",
    motor: "dimensional_engine",
    metodo: "ERROR_INDICACION_ALTURAS",
    unidad: "mm",
    repeticiones_defecto: 5,
    requiere: ["rango", "resolucion"],
    patrones_requeridos: ["BANCO_HORIZONTAL", "JUEGO_CALAS"],
    patrones_opcionales: ["TRIDIMENSIONAL"],
    decision_global: "PEOR_PUNTO"
  },

  RUGOSIMETRO: {
    grupo: "SUPERFICIE",
    nombre: "Rugosímetro",
    procedimiento_base: "RUG-001",
    motor: "roughness_engine",
    metodo: "PATRON_RUGOSIDAD",
    unidad: "um",
    repeticiones_defecto: 5,
    requiere: ["parametro", "rango"],
    patrones_requeridos: ["PATRON_RUGOSIDAD"],
    patrones_opcionales: [],
    decision_global: "PEOR_PUNTO"
  },

  ANILLO_PATRON: {
    grupo: "DIMENSIONAL",
    nombre: "Anillo patrón",
    procedimiento_base: "DI016",
    motor: "cylindrical_pattern_engine",
    metodo: "DIAMETRO_INTERIOR",
    unidad: "mm",
    repeticiones_defecto: 6,
    requiere: ["diametro_nominal", "uso_previsto"],
    patrones_requeridos: ["TRIDIMENSIONAL"],
    patrones_opcionales: ["BANCO_HORIZONTAL"],
    decision_global: "SEGUN_TOLERANCIA_E_INCERTIDUMBRE"
  },

  ANILLO_ROSCADO: {
    grupo: "DIMENSIONAL_ROSCAS",
    nombre: "Anillo roscado",
    procedimiento_base: "PT-ROSCA-002",
    motor: "thread_ring_engine",
    metodo: "ROSCA_INTERIOR",
    unidad: "mm",
    repeticiones_defecto: 5,
    requiere: ["tipo_rosca", "diametro_nominal", "paso", "clase"],
    patrones_requeridos: ["TAMPON_ROSCADO_PATRON", "TRIDIMENSIONAL"],
    patrones_opcionales: [],
    decision_global: "SEGUN_TOLERANCIA_E_INCERTIDUMBRE"
  },

  UTILLAJE_PROPIO: {
    grupo: "UTILLAJES",
    nombre: "Utillaje de fabricación propia",
    procedimiento_base: "TMP-UTILLAJE-001",
    motor: "fixture_engine",
    metodo: "SEGUN_PLANO_FUNCION",
    unidad: "mm",
    repeticiones_defecto: 3,
    requiere: ["plano", "caracteristicas_criticas"],
    patrones_requeridos: ["TRIDIMENSIONAL"],
    patrones_opcionales: ["BANCO_HORIZONTAL", "JUEGO_CALAS"],
    decision_global: "SEGUN_CARACTERISTICAS_CRITICAS"
  },

  DUROMETRO: {
    grupo: "DUREZA",
    nombre: "Durómetro",
    procedimiento_base: "DUR-001",
    motor: "hardness_engine",
    metodo: "PATRONES_DUREZA",
    unidad: "HRC/HB/HV",
    repeticiones_defecto: 5,
    requiere: ["escala_dureza"],
    patrones_requeridos: ["PATRON_DUREZA"],
    patrones_opcionales: [],
    decision_global: "PEOR_PUNTO"
  },

  LLAVE_DINAMOMETRICA: {
    grupo: "TORQUE",
    nombre: "Llave dinamométrica",
    procedimiento_base: "PC-02-35",
    motor: "torque_engine",
    metodo: "UNE_EN_6789",
    unidad: "Nm",
    repeticiones_defecto: 5,
    requiere: ["rango", "tipo", "clase"],
    puntos_defecto: ["MINIMO_ESCALA", "60_PORCIENTO", "100_PORCIENTO"],
    patrones_requeridos: ["BANCO_TORQUE"],
    patrones_opcionales: [],
    decision_global: "PEOR_PUNTO"
  },

  CALIBRE_CHAFLAN_ANGULO: {
    grupo: "ANGULAR",
    nombre: "Calibre de chaflán / ángulo",
    procedimiento_base: "ANG-001",
    motor: "angle_engine",
    metodo: "ANGULO_DIMENSIONAL",
    unidad: "deg",
    repeticiones_defecto: 5,
    requiere: ["angulo_nominal", "rango"],
    patrones_requeridos: ["TRIDIMENSIONAL", "PATRON_ANGULO"],
    patrones_opcionales: [],
    decision_global: "PEOR_PUNTO"
  },

  BALANZA: {
    grupo: "MASA",
    nombre: "Balanza",
    procedimiento_base: "PROC-PC-BALANZA",
    motor: "balance_engine",
    metodo: "EXCENTRICIDAD_REPETIBILIDAD_LINEALIDAD",
    unidad: "g",
    requiere: ["alcance_maximo", "division_escala", "clase"],
    patrones_requeridos: ["PESAS_PATRON"],
    patrones_opcionales: [],
    decision_global: "CUALQUIER_PRUEBA_NO_OK_ES_NO_APTO"
  },

  CALIBRE_HERRADURA: {
    grupo: "DIMENSIONAL",
    nombre: "Calibre de herradura",
    procedimiento_base: "MT15-CAP-08",
    motor: "dimensional_engine",
    metodo: "CALIBRE_LIMITES_EXTERIOR",
    unidad: "mm",
    repeticiones_defecto: 5,
    requiere: ["diametro_nominal", "tolerancia", "lado_pasa", "lado_no_pasa"],
    patrones_requeridos: ["BANCO_HORIZONTAL"],
    patrones_opcionales: ["JUEGO_CALAS"],
    decision_global: "CUALQUIER_LADO_NO_OK_ES_NO_APTO"
  }
};

export function getEquipmentFamilyConfig(familyKey) {
  return TMP_EQUIPMENT_FAMILIES[familyKey] || null;
}

export function listEquipmentFamilies() {
  return Object.entries(TMP_EQUIPMENT_FAMILIES).map(([key, cfg]) => ({
    key,
    ...cfg
  }));
}
