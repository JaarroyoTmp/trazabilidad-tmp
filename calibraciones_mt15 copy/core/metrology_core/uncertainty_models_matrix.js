/* ===========================================================
   TMP UNCERTAINTY MODELS MATRIX V1
   -----------------------------------------------------------
   Matriz maestra de modelos de incertidumbre por familia TMP.
   Este archivo NO calcula todavía.
   =========================================================== */

export const TMP_UNCERTAINTY_MODELS = {
  PIE_DE_REY: {
    nombre: "Pie de rey",
    procedimiento_base: "MT15-CAP-03",
    norma_base: ["MT-15", "ILAC-G8", "ISO 14253"],
    modelo: "pie_de_rey",
    unidad: "mm",
    fuentes: [
      "patron_referencia",
      "resolucion_equipo",
      "repetibilidad",
      "temperatura",
      "alineacion_contacto"
    ],
    estrategias: {
      EXTERIORES: {
        patrones: ["BANCO_HORIZONTAL", "JUEGO_CALAS"],
        fuentes_extra: ["paralelismo_bocas"]
      },
      INTERIORES: {
        patrones: ["ANILLO_PATRON"],
        fuentes_extra: ["geometria_puntas_interiores"]
      },
      SONDA_PROFUNDIDAD: {
        patrones: ["JUEGO_CALAS", "BANCO_HORIZONTAL"],
        fuentes_extra: ["apoyo_base", "perpendicularidad_sonda"]
      }
    },
    regla_decision_tmp: "CUALQUIER_FUNCION_NO_OK_ES_NO_APTO",
    campos_minimos: ["lecturas", "resolucion", "patron", "tolerancia"]
  },

  MICROMETRO_EXTERIOR: {
    nombre: "Micrómetro de exteriores",
    procedimiento_base: "MT15-CAP-02",
    norma_base: ["MT-15", "ILAC-G8", "ISO 14253"],
    modelo: "micrometro_exterior",
    unidad: "mm",
    fuentes: [
      "patron_referencia",
      "resolucion_equipo",
      "repetibilidad",
      "temperatura",
      "fuerza_medicion",
      "planitud_paralelismo_contactos"
    ],
    patrones: ["JUEGO_CALAS", "BANCO_HORIZONTAL"],
    regla_decision_tmp: "PEOR_PUNTO",
    campos_minimos: ["lecturas", "resolucion", "patron", "tolerancia"]
  },

  MICROMETRO_INTERIOR_3_CONTACTOS: {
    nombre: "Micrómetro interior de 3 contactos",
    procedimiento_base: "MT15-CAP-13",
    norma_base: ["MT-15", "ILAC-G8", "ISO 14253"],
    modelo: "micrometro_interior_3_contactos",
    unidad: "mm",
    fuentes: [
      "patron_referencia",
      "resolucion_equipo",
      "repetibilidad",
      "temperatura",
      "geometria_contactos",
      "alineacion_en_anillo"
    ],
    patrones: ["ANILLO_PATRON", "TRIDIMENSIONAL"],
    regla_decision_tmp: "PEOR_PUNTO",
    campos_minimos: ["lecturas", "resolucion", "patron", "tolerancia"]
  },

  RELOJ_COMPARADOR_CENTESIMAL: {
    nombre: "Reloj comparador centesimal",
    procedimiento_base: "MT15-CAP-05",
    norma_base: ["MT-15", "ILAC-G8", "ISO 14253"],
    modelo: "comparador",
    unidad: "mm",
    fuentes: [
      "patron_referencia",
      "resolucion_equipo",
      "repetibilidad",
      "histeresis",
      "retorno_cero",
      "alineacion_eje_medicion"
    ],
    patrones: ["BANCO_HORIZONTAL"],
    regla_decision_tmp: "PEOR_PUNTO",
    campos_minimos: ["lecturas_subida", "lecturas_bajada", "resolucion", "patron", "tolerancia"]
  },

  RELOJ_COMPARADOR_MILESIMAL: {
    nombre: "Reloj comparador milesimal",
    procedimiento_base: "MT15-CAP-05",
    norma_base: ["MT-15", "ILAC-G8", "ISO 14253"],
    modelo: "comparador",
    unidad: "mm",
    fuentes: [
      "patron_referencia",
      "resolucion_equipo",
      "repetibilidad",
      "histeresis",
      "retorno_cero",
      "alineacion_eje_medicion"
    ],
    patrones: ["BANCO_HORIZONTAL"],
    regla_decision_tmp: "PEOR_PUNTO",
    campos_minimos: ["lecturas_subida", "lecturas_bajada", "resolucion", "patron", "tolerancia"]
  },

  GRAMIL: {
    nombre: "Gramil",
    procedimiento_base: "MT15-CAP-04",
    norma_base: ["MT-15", "ILAC-G8", "ISO 14253"],
    modelo: "altura_lineal",
    unidad: "mm",
    fuentes: [
      "patron_referencia",
      "resolucion_equipo",
      "repetibilidad",
      "temperatura",
      "perpendicularidad",
      "base_apoyo"
    ],
    patrones: ["BANCO_HORIZONTAL", "JUEGO_CALAS", "TRIDIMENSIONAL"],
    regla_decision_tmp: "PEOR_PUNTO",
    campos_minimos: ["lecturas", "resolucion", "patron", "tolerancia"]
  },

  SONDA_ALTURA: {
    nombre: "Sonda de altura",
    procedimiento_base: "MT15-CAP-04",
    norma_base: ["MT-15", "ILAC-G8", "ISO 14253"],
    modelo: "altura_lineal",
    unidad: "mm",
    fuentes: [
      "patron_referencia",
      "resolucion_equipo",
      "repetibilidad",
      "temperatura",
      "perpendicularidad",
      "base_apoyo"
    ],
    patrones: ["BANCO_HORIZONTAL", "JUEGO_CALAS", "TRIDIMENSIONAL"],
    regla_decision_tmp: "PEOR_PUNTO",
    campos_minimos: ["lecturas", "resolucion", "patron", "tolerancia"]
  },

  TAMPON_LISO_PNP: {
    nombre: "Tampón liso P/NP",
    procedimiento_base: "MT15-CAP-08",
    norma_base: ["MT-15", "DIN 7162", "ILAC-G8", "ISO 14253"],
    modelo: "tampon_liso_pnp",
    unidad: "mm",
    fuentes: [
      "patron_referencia",
      "banco_horizontal",
      "resolucion_banco",
      "repetibilidad",
      "temperatura",
      "contacto_palpos",
      "redondez_cilindricidad_si_aplica"
    ],
    patrones: ["BANCO_HORIZONTAL", "JUEGO_CALAS"],
    lados: ["PASA", "NO_PASA"],
    regla_decision_tmp: "CUALQUIER_LADO_NO_OK_ES_NO_APTO",
    campos_minimos: ["lecturas_pasa", "lecturas_no_pasa", "nominal_pasa", "nominal_no_pasa", "patron", "tolerancia"]
  },

  TAMPON_ROSCADO_PNP: {
    nombre: "Tampón roscado P/NP",
    procedimiento_base: "PT-ROSCA-001",
    norma_base: ["ISO 1502", "DIN 13", "DIN 7162", "ILAC-G8", "ISO 14253"],
    modelo: "tampon_roscado_pnp",
    unidad: "mm",
    fuentes: [
      "banco_horizontal",
      "rodillos_rosca",
      "paso_rosca",
      "angulo_rosca",
      "diametro_rodillo",
      "repetibilidad",
      "temperatura",
      "resolucion_banco",
      "geometria_rosca"
    ],
    patrones: ["BANCO_HORIZONTAL", "RODILLOS_ROSCA"],
    lados: ["PASA", "NO_PASA"],
    regla_decision_tmp: "CUALQUIER_LADO_NO_OK_ES_NO_APTO",
    campos_minimos: ["tipo_rosca", "diametro_nominal", "paso", "clase", "lecturas_pasa", "lecturas_no_pasa", "rodillos", "patron"]
  },

  ANILLO_PATRON: {
    nombre: "Anillo patrón",
    procedimiento_base: "DI016",
    norma_base: ["CEM DI-016", "DIN 2250", "EA-4/02", "ISO 14253"],
    modelo: "patron_cilindrico_diametro",
    unidad: "mm",
    fuentes: [
      "tridimensional_o_medidora",
      "repetibilidad_mesurando",
      "repetibilidad_medidora",
      "resolucion_medidora",
      "temperatura",
      "dilatacion_diferencial",
      "redondez",
      "cilindricidad_si_aplica"
    ],
    patrones: ["TRIDIMENSIONAL", "BANCO_HORIZONTAL"],
    regla_decision_tmp: "SEGUN_TOLERANCIA_E_INCERTIDUMBRE",
    campos_minimos: ["diametros_medidos", "diametro_nominal", "temperatura", "patron"]
  },

  ANILLO_ROSCADO: {
    nombre: "Anillo roscado",
    procedimiento_base: "PT-ROSCA-002",
    norma_base: ["ISO 1502", "DIN 2250", "DIN 2279", "ISO 14253"],
    modelo: "anillo_roscado",
    unidad: "mm",
    fuentes: ["patron_rosca", "tridimensional", "repetibilidad", "temperatura", "geometria_rosca"],
    patrones: ["TAMPON_ROSCADO_PATRON", "TRIDIMENSIONAL"],
    regla_decision_tmp: "SEGUN_TOLERANCIA_E_INCERTIDUMBRE",
    campos_minimos: ["tipo_rosca", "diametro_nominal", "paso", "clase", "lecturas", "patron"]
  },

  CALIBRE_HERRADURA: {
    nombre: "Calibre de herradura",
    procedimiento_base: "MT15-CAP-08",
    norma_base: ["MT-15", "DIN 7162", "ILAC-G8", "ISO 14253"],
    modelo: "calibre_limites_exterior",
    unidad: "mm",
    fuentes: ["patron_referencia", "banco_horizontal", "resolucion_banco", "repetibilidad", "temperatura", "contacto_palpos"],
    patrones: ["BANCO_HORIZONTAL", "JUEGO_CALAS"],
    lados: ["PASA", "NO_PASA"],
    regla_decision_tmp: "CUALQUIER_LADO_NO_OK_ES_NO_APTO",
    campos_minimos: ["lecturas_pasa", "lecturas_no_pasa", "patron", "tolerancia"]
  },

  BALANZA: {
    nombre: "Balanza",
    procedimiento_base: "PROC-PC-BALANZA",
    norma_base: ["OIML R76", "EA-4/02", "ISO 14253"],
    modelo: "balanza",
    unidad: "g",
    fuentes: ["pesas_patron", "resolucion", "repetibilidad", "excentricidad", "linealidad", "deriva_cero", "condiciones_ambientales"],
    pruebas: ["EXCENTRICIDAD", "REPETIBILIDAD", "LINEALIDAD"],
    patrones: ["PESAS_PATRON"],
    regla_decision_tmp: "CUALQUIER_PRUEBA_NO_OK_ES_NO_APTO",
    campos_minimos: ["lecturas_excentricidad", "lecturas_repetibilidad", "lecturas_linealidad", "pesas_patron"]
  },

  LLAVE_DINAMOMETRICA: {
    nombre: "Llave dinamométrica",
    procedimiento_base: "PC-02-35",
    norma_base: ["UNE-EN ISO 6789", "EA-4/02", "ISO 14253"],
    modelo: "llave_dinamometrica",
    unidad: "Nm",
    fuentes: ["banco_torque", "resolucion", "repetibilidad", "desviacion", "punto_aplicacion", "condiciones_ambientales"],
    puntos: ["MINIMO_ESCALA", "60_PORCIENTO", "100_PORCIENTO"],
    patrones: ["BANCO_TORQUE"],
    regla_decision_tmp: "PEOR_PUNTO",
    campos_minimos: ["lecturas", "rango", "tipo", "clase", "patron"]
  },

  DUROMETRO: {
    nombre: "Durómetro",
    procedimiento_base: "DUR-001",
    norma_base: ["ISO 6506", "ISO 6507", "ISO 6508", "ISO 14253"],
    modelo: "durometro",
    unidad: "HRC/HB/HV",
    fuentes: ["patron_dureza", "repetibilidad", "resolucion", "penetrador", "fuerza_aplicada", "condiciones_superficie"],
    patrones: ["PATRON_DUREZA"],
    regla_decision_tmp: "PEOR_PUNTO",
    campos_minimos: ["escala_dureza", "lecturas", "patron"]
  },

  RUGOSIMETRO: {
    nombre: "Rugosímetro",
    procedimiento_base: "RUG-001",
    norma_base: ["ISO 4287", "ISO 4288", "ISO 21920", "ISO 14253"],
    modelo: "rugosimetro",
    unidad: "um",
    fuentes: ["patron_rugosidad", "resolucion", "repetibilidad", "palpador", "longitud_corte", "condiciones_superficie"],
    patrones: ["PATRON_RUGOSIDAD"],
    regla_decision_tmp: "PEOR_PUNTO",
    campos_minimos: ["parametro", "lecturas", "patron"]
  },

  UTILLAJE_PROPIO: {
    nombre: "Utillaje de fabricación propia",
    procedimiento_base: "TMP-UTILLAJE-001",
    norma_base: ["ISO 1101", "ISO 14253", "criterio_cliente"],
    modelo: "utillaje_funcional",
    unidad: "mm",
    fuentes: ["tridimensional", "resolucion", "repetibilidad", "alineacion", "datums", "geometria", "caracteristicas_criticas"],
    patrones: ["TRIDIMENSIONAL"],
    regla_decision_tmp: "SEGUN_CARACTERISTICAS_CRITICAS",
    campos_minimos: ["plano", "caracteristicas", "lecturas", "patron"]
  }
};

export function getUncertaintyModelConfig(familyKey) {
  return TMP_UNCERTAINTY_MODELS[String(familyKey || "").toUpperCase()] || null;
}

export function listUncertaintyModels() {
  return Object.entries(TMP_UNCERTAINTY_MODELS).map(([key, cfg]) => ({ key, ...cfg }));
}

export function getUncertaintySources(familyKey, strategyKey = null) {
  const cfg = getUncertaintyModelConfig(familyKey);
  if (!cfg) return [];

  const baseSources = Array.isArray(cfg.fuentes) ? [...cfg.fuentes] : [];

  if (strategyKey && cfg.estrategias) {
    const strategy = cfg.estrategias[String(strategyKey).toUpperCase()];
    if (strategy?.fuentes_extra) {
      return [...new Set([...baseSources, ...strategy.fuentes_extra])];
    }
  }

  return baseSources;
}
