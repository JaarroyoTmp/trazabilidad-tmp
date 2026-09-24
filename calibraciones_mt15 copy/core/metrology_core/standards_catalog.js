/* ===========================================================
   TMP METROLOGY CORE - STANDARDS CATALOG
   Catalogo normativo y procedimientos aplicables.
   Este archivo es el cerebro normativo base del sistema.
=========================================================== */

export const STANDARDS_CATALOG = {
  DIMENSIONAL_MT15: {
    domain: "DIMENSIONAL",
    title: "Manual Tecnico MT-15 - Instrucciones de calibracion",
    base_standard: "MT-15",
    quality_system: ["ISO/IEC 17025", "ILAC-G8"],
    chapters: {
      MT15_CAP_01: {
        code: "MT15-CAP-01",
        title: "Definiciones",
        applies_to: ["BASE_CALCULATION"],
        calculation_basis: "WECC 19-1998",
        notes: [
          "Formula general de correccion e incertidumbre.",
          "Uso de incertidumbre, correccion, k, division de escala, precision y repetibilidad.",
          "Criterios de aceptacion/rechazo por correccion e incertidumbre."
        ]
      },
      MT15_CAP_02: {
        code: "MT15-CAP-02",
        title: "Micrometro de Exteriores",
        equipment_keys: ["MICROMETRO_EXTERIORES", "MICROMETRO"],
        repetitions: 5,
        unit: "mm"
      },
      MT15_CAP_03: {
        code: "MT15-CAP-03",
        title: "Pie de Rey",
        equipment_keys: ["PIE_DE_REY", "CALIBRE"],
        repetitions: 5,
        unit: "mm"
      },
      MT15_CAP_04: {
        code: "MT15-CAP-04",
        title: "Gramil",
        equipment_keys: ["GRAMIL", "MEDIDOR_ALTURA"],
        repetitions: 5,
        unit: "mm"
      },
      MT15_CAP_05: {
        code: "MT15-CAP-05",
        title: "Comparadores",
        equipment_keys: ["COMPARADOR", "RELOJ_COMPARADOR", "PUPITAST"],
        repetitions: 5,
        unit: "mm"
      },
      MT15_CAP_06: {
        code: "MT15-CAP-06",
        title: "Goniometro",
        equipment_keys: ["GONIOMETRO"],
        repetitions: 5,
        unit: "degrees"
      },
      MT15_CAP_07: {
        code: "MT15-CAP-07",
        title: "Escuadras y Patrones de Angulo",
        equipment_keys: ["ESCUADRA", "PATRON_ANGULO"],
        repetitions: 5,
        unit: "mm/100mm"
      },
      MT15_CAP_08: {
        code: "MT15-CAP-08",
        title: "Calibres Pasa - No Pasa",
        equipment_keys: ["TAMPON_PNP", "QUIJADA_PNP", "CALIBRE_PASA_NO_PASA"],
        supporting_standards: ["DIN 7162"],
        repetitions: 5,
        unit: "mm"
      },
      MT15_CAP_09: {
        code: "MT15-CAP-09",
        title: "Plantillas",
        equipment_keys: ["PLANTILLA"],
        repetitions: 5,
        unit: "mm"
      },
      MT15_CAP_10: {
        code: "MT15-CAP-10",
        title: "Sonda Micrometrica",
        equipment_keys: ["SONDA_MICROMETRICA"],
        repetitions: 5,
        unit: "mm"
      },
      MT15_CAP_11: {
        code: "MT15-CAP-11",
        title: "Medidor de Espesores",
        equipment_keys: ["MEDIDOR_ESPESORES"],
        repetitions: 5,
        unit: "mm"
      },
      MT15_CAP_12: {
        code: "MT15-CAP-12",
        title: "Flexometro",
        equipment_keys: ["FLEXOMETRO"],
        calibration_mode: "ATTRIBUTES",
        unit: "mm"
      },
      MT15_CAP_13: {
        code: "MT15-CAP-13",
        title: "Micrometro de Interiores",
        equipment_keys: ["MICROMETRO_INTERIORES", "ALEXOMETRO", "ALESOMETRO"],
        repetitions: 5,
        unit: "mm"
      }
    }
  },

  TORQUE: {
    domain: "TORQUE",
    status: "PENDING_DOCUMENTATION",
    likely_standards: ["ISO 6789", "EURAMET cg-14"],
    equipment_keys: ["LLAVE_DINAMOMETRICA", "DESTORNILLADOR_DINAMOMETRICO", "TORQUIMETRO"]
  },

  MASS: {
    domain: "MASS",
    status: "PENDING_DOCUMENTATION",
    likely_standards: ["OIML R76", "OIML R111", "EURAMET cg-18"],
    equipment_keys: ["BALANZA", "BASCULA", "PESA_PATRON"]
  },

  HARDNESS: {
    domain: "HARDNESS",
    status: "PENDING_DOCUMENTATION",
    likely_standards: ["ISO 6506", "ISO 6507", "ISO 6508"],
    equipment_keys: ["DUROMETRO", "ROCKWELL", "VICKERS", "BRINELL"]
  },

  COATING_THICKNESS: {
    domain: "COATING_THICKNESS",
    status: "PENDING_DOCUMENTATION",
    likely_standards: ["ISO 2178", "ISO 2360"],
    equipment_keys: ["ESPESOR_PINTURA", "MEDIDOR_CAPA", "RECUBRIMIENTO"]
  },

  ROUGHNESS: {
    domain: "ROUGHNESS",
    status: "PENDING_DOCUMENTATION",
    likely_standards: ["ISO 4287", "ISO 4288", "ISO 21920"],
    equipment_keys: ["RUGOSIMETRO", "RUGOSIDAD"]
  }
};