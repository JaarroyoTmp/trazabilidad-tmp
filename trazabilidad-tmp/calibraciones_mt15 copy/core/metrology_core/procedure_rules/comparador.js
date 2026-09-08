import { createPoint, rangePoints } from "./shared.js";

export function buildComparadorProcedure(ctx = {}) {
  const max = ctx.rango_max || 10;
  const rep = ctx.repeticiones || 5;
  const puntos = rangePoints(max, [0.1, 0.25, 0.5, 0.75, 1.0]);

  return {
    procedimiento: "MT15-CAP-05",
    norma: ["MT-15 Cap.5", "ILAC-G8", "ISO 14253"],
    descripcion: "Pauta automatica reloj comparador",
    funciones: [
      {
        id: "SUBIDA",
        nombre: "Carrera ascendente",
        patron_tipo: "BANCO_HORIZONTAL",
        puntos: puntos.map((p, i) => createPoint({
          id: `SUBIDA_${i + 1}`,
          etiqueta: `Subida ${p} mm`,
          funcion: "SUBIDA",
          nominal: p,
          patron_tipo: "BANCO_HORIZONTAL",
          repeticiones: rep
        }))
      },
      {
        id: "BAJADA",
        nombre: "Carrera descendente",
        patron_tipo: "BANCO_HORIZONTAL",
        puntos: [...puntos].reverse().map((p, i) => createPoint({
          id: `BAJADA_${i + 1}`,
          etiqueta: `Bajada ${p} mm`,
          funcion: "BAJADA",
          nominal: p,
          patron_tipo: "BANCO_HORIZONTAL",
          repeticiones: rep
        }))
      }
    ],
    regla_global: "PEOR_PUNTO"
  };
}
