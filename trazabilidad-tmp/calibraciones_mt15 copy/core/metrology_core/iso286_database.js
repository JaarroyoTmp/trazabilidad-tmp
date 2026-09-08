/* ===========================================================
   TMP ISO286 DATABASE V3 - FIX SYNTAX
   -----------------------------------------------------------
   Base interna ISO286 para TMP.

   Sustituir SOLO:
   core/metrology_core/iso286_database.js

   H/h/JS/js:
   - Base operativa validada internamente.

   g/f/e/k/m/n/p/r/s:
   - Precarga para diagnóstico.
   - Marcadas como PENDIENTE_VALIDACION_TABLA.
   =========================================================== */

export const ISO286_DATABASE = {
  "meta": {
    "version": "TMP_ISO286_DATABASE_V3_FIX_SYNTAX",
    "source": "ISO 286 / TMP prevalidacion interna",
    "units": "um",
    "status": "PREVALIDACION",
    "note": "Incluye H/h/JS/js y precarga de ejes g6/f7/e8/k6/m6/n6/p6/r6/s6 hasta 500 mm. Las clases de eje ampliadas deben validarse contra tabla ISO286 antes de bloqueo final."
  },
  "ranges": {
    "6_10": {
      "min_exclusive": 6,
      "max_inclusive": 10,
      "classes": {
        "H5": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 6,
          "IT": 6,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h5": {
          "tipo": "EJE",
          "ei": -6,
          "es": 0,
          "IT": 6,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS5": {
          "tipo": "AGUJERO",
          "EI": -3.0,
          "ES": 3.0,
          "IT": 6,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js5": {
          "tipo": "EJE",
          "ei": -3.0,
          "es": 3.0,
          "IT": 6,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H6": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 9,
          "IT": 9,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h6": {
          "tipo": "EJE",
          "ei": -9,
          "es": 0,
          "IT": 9,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS6": {
          "tipo": "AGUJERO",
          "EI": -4.5,
          "ES": 4.5,
          "IT": 9,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js6": {
          "tipo": "EJE",
          "ei": -4.5,
          "es": 4.5,
          "IT": 9,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H7": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 15,
          "IT": 15,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h7": {
          "tipo": "EJE",
          "ei": -15,
          "es": 0,
          "IT": 15,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS7": {
          "tipo": "AGUJERO",
          "EI": -7.5,
          "ES": 7.5,
          "IT": 15,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js7": {
          "tipo": "EJE",
          "ei": -7.5,
          "es": 7.5,
          "IT": 15,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H8": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 22,
          "IT": 22,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h8": {
          "tipo": "EJE",
          "ei": -22,
          "es": 0,
          "IT": 22,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS8": {
          "tipo": "AGUJERO",
          "EI": -11.0,
          "ES": 11.0,
          "IT": 22,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js8": {
          "tipo": "EJE",
          "ei": -11.0,
          "es": 11.0,
          "IT": 22,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H9": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 36,
          "IT": 36,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h9": {
          "tipo": "EJE",
          "ei": -36,
          "es": 0,
          "IT": 36,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS9": {
          "tipo": "AGUJERO",
          "EI": -18.0,
          "ES": 18.0,
          "IT": 36,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js9": {
          "tipo": "EJE",
          "ei": -18.0,
          "es": 18.0,
          "IT": 36,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H10": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 58,
          "IT": 58,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h10": {
          "tipo": "EJE",
          "ei": -58,
          "es": 0,
          "IT": 58,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS10": {
          "tipo": "AGUJERO",
          "EI": -29.0,
          "ES": 29.0,
          "IT": 58,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js10": {
          "tipo": "EJE",
          "ei": -29.0,
          "es": 29.0,
          "IT": 58,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H11": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 90,
          "IT": 90,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h11": {
          "tipo": "EJE",
          "ei": -90,
          "es": 0,
          "IT": 90,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS11": {
          "tipo": "AGUJERO",
          "EI": -45.0,
          "ES": 45.0,
          "IT": 90,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js11": {
          "tipo": "EJE",
          "ei": -45.0,
          "es": 45.0,
          "IT": 90,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H12": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 150,
          "IT": 150,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h12": {
          "tipo": "EJE",
          "ei": -150,
          "es": 0,
          "IT": 150,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS12": {
          "tipo": "AGUJERO",
          "EI": -75.0,
          "ES": 75.0,
          "IT": 150,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js12": {
          "tipo": "EJE",
          "ei": -75.0,
          "es": 75.0,
          "IT": 150,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "g6": {
          "tipo": "EJE",
          "ei": -14.014,
          "es": -5.014,
          "IT": 9,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 7.746
        },
        "f7": {
          "tipo": "EJE",
          "ei": -27.732,
          "es": -12.732,
          "IT": 15,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 7.746
        },
        "e8": {
          "tipo": "EJE",
          "ei": -47.463,
          "es": -25.463,
          "IT": 22,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 7.746
        },
        "k6": {
          "tipo": "EJE",
          "ei": 1.187,
          "es": 10.187,
          "IT": 9,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 7.746
        },
        "m6": {
          "tipo": "EJE",
          "ei": 5.616,
          "es": 14.616,
          "IT": 9,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 7.746
        },
        "n6": {
          "tipo": "EJE",
          "ei": 10.029,
          "es": 19.029,
          "IT": 9,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 7.746
        },
        "p6": {
          "tipo": "EJE",
          "ei": 12.963,
          "es": 21.963,
          "IT": 9,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 7.746
        },
        "r6": {
          "tipo": "EJE",
          "ei": 23.148,
          "es": 32.148,
          "IT": 9,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 7.746
        },
        "s6": {
          "tipo": "EJE",
          "ei": 34.46,
          "es": 43.46,
          "IT": 9,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 7.746
        }
      }
    },
    "10_18": {
      "min_exclusive": 10,
      "max_inclusive": 18,
      "classes": {
        "H5": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 8,
          "IT": 8,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h5": {
          "tipo": "EJE",
          "ei": -8,
          "es": 0,
          "IT": 8,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS5": {
          "tipo": "AGUJERO",
          "EI": -4.0,
          "ES": 4.0,
          "IT": 8,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js5": {
          "tipo": "EJE",
          "ei": -4.0,
          "es": 4.0,
          "IT": 8,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H6": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 11,
          "IT": 11,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h6": {
          "tipo": "EJE",
          "ei": -11,
          "es": 0,
          "IT": 11,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS6": {
          "tipo": "AGUJERO",
          "EI": -5.5,
          "ES": 5.5,
          "IT": 11,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js6": {
          "tipo": "EJE",
          "ei": -5.5,
          "es": 5.5,
          "IT": 11,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H7": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 18,
          "IT": 18,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h7": {
          "tipo": "EJE",
          "ei": -18,
          "es": 0,
          "IT": 18,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS7": {
          "tipo": "AGUJERO",
          "EI": -9.0,
          "ES": 9.0,
          "IT": 18,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js7": {
          "tipo": "EJE",
          "ei": -9.0,
          "es": 9.0,
          "IT": 18,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H8": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 27,
          "IT": 27,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h8": {
          "tipo": "EJE",
          "ei": -27,
          "es": 0,
          "IT": 27,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS8": {
          "tipo": "AGUJERO",
          "EI": -13.5,
          "ES": 13.5,
          "IT": 27,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js8": {
          "tipo": "EJE",
          "ei": -13.5,
          "es": 13.5,
          "IT": 27,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H9": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 43,
          "IT": 43,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h9": {
          "tipo": "EJE",
          "ei": -43,
          "es": 0,
          "IT": 43,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS9": {
          "tipo": "AGUJERO",
          "EI": -21.5,
          "ES": 21.5,
          "IT": 43,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js9": {
          "tipo": "EJE",
          "ei": -21.5,
          "es": 21.5,
          "IT": 43,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H10": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 70,
          "IT": 70,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h10": {
          "tipo": "EJE",
          "ei": -70,
          "es": 0,
          "IT": 70,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS10": {
          "tipo": "AGUJERO",
          "EI": -35.0,
          "ES": 35.0,
          "IT": 70,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js10": {
          "tipo": "EJE",
          "ei": -35.0,
          "es": 35.0,
          "IT": 70,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H11": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 110,
          "IT": 110,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h11": {
          "tipo": "EJE",
          "ei": -110,
          "es": 0,
          "IT": 110,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS11": {
          "tipo": "AGUJERO",
          "EI": -55.0,
          "ES": 55.0,
          "IT": 110,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js11": {
          "tipo": "EJE",
          "ei": -55.0,
          "es": 55.0,
          "IT": 110,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H12": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 180,
          "IT": 180,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h12": {
          "tipo": "EJE",
          "ei": -180,
          "es": 0,
          "IT": 180,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS12": {
          "tipo": "AGUJERO",
          "EI": -90.0,
          "ES": 90.0,
          "IT": 180,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js12": {
          "tipo": "EJE",
          "ei": -90.0,
          "es": 90.0,
          "IT": 180,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "g6": {
          "tipo": "EJE",
          "ei": -17.044,
          "es": -6.044,
          "IT": 11,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 13.416
        },
        "f7": {
          "tipo": "EJE",
          "ei": -33.948,
          "es": -15.948,
          "IT": 18,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 13.416
        },
        "e8": {
          "tipo": "EJE",
          "ei": -58.895,
          "es": -31.895,
          "IT": 27,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 13.416
        },
        "k6": {
          "tipo": "EJE",
          "ei": 1.426,
          "es": 12.426,
          "IT": 11,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 13.416
        },
        "m6": {
          "tipo": "EJE",
          "ei": 6.769,
          "es": 17.769,
          "IT": 11,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 13.416
        },
        "n6": {
          "tipo": "EJE",
          "ei": 12.088,
          "es": 23.088,
          "IT": 11,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 13.416
        },
        "p6": {
          "tipo": "EJE",
          "ei": 16.237,
          "es": 27.237,
          "IT": 11,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 13.416
        },
        "r6": {
          "tipo": "EJE",
          "ei": 28.996,
          "es": 39.996,
          "IT": 11,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 13.416
        },
        "s6": {
          "tipo": "EJE",
          "ei": 43.882,
          "es": 54.882,
          "IT": 11,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 13.416
        }
      }
    },
    "18_30": {
      "min_exclusive": 18,
      "max_inclusive": 30,
      "classes": {
        "H5": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 9,
          "IT": 9,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h5": {
          "tipo": "EJE",
          "ei": -9,
          "es": 0,
          "IT": 9,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS5": {
          "tipo": "AGUJERO",
          "EI": -4.5,
          "ES": 4.5,
          "IT": 9,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js5": {
          "tipo": "EJE",
          "ei": -4.5,
          "es": 4.5,
          "IT": 9,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H6": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 13,
          "IT": 13,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h6": {
          "tipo": "EJE",
          "ei": -13,
          "es": 0,
          "IT": 13,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS6": {
          "tipo": "AGUJERO",
          "EI": -6.5,
          "ES": 6.5,
          "IT": 13,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js6": {
          "tipo": "EJE",
          "ei": -6.5,
          "es": 6.5,
          "IT": 13,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H7": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 21,
          "IT": 21,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h7": {
          "tipo": "EJE",
          "ei": -21,
          "es": 0,
          "IT": 21,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS7": {
          "tipo": "AGUJERO",
          "EI": -10.5,
          "ES": 10.5,
          "IT": 21,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js7": {
          "tipo": "EJE",
          "ei": -10.5,
          "es": 10.5,
          "IT": 21,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H8": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 33,
          "IT": 33,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h8": {
          "tipo": "EJE",
          "ei": -33,
          "es": 0,
          "IT": 33,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS8": {
          "tipo": "AGUJERO",
          "EI": -16.5,
          "ES": 16.5,
          "IT": 33,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js8": {
          "tipo": "EJE",
          "ei": -16.5,
          "es": 16.5,
          "IT": 33,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H9": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 52,
          "IT": 52,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h9": {
          "tipo": "EJE",
          "ei": -52,
          "es": 0,
          "IT": 52,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS9": {
          "tipo": "AGUJERO",
          "EI": -26.0,
          "ES": 26.0,
          "IT": 52,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js9": {
          "tipo": "EJE",
          "ei": -26.0,
          "es": 26.0,
          "IT": 52,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H10": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 84,
          "IT": 84,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h10": {
          "tipo": "EJE",
          "ei": -84,
          "es": 0,
          "IT": 84,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS10": {
          "tipo": "AGUJERO",
          "EI": -42.0,
          "ES": 42.0,
          "IT": 84,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js10": {
          "tipo": "EJE",
          "ei": -42.0,
          "es": 42.0,
          "IT": 84,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H11": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 130,
          "IT": 130,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h11": {
          "tipo": "EJE",
          "ei": -130,
          "es": 0,
          "IT": 130,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS11": {
          "tipo": "AGUJERO",
          "EI": -65.0,
          "ES": 65.0,
          "IT": 130,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js11": {
          "tipo": "EJE",
          "ei": -65.0,
          "es": 65.0,
          "IT": 130,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H12": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 210,
          "IT": 210,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h12": {
          "tipo": "EJE",
          "ei": -210,
          "es": 0,
          "IT": 210,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS12": {
          "tipo": "AGUJERO",
          "EI": -105.0,
          "ES": 105.0,
          "IT": 210,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js12": {
          "tipo": "EJE",
          "ei": -105.0,
          "es": 105.0,
          "IT": 210,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "g6": {
          "tipo": "EJE",
          "ei": -20.285,
          "es": -7.285,
          "IT": 13,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 23.238
        },
        "f7": {
          "tipo": "EJE",
          "ei": -40.976,
          "es": -19.976,
          "IT": 21,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 23.238
        },
        "e8": {
          "tipo": "EJE",
          "ei": -72.952,
          "es": -39.952,
          "IT": 33,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 23.238
        },
        "k6": {
          "tipo": "EJE",
          "ei": 1.712,
          "es": 14.712,
          "IT": 13,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 23.238
        },
        "m6": {
          "tipo": "EJE",
          "ei": 8.16,
          "es": 21.16,
          "IT": 13,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 23.238
        },
        "n6": {
          "tipo": "EJE",
          "ei": 14.571,
          "es": 27.571,
          "IT": 13,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 23.238
        },
        "p6": {
          "tipo": "EJE",
          "ei": 20.339,
          "es": 33.339,
          "IT": 13,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 23.238
        },
        "r6": {
          "tipo": "EJE",
          "ei": 36.32,
          "es": 49.32,
          "IT": 13,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 23.238
        },
        "s6": {
          "tipo": "EJE",
          "ei": 55.88,
          "es": 68.88,
          "IT": 13,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 23.238
        }
      }
    },
    "30_50": {
      "min_exclusive": 30,
      "max_inclusive": 50,
      "classes": {
        "H5": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 11,
          "IT": 11,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h5": {
          "tipo": "EJE",
          "ei": -11,
          "es": 0,
          "IT": 11,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS5": {
          "tipo": "AGUJERO",
          "EI": -5.5,
          "ES": 5.5,
          "IT": 11,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js5": {
          "tipo": "EJE",
          "ei": -5.5,
          "es": 5.5,
          "IT": 11,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H6": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 16,
          "IT": 16,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h6": {
          "tipo": "EJE",
          "ei": -16,
          "es": 0,
          "IT": 16,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS6": {
          "tipo": "AGUJERO",
          "EI": -8.0,
          "ES": 8.0,
          "IT": 16,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js6": {
          "tipo": "EJE",
          "ei": -8.0,
          "es": 8.0,
          "IT": 16,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H7": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 25,
          "IT": 25,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h7": {
          "tipo": "EJE",
          "ei": -25,
          "es": 0,
          "IT": 25,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS7": {
          "tipo": "AGUJERO",
          "EI": -12.5,
          "ES": 12.5,
          "IT": 25,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js7": {
          "tipo": "EJE",
          "ei": -12.5,
          "es": 12.5,
          "IT": 25,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H8": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 39,
          "IT": 39,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h8": {
          "tipo": "EJE",
          "ei": -39,
          "es": 0,
          "IT": 39,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS8": {
          "tipo": "AGUJERO",
          "EI": -19.5,
          "ES": 19.5,
          "IT": 39,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js8": {
          "tipo": "EJE",
          "ei": -19.5,
          "es": 19.5,
          "IT": 39,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H9": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 62,
          "IT": 62,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h9": {
          "tipo": "EJE",
          "ei": -62,
          "es": 0,
          "IT": 62,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS9": {
          "tipo": "AGUJERO",
          "EI": -31.0,
          "ES": 31.0,
          "IT": 62,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js9": {
          "tipo": "EJE",
          "ei": -31.0,
          "es": 31.0,
          "IT": 62,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H10": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 100,
          "IT": 100,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h10": {
          "tipo": "EJE",
          "ei": -100,
          "es": 0,
          "IT": 100,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS10": {
          "tipo": "AGUJERO",
          "EI": -50.0,
          "ES": 50.0,
          "IT": 100,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js10": {
          "tipo": "EJE",
          "ei": -50.0,
          "es": 50.0,
          "IT": 100,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H11": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 160,
          "IT": 160,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h11": {
          "tipo": "EJE",
          "ei": -160,
          "es": 0,
          "IT": 160,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS11": {
          "tipo": "AGUJERO",
          "EI": -80.0,
          "ES": 80.0,
          "IT": 160,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js11": {
          "tipo": "EJE",
          "ei": -80.0,
          "es": 80.0,
          "IT": 160,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H12": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 250,
          "IT": 250,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h12": {
          "tipo": "EJE",
          "ei": -250,
          "es": 0,
          "IT": 250,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS12": {
          "tipo": "AGUJERO",
          "EI": -125.0,
          "ES": 125.0,
          "IT": 250,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js12": {
          "tipo": "EJE",
          "ei": -125.0,
          "es": 125.0,
          "IT": 250,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "g6": {
          "tipo": "EJE",
          "ei": -24.667,
          "es": -8.667,
          "IT": 16,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 38.73
        },
        "f7": {
          "tipo": "EJE",
          "ei": -49.63,
          "es": -24.63,
          "IT": 25,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 38.73
        },
        "e8": {
          "tipo": "EJE",
          "ei": -88.26,
          "es": -49.26,
          "IT": 39,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 38.73
        },
        "k6": {
          "tipo": "EJE",
          "ei": 2.03,
          "es": 18.03,
          "IT": 16,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 38.73
        },
        "m6": {
          "tipo": "EJE",
          "ei": 9.707,
          "es": 25.707,
          "IT": 16,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 38.73
        },
        "n6": {
          "tipo": "EJE",
          "ei": 17.334,
          "es": 33.334,
          "IT": 16,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 38.73
        },
        "p6": {
          "tipo": "EJE",
          "ei": 25.078,
          "es": 41.078,
          "IT": 16,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 38.73
        },
        "r6": {
          "tipo": "EJE",
          "ei": 44.782,
          "es": 60.782,
          "IT": 16,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 38.73
        },
        "s6": {
          "tipo": "EJE",
          "ei": 69.963,
          "es": 85.963,
          "IT": 16,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 38.73
        }
      }
    },
    "50_80": {
      "min_exclusive": 50,
      "max_inclusive": 80,
      "classes": {
        "H5": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 13,
          "IT": 13,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h5": {
          "tipo": "EJE",
          "ei": -13,
          "es": 0,
          "IT": 13,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS5": {
          "tipo": "AGUJERO",
          "EI": -6.5,
          "ES": 6.5,
          "IT": 13,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js5": {
          "tipo": "EJE",
          "ei": -6.5,
          "es": 6.5,
          "IT": 13,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H6": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 19,
          "IT": 19,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h6": {
          "tipo": "EJE",
          "ei": -19,
          "es": 0,
          "IT": 19,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS6": {
          "tipo": "AGUJERO",
          "EI": -9.5,
          "ES": 9.5,
          "IT": 19,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js6": {
          "tipo": "EJE",
          "ei": -9.5,
          "es": 9.5,
          "IT": 19,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H7": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 30,
          "IT": 30,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h7": {
          "tipo": "EJE",
          "ei": -30,
          "es": 0,
          "IT": 30,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS7": {
          "tipo": "AGUJERO",
          "EI": -15.0,
          "ES": 15.0,
          "IT": 30,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js7": {
          "tipo": "EJE",
          "ei": -15.0,
          "es": 15.0,
          "IT": 30,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H8": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 46,
          "IT": 46,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h8": {
          "tipo": "EJE",
          "ei": -46,
          "es": 0,
          "IT": 46,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS8": {
          "tipo": "AGUJERO",
          "EI": -23.0,
          "ES": 23.0,
          "IT": 46,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js8": {
          "tipo": "EJE",
          "ei": -23.0,
          "es": 23.0,
          "IT": 46,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H9": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 74,
          "IT": 74,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h9": {
          "tipo": "EJE",
          "ei": -74,
          "es": 0,
          "IT": 74,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS9": {
          "tipo": "AGUJERO",
          "EI": -37.0,
          "ES": 37.0,
          "IT": 74,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js9": {
          "tipo": "EJE",
          "ei": -37.0,
          "es": 37.0,
          "IT": 74,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H10": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 120,
          "IT": 120,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h10": {
          "tipo": "EJE",
          "ei": -120,
          "es": 0,
          "IT": 120,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS10": {
          "tipo": "AGUJERO",
          "EI": -60.0,
          "ES": 60.0,
          "IT": 120,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js10": {
          "tipo": "EJE",
          "ei": -60.0,
          "es": 60.0,
          "IT": 120,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H11": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 190,
          "IT": 190,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h11": {
          "tipo": "EJE",
          "ei": -190,
          "es": 0,
          "IT": 190,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS11": {
          "tipo": "AGUJERO",
          "EI": -95.0,
          "ES": 95.0,
          "IT": 190,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js11": {
          "tipo": "EJE",
          "ei": -95.0,
          "es": 95.0,
          "IT": 190,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H12": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 300,
          "IT": 300,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h12": {
          "tipo": "EJE",
          "ei": -300,
          "es": 0,
          "IT": 300,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS12": {
          "tipo": "AGUJERO",
          "EI": -150.0,
          "ES": 150.0,
          "IT": 300,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js12": {
          "tipo": "EJE",
          "ei": -150.0,
          "es": 150.0,
          "IT": 300,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "g6": {
          "tipo": "EJE",
          "ei": -29.24,
          "es": -10.24,
          "IT": 19,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 63.246
        },
        "f7": {
          "tipo": "EJE",
          "ei": -60.115,
          "es": -30.115,
          "IT": 30,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 63.246
        },
        "e8": {
          "tipo": "EJE",
          "ei": -106.23,
          "es": -60.23,
          "IT": 46,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 63.246
        },
        "k6": {
          "tipo": "EJE",
          "ei": 2.391,
          "es": 21.391,
          "IT": 19,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 63.246
        },
        "m6": {
          "tipo": "EJE",
          "ei": 11.469,
          "es": 30.469,
          "IT": 19,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 63.246
        },
        "n6": {
          "tipo": "EJE",
          "ei": 20.48,
          "es": 39.48,
          "IT": 19,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 63.246
        },
        "p6": {
          "tipo": "EJE",
          "ei": 30.663,
          "es": 49.663,
          "IT": 19,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 63.246
        },
        "r6": {
          "tipo": "EJE",
          "ei": 54.755,
          "es": 73.755,
          "IT": 19,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 63.246
        },
        "s6": {
          "tipo": "EJE",
          "ei": 86.812,
          "es": 105.812,
          "IT": 19,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 63.246
        }
      }
    },
    "80_120": {
      "min_exclusive": 80,
      "max_inclusive": 120,
      "classes": {
        "H5": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 15,
          "IT": 15,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h5": {
          "tipo": "EJE",
          "ei": -15,
          "es": 0,
          "IT": 15,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS5": {
          "tipo": "AGUJERO",
          "EI": -7.5,
          "ES": 7.5,
          "IT": 15,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js5": {
          "tipo": "EJE",
          "ei": -7.5,
          "es": 7.5,
          "IT": 15,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H6": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 22,
          "IT": 22,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h6": {
          "tipo": "EJE",
          "ei": -22,
          "es": 0,
          "IT": 22,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS6": {
          "tipo": "AGUJERO",
          "EI": -11.0,
          "ES": 11.0,
          "IT": 22,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js6": {
          "tipo": "EJE",
          "ei": -11.0,
          "es": 11.0,
          "IT": 22,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H7": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 35,
          "IT": 35,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h7": {
          "tipo": "EJE",
          "ei": -35,
          "es": 0,
          "IT": 35,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS7": {
          "tipo": "AGUJERO",
          "EI": -17.5,
          "ES": 17.5,
          "IT": 35,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js7": {
          "tipo": "EJE",
          "ei": -17.5,
          "es": 17.5,
          "IT": 35,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H8": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 54,
          "IT": 54,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h8": {
          "tipo": "EJE",
          "ei": -54,
          "es": 0,
          "IT": 54,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS8": {
          "tipo": "AGUJERO",
          "EI": -27.0,
          "ES": 27.0,
          "IT": 54,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js8": {
          "tipo": "EJE",
          "ei": -27.0,
          "es": 27.0,
          "IT": 54,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H9": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 87,
          "IT": 87,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h9": {
          "tipo": "EJE",
          "ei": -87,
          "es": 0,
          "IT": 87,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS9": {
          "tipo": "AGUJERO",
          "EI": -43.5,
          "ES": 43.5,
          "IT": 87,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js9": {
          "tipo": "EJE",
          "ei": -43.5,
          "es": 43.5,
          "IT": 87,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H10": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 140,
          "IT": 140,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h10": {
          "tipo": "EJE",
          "ei": -140,
          "es": 0,
          "IT": 140,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS10": {
          "tipo": "AGUJERO",
          "EI": -70.0,
          "ES": 70.0,
          "IT": 140,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js10": {
          "tipo": "EJE",
          "ei": -70.0,
          "es": 70.0,
          "IT": 140,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H11": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 220,
          "IT": 220,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h11": {
          "tipo": "EJE",
          "ei": -220,
          "es": 0,
          "IT": 220,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS11": {
          "tipo": "AGUJERO",
          "EI": -110.0,
          "ES": 110.0,
          "IT": 220,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js11": {
          "tipo": "EJE",
          "ei": -110.0,
          "es": 110.0,
          "IT": 220,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H12": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 350,
          "IT": 350,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h12": {
          "tipo": "EJE",
          "ei": -350,
          "es": 0,
          "IT": 350,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS12": {
          "tipo": "AGUJERO",
          "EI": -175.0,
          "ES": 175.0,
          "IT": 350,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js12": {
          "tipo": "EJE",
          "ei": -175.0,
          "es": 175.0,
          "IT": 350,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "g6": {
          "tipo": "EJE",
          "ei": -33.883,
          "es": -11.883,
          "IT": 22,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 97.98
        },
        "f7": {
          "tipo": "EJE",
          "ei": -71.035,
          "es": -36.035,
          "IT": 35,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 97.98
        },
        "e8": {
          "tipo": "EJE",
          "ei": -126.071,
          "es": -72.071,
          "IT": 54,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 97.98
        },
        "k6": {
          "tipo": "EJE",
          "ei": 2.766,
          "es": 24.766,
          "IT": 22,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 97.98
        },
        "m6": {
          "tipo": "EJE",
          "ei": 13.309,
          "es": 35.309,
          "IT": 22,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 97.98
        },
        "n6": {
          "tipo": "EJE",
          "ei": 23.766,
          "es": 45.766,
          "IT": 22,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 97.98
        },
        "p6": {
          "tipo": "EJE",
          "ei": 36.69,
          "es": 58.69,
          "IT": 22,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 97.98
        },
        "r6": {
          "tipo": "EJE",
          "ei": 65.519,
          "es": 87.519,
          "IT": 22,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 97.98
        },
        "s6": {
          "tipo": "EJE",
          "ei": 105.251,
          "es": 127.251,
          "IT": 22,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 97.98
        }
      }
    },
    "120_180": {
      "min_exclusive": 120,
      "max_inclusive": 180,
      "classes": {
        "H5": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 18,
          "IT": 18,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h5": {
          "tipo": "EJE",
          "ei": -18,
          "es": 0,
          "IT": 18,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS5": {
          "tipo": "AGUJERO",
          "EI": -9.0,
          "ES": 9.0,
          "IT": 18,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js5": {
          "tipo": "EJE",
          "ei": -9.0,
          "es": 9.0,
          "IT": 18,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H6": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 25,
          "IT": 25,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h6": {
          "tipo": "EJE",
          "ei": -25,
          "es": 0,
          "IT": 25,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS6": {
          "tipo": "AGUJERO",
          "EI": -12.5,
          "ES": 12.5,
          "IT": 25,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js6": {
          "tipo": "EJE",
          "ei": -12.5,
          "es": 12.5,
          "IT": 25,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H7": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 40,
          "IT": 40,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h7": {
          "tipo": "EJE",
          "ei": -40,
          "es": 0,
          "IT": 40,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS7": {
          "tipo": "AGUJERO",
          "EI": -20.0,
          "ES": 20.0,
          "IT": 40,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js7": {
          "tipo": "EJE",
          "ei": -20.0,
          "es": 20.0,
          "IT": 40,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H8": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 63,
          "IT": 63,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h8": {
          "tipo": "EJE",
          "ei": -63,
          "es": 0,
          "IT": 63,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS8": {
          "tipo": "AGUJERO",
          "EI": -31.5,
          "ES": 31.5,
          "IT": 63,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js8": {
          "tipo": "EJE",
          "ei": -31.5,
          "es": 31.5,
          "IT": 63,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H9": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 100,
          "IT": 100,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h9": {
          "tipo": "EJE",
          "ei": -100,
          "es": 0,
          "IT": 100,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS9": {
          "tipo": "AGUJERO",
          "EI": -50.0,
          "ES": 50.0,
          "IT": 100,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js9": {
          "tipo": "EJE",
          "ei": -50.0,
          "es": 50.0,
          "IT": 100,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H10": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 160,
          "IT": 160,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h10": {
          "tipo": "EJE",
          "ei": -160,
          "es": 0,
          "IT": 160,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS10": {
          "tipo": "AGUJERO",
          "EI": -80.0,
          "ES": 80.0,
          "IT": 160,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js10": {
          "tipo": "EJE",
          "ei": -80.0,
          "es": 80.0,
          "IT": 160,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H11": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 250,
          "IT": 250,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h11": {
          "tipo": "EJE",
          "ei": -250,
          "es": 0,
          "IT": 250,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS11": {
          "tipo": "AGUJERO",
          "EI": -125.0,
          "ES": 125.0,
          "IT": 250,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js11": {
          "tipo": "EJE",
          "ei": -125.0,
          "es": 125.0,
          "IT": 250,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H12": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 400,
          "IT": 400,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h12": {
          "tipo": "EJE",
          "ei": -400,
          "es": 0,
          "IT": 400,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS12": {
          "tipo": "AGUJERO",
          "EI": -200.0,
          "ES": 200.0,
          "IT": 400,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js12": {
          "tipo": "EJE",
          "ei": -200.0,
          "es": 200.0,
          "IT": 400,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "g6": {
          "tipo": "EJE",
          "ei": -38.639,
          "es": -13.639,
          "IT": 25,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 146.969
        },
        "f7": {
          "tipo": "EJE",
          "ei": -82.553,
          "es": -42.553,
          "IT": 40,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 146.969
        },
        "e8": {
          "tipo": "EJE",
          "ei": -148.105,
          "es": -85.105,
          "IT": 63,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 146.969
        },
        "k6": {
          "tipo": "EJE",
          "ei": 3.166,
          "es": 28.166,
          "IT": 25,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 146.969
        },
        "m6": {
          "tipo": "EJE",
          "ei": 15.276,
          "es": 40.276,
          "IT": 25,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 146.969
        },
        "n6": {
          "tipo": "EJE",
          "ei": 27.279,
          "es": 52.279,
          "IT": 25,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 146.969
        },
        "p6": {
          "tipo": "EJE",
          "ei": 43.326,
          "es": 68.326,
          "IT": 25,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 146.969
        },
        "r6": {
          "tipo": "EJE",
          "ei": 77.368,
          "es": 102.368,
          "IT": 25,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 146.969
        },
        "s6": {
          "tipo": "EJE",
          "ei": 125.808,
          "es": 150.808,
          "IT": 25,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 146.969
        }
      }
    },
    "180_250": {
      "min_exclusive": 180,
      "max_inclusive": 250,
      "classes": {
        "H5": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 20,
          "IT": 20,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h5": {
          "tipo": "EJE",
          "ei": -20,
          "es": 0,
          "IT": 20,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS5": {
          "tipo": "AGUJERO",
          "EI": -10.0,
          "ES": 10.0,
          "IT": 20,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js5": {
          "tipo": "EJE",
          "ei": -10.0,
          "es": 10.0,
          "IT": 20,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H6": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 29,
          "IT": 29,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h6": {
          "tipo": "EJE",
          "ei": -29,
          "es": 0,
          "IT": 29,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS6": {
          "tipo": "AGUJERO",
          "EI": -14.5,
          "ES": 14.5,
          "IT": 29,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js6": {
          "tipo": "EJE",
          "ei": -14.5,
          "es": 14.5,
          "IT": 29,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H7": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 46,
          "IT": 46,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h7": {
          "tipo": "EJE",
          "ei": -46,
          "es": 0,
          "IT": 46,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS7": {
          "tipo": "AGUJERO",
          "EI": -23.0,
          "ES": 23.0,
          "IT": 46,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js7": {
          "tipo": "EJE",
          "ei": -23.0,
          "es": 23.0,
          "IT": 46,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H8": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 72,
          "IT": 72,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h8": {
          "tipo": "EJE",
          "ei": -72,
          "es": 0,
          "IT": 72,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS8": {
          "tipo": "AGUJERO",
          "EI": -36.0,
          "ES": 36.0,
          "IT": 72,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js8": {
          "tipo": "EJE",
          "ei": -36.0,
          "es": 36.0,
          "IT": 72,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H9": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 115,
          "IT": 115,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h9": {
          "tipo": "EJE",
          "ei": -115,
          "es": 0,
          "IT": 115,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS9": {
          "tipo": "AGUJERO",
          "EI": -57.5,
          "ES": 57.5,
          "IT": 115,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js9": {
          "tipo": "EJE",
          "ei": -57.5,
          "es": 57.5,
          "IT": 115,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H10": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 185,
          "IT": 185,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h10": {
          "tipo": "EJE",
          "ei": -185,
          "es": 0,
          "IT": 185,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS10": {
          "tipo": "AGUJERO",
          "EI": -92.5,
          "ES": 92.5,
          "IT": 185,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js10": {
          "tipo": "EJE",
          "ei": -92.5,
          "es": 92.5,
          "IT": 185,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H11": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 290,
          "IT": 290,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h11": {
          "tipo": "EJE",
          "ei": -290,
          "es": 0,
          "IT": 290,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS11": {
          "tipo": "AGUJERO",
          "EI": -145.0,
          "ES": 145.0,
          "IT": 290,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js11": {
          "tipo": "EJE",
          "ei": -145.0,
          "es": 145.0,
          "IT": 290,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H12": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 460,
          "IT": 460,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h12": {
          "tipo": "EJE",
          "ei": -460,
          "es": 0,
          "IT": 460,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS12": {
          "tipo": "AGUJERO",
          "EI": -230.0,
          "ES": 230.0,
          "IT": 460,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js12": {
          "tipo": "EJE",
          "ei": -230.0,
          "es": 230.0,
          "IT": 460,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "g6": {
          "tipo": "EJE",
          "ei": -44.452,
          "es": -15.452,
          "IT": 29,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 212.132
        },
        "f7": {
          "tipo": "EJE",
          "ei": -95.462,
          "es": -49.462,
          "IT": 46,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 212.132
        },
        "e8": {
          "tipo": "EJE",
          "ei": -170.924,
          "es": -98.924,
          "IT": 72,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 212.132
        },
        "k6": {
          "tipo": "EJE",
          "ei": 3.578,
          "es": 32.578,
          "IT": 29,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 212.132
        },
        "m6": {
          "tipo": "EJE",
          "ei": 17.306,
          "es": 46.306,
          "IT": 29,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 212.132
        },
        "n6": {
          "tipo": "EJE",
          "ei": 30.904,
          "es": 59.904,
          "IT": 29,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 212.132
        },
        "p6": {
          "tipo": "EJE",
          "ei": 50.361,
          "es": 79.361,
          "IT": 29,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 212.132
        },
        "r6": {
          "tipo": "EJE",
          "ei": 89.931,
          "es": 118.931,
          "IT": 29,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 212.132
        },
        "s6": {
          "tipo": "EJE",
          "ei": 147.855,
          "es": 176.855,
          "IT": 29,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 212.132
        }
      }
    },
    "250_315": {
      "min_exclusive": 250,
      "max_inclusive": 315,
      "classes": {
        "H5": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 23,
          "IT": 23,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h5": {
          "tipo": "EJE",
          "ei": -23,
          "es": 0,
          "IT": 23,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS5": {
          "tipo": "AGUJERO",
          "EI": -11.5,
          "ES": 11.5,
          "IT": 23,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js5": {
          "tipo": "EJE",
          "ei": -11.5,
          "es": 11.5,
          "IT": 23,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H6": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 32,
          "IT": 32,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h6": {
          "tipo": "EJE",
          "ei": -32,
          "es": 0,
          "IT": 32,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS6": {
          "tipo": "AGUJERO",
          "EI": -16.0,
          "ES": 16.0,
          "IT": 32,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js6": {
          "tipo": "EJE",
          "ei": -16.0,
          "es": 16.0,
          "IT": 32,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H7": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 52,
          "IT": 52,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h7": {
          "tipo": "EJE",
          "ei": -52,
          "es": 0,
          "IT": 52,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS7": {
          "tipo": "AGUJERO",
          "EI": -26.0,
          "ES": 26.0,
          "IT": 52,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js7": {
          "tipo": "EJE",
          "ei": -26.0,
          "es": 26.0,
          "IT": 52,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H8": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 81,
          "IT": 81,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h8": {
          "tipo": "EJE",
          "ei": -81,
          "es": 0,
          "IT": 81,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS8": {
          "tipo": "AGUJERO",
          "EI": -40.5,
          "ES": 40.5,
          "IT": 81,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js8": {
          "tipo": "EJE",
          "ei": -40.5,
          "es": 40.5,
          "IT": 81,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H9": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 130,
          "IT": 130,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h9": {
          "tipo": "EJE",
          "ei": -130,
          "es": 0,
          "IT": 130,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS9": {
          "tipo": "AGUJERO",
          "EI": -65.0,
          "ES": 65.0,
          "IT": 130,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js9": {
          "tipo": "EJE",
          "ei": -65.0,
          "es": 65.0,
          "IT": 130,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H10": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 210,
          "IT": 210,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h10": {
          "tipo": "EJE",
          "ei": -210,
          "es": 0,
          "IT": 210,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS10": {
          "tipo": "AGUJERO",
          "EI": -105.0,
          "ES": 105.0,
          "IT": 210,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js10": {
          "tipo": "EJE",
          "ei": -105.0,
          "es": 105.0,
          "IT": 210,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H11": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 320,
          "IT": 320,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h11": {
          "tipo": "EJE",
          "ei": -320,
          "es": 0,
          "IT": 320,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS11": {
          "tipo": "AGUJERO",
          "EI": -160.0,
          "ES": 160.0,
          "IT": 320,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js11": {
          "tipo": "EJE",
          "ei": -160.0,
          "es": 160.0,
          "IT": 320,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H12": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 520,
          "IT": 520,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h12": {
          "tipo": "EJE",
          "ei": -520,
          "es": 0,
          "IT": 520,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS12": {
          "tipo": "AGUJERO",
          "EI": -260.0,
          "ES": 260.0,
          "IT": 520,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js12": {
          "tipo": "EJE",
          "ei": -260.0,
          "es": 260.0,
          "IT": 520,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "g6": {
          "tipo": "EJE",
          "ei": -48.994,
          "es": -16.994,
          "IT": 32,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 280.624
        },
        "f7": {
          "tipo": "EJE",
          "ei": -107.475,
          "es": -55.475,
          "IT": 52,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 280.624
        },
        "e8": {
          "tipo": "EJE",
          "ei": -191.949,
          "es": -110.949,
          "IT": 81,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 280.624
        },
        "k6": {
          "tipo": "EJE",
          "ei": 3.928,
          "es": 35.928,
          "IT": 32,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 280.624
        },
        "m6": {
          "tipo": "EJE",
          "ei": 19.034,
          "es": 51.034,
          "IT": 32,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 280.624
        },
        "n6": {
          "tipo": "EJE",
          "ei": 33.989,
          "es": 65.989,
          "IT": 32,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 280.624
        },
        "p6": {
          "tipo": "EJE",
          "ei": 56.483,
          "es": 88.483,
          "IT": 32,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 280.624
        },
        "r6": {
          "tipo": "EJE",
          "ei": 100.863,
          "es": 132.863,
          "IT": 32,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 280.624
        },
        "s6": {
          "tipo": "EJE",
          "ei": 167.226,
          "es": 199.226,
          "IT": 32,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 280.624
        }
      }
    },
    "315_400": {
      "min_exclusive": 315,
      "max_inclusive": 400,
      "classes": {
        "H5": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 25,
          "IT": 25,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h5": {
          "tipo": "EJE",
          "ei": -25,
          "es": 0,
          "IT": 25,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS5": {
          "tipo": "AGUJERO",
          "EI": -12.5,
          "ES": 12.5,
          "IT": 25,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js5": {
          "tipo": "EJE",
          "ei": -12.5,
          "es": 12.5,
          "IT": 25,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H6": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 36,
          "IT": 36,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h6": {
          "tipo": "EJE",
          "ei": -36,
          "es": 0,
          "IT": 36,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS6": {
          "tipo": "AGUJERO",
          "EI": -18.0,
          "ES": 18.0,
          "IT": 36,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js6": {
          "tipo": "EJE",
          "ei": -18.0,
          "es": 18.0,
          "IT": 36,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H7": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 57,
          "IT": 57,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h7": {
          "tipo": "EJE",
          "ei": -57,
          "es": 0,
          "IT": 57,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS7": {
          "tipo": "AGUJERO",
          "EI": -28.5,
          "ES": 28.5,
          "IT": 57,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js7": {
          "tipo": "EJE",
          "ei": -28.5,
          "es": 28.5,
          "IT": 57,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H8": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 89,
          "IT": 89,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h8": {
          "tipo": "EJE",
          "ei": -89,
          "es": 0,
          "IT": 89,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS8": {
          "tipo": "AGUJERO",
          "EI": -44.5,
          "ES": 44.5,
          "IT": 89,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js8": {
          "tipo": "EJE",
          "ei": -44.5,
          "es": 44.5,
          "IT": 89,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H9": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 140,
          "IT": 140,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h9": {
          "tipo": "EJE",
          "ei": -140,
          "es": 0,
          "IT": 140,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS9": {
          "tipo": "AGUJERO",
          "EI": -70.0,
          "ES": 70.0,
          "IT": 140,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js9": {
          "tipo": "EJE",
          "ei": -70.0,
          "es": 70.0,
          "IT": 140,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H10": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 230,
          "IT": 230,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h10": {
          "tipo": "EJE",
          "ei": -230,
          "es": 0,
          "IT": 230,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS10": {
          "tipo": "AGUJERO",
          "EI": -115.0,
          "ES": 115.0,
          "IT": 230,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js10": {
          "tipo": "EJE",
          "ei": -115.0,
          "es": 115.0,
          "IT": 230,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H11": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 360,
          "IT": 360,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h11": {
          "tipo": "EJE",
          "ei": -360,
          "es": 0,
          "IT": 360,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS11": {
          "tipo": "AGUJERO",
          "EI": -180.0,
          "ES": 180.0,
          "IT": 360,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js11": {
          "tipo": "EJE",
          "ei": -180.0,
          "es": 180.0,
          "IT": 360,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H12": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 570,
          "IT": 570,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h12": {
          "tipo": "EJE",
          "ei": -570,
          "es": 0,
          "IT": 570,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS12": {
          "tipo": "AGUJERO",
          "EI": -285.0,
          "ES": 285.0,
          "IT": 570,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js12": {
          "tipo": "EJE",
          "ei": -285.0,
          "es": 285.0,
          "IT": 570,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "g6": {
          "tipo": "EJE",
          "ei": -54.408,
          "es": -18.408,
          "IT": 36,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 354.965
        },
        "f7": {
          "tipo": "EJE",
          "ei": -118.086,
          "es": -61.086,
          "IT": 57,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 354.965
        },
        "e8": {
          "tipo": "EJE",
          "ei": -211.171,
          "es": -122.171,
          "IT": 89,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 354.965
        },
        "k6": {
          "tipo": "EJE",
          "ei": 4.248,
          "es": 40.248,
          "IT": 36,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 354.965
        },
        "m6": {
          "tipo": "EJE",
          "ei": 20.617,
          "es": 56.617,
          "IT": 36,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 354.965
        },
        "n6": {
          "tipo": "EJE",
          "ei": 36.816,
          "es": 72.816,
          "IT": 36,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 354.965
        },
        "p6": {
          "tipo": "EJE",
          "ei": 62.196,
          "es": 98.196,
          "IT": 36,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 354.965
        },
        "r6": {
          "tipo": "EJE",
          "ei": 111.065,
          "es": 147.065,
          "IT": 36,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 354.965
        },
        "s6": {
          "tipo": "EJE",
          "ei": 185.443,
          "es": 221.443,
          "IT": 36,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 354.965
        }
      }
    },
    "400_500": {
      "min_exclusive": 400,
      "max_inclusive": 500,
      "classes": {
        "H5": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 27,
          "IT": 27,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h5": {
          "tipo": "EJE",
          "ei": -27,
          "es": 0,
          "IT": 27,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS5": {
          "tipo": "AGUJERO",
          "EI": -13.5,
          "ES": 13.5,
          "IT": 27,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js5": {
          "tipo": "EJE",
          "ei": -13.5,
          "es": 13.5,
          "IT": 27,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H6": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 40,
          "IT": 40,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h6": {
          "tipo": "EJE",
          "ei": -40,
          "es": 0,
          "IT": 40,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS6": {
          "tipo": "AGUJERO",
          "EI": -20.0,
          "ES": 20.0,
          "IT": 40,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js6": {
          "tipo": "EJE",
          "ei": -20.0,
          "es": 20.0,
          "IT": 40,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H7": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 63,
          "IT": 63,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h7": {
          "tipo": "EJE",
          "ei": -63,
          "es": 0,
          "IT": 63,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS7": {
          "tipo": "AGUJERO",
          "EI": -31.5,
          "ES": 31.5,
          "IT": 63,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js7": {
          "tipo": "EJE",
          "ei": -31.5,
          "es": 31.5,
          "IT": 63,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H8": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 97,
          "IT": 97,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h8": {
          "tipo": "EJE",
          "ei": -97,
          "es": 0,
          "IT": 97,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS8": {
          "tipo": "AGUJERO",
          "EI": -48.5,
          "ES": 48.5,
          "IT": 97,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js8": {
          "tipo": "EJE",
          "ei": -48.5,
          "es": 48.5,
          "IT": 97,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H9": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 155,
          "IT": 155,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h9": {
          "tipo": "EJE",
          "ei": -155,
          "es": 0,
          "IT": 155,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS9": {
          "tipo": "AGUJERO",
          "EI": -77.5,
          "ES": 77.5,
          "IT": 155,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js9": {
          "tipo": "EJE",
          "ei": -77.5,
          "es": 77.5,
          "IT": 155,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H10": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 250,
          "IT": 250,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h10": {
          "tipo": "EJE",
          "ei": -250,
          "es": 0,
          "IT": 250,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS10": {
          "tipo": "AGUJERO",
          "EI": -125.0,
          "ES": 125.0,
          "IT": 250,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js10": {
          "tipo": "EJE",
          "ei": -125.0,
          "es": 125.0,
          "IT": 250,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H11": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 400,
          "IT": 400,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h11": {
          "tipo": "EJE",
          "ei": -400,
          "es": 0,
          "IT": 400,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS11": {
          "tipo": "AGUJERO",
          "EI": -200.0,
          "ES": 200.0,
          "IT": 400,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js11": {
          "tipo": "EJE",
          "ei": -200.0,
          "es": 200.0,
          "IT": 400,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "H12": {
          "tipo": "AGUJERO",
          "EI": 0,
          "ES": 630,
          "IT": 630,
          "source": "ISO286_DATABASE_BASIC_H",
          "status": "TMP_VALIDADO"
        },
        "h12": {
          "tipo": "EJE",
          "ei": -630,
          "es": 0,
          "IT": 630,
          "source": "ISO286_DATABASE_BASIC_h",
          "status": "TMP_VALIDADO"
        },
        "JS12": {
          "tipo": "AGUJERO",
          "EI": -315.0,
          "ES": 315.0,
          "IT": 630,
          "source": "ISO286_DATABASE_BASIC_JS",
          "status": "TMP_VALIDADO"
        },
        "js12": {
          "tipo": "EJE",
          "ei": -315.0,
          "es": 315.0,
          "IT": 630,
          "source": "ISO286_DATABASE_BASIC_js",
          "status": "TMP_VALIDADO"
        },
        "g6": {
          "tipo": "EJE",
          "ei": -59.912,
          "es": -19.912,
          "IT": 40,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 447.214
        },
        "f7": {
          "tipo": "EJE",
          "ei": -130.154,
          "es": -67.154,
          "IT": 63,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 447.214
        },
        "e8": {
          "tipo": "EJE",
          "ei": -231.309,
          "es": -134.309,
          "IT": 97,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 447.214
        },
        "k6": {
          "tipo": "EJE",
          "ei": 4.588,
          "es": 44.588,
          "IT": 40,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 447.214
        },
        "m6": {
          "tipo": "EJE",
          "ei": 22.301,
          "es": 62.301,
          "IT": 40,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 447.214
        },
        "n6": {
          "tipo": "EJE",
          "ei": 39.824,
          "es": 79.824,
          "IT": 40,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 447.214
        },
        "p6": {
          "tipo": "EJE",
          "ei": 68.375,
          "es": 108.375,
          "IT": 40,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 447.214
        },
        "r6": {
          "tipo": "EJE",
          "ei": 122.099,
          "es": 162.099,
          "IT": 40,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 447.214
        },
        "s6": {
          "tipo": "EJE",
          "ei": 205.284,
          "es": 245.284,
          "IT": 40,
          "source": "TMP_PREVALIDACION_FORMULA",
          "status": "PENDIENTE_VALIDACION_TABLA",
          "D_ref": 447.214
        }
      }
    }
  }
};

export function getISO286DatabaseInfo() {
  return {
    meta: ISO286_DATABASE.meta,
    ranges: Object.keys(ISO286_DATABASE.ranges || {}),
    loaded_classes_summary: {
      basic_validated: ["H5-H12", "h5-h12", "JS5-JS12", "js5-js12"],
      shaft_prevalidation: ["g6", "f7", "e8", "k6", "m6", "n6", "p6", "r6", "s6"]
    }
  };
}
