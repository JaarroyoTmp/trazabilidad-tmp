// Catálogo inicial de procedimientos MT15.
// En la siguiente fase lo conectaremos con la familia/tipo del instrumento.

export const PROCEDIMIENTOS_MT15 = {
  MICROMETRO_EXTERIOR: {
    capitulo: "MT15 Cap. 2",
    nombre: "Micrómetro de exteriores",
    bloques: ["CERO", "CALIBRACION"],
    repeticiones: 5,
    patrones: ["calas patrón"],
  },
  PIE_REY: {
    capitulo: "MT15 Cap. 3",
    nombre: "Pie de rey",
    bloques: ["BOCA", "PUNTAS", "SONDA"],
    repeticiones: 5,
    patrones: ["calas patrón", "anillo patrón"],
  },
  TAMPON_PNP: {
    capitulo: "MT15 Cap. 8",
    nombre: "Calibre / tampón pasa-no pasa",
    bloques: ["GO", "NO_GO"],
    repeticiones: 5,
    patrones: ["banco", "calas patrón", "micrómetro milesimal"],
  },
  FLEXOMETRO: {
    capitulo: "MT15 Cap. 12",
    nombre: "Flexómetro",
    tipo: "atributos",
    bloques: ["INSPECCION_VISUAL"],
  },
  GENERICO: {
    capitulo: "Procedimiento genérico TMP",
    nombre: "Calibración genérica",
    bloques: ["GNG", "EXT", "INT", "ALT", "BAL", "DIN", "DURO", "PATRON"],
  }
};
