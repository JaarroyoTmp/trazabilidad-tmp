import { createPoint, rangePoints } from "./shared.js";

export function buildAlturaProcedure(ctx = {}) {
  const max = ctx.rango_max || 300;
  const rep = ctx.repeticiones || 5;
  const puntos = rangePoints(max, [0.1, 0.5, 0.9]);

  return {
    procedimiento: "MT15-CAP-04",
    norma: ["MT-15 Cap.4", "ILAC-G8", "ISO 14253"],
    descripcion: "Pauta automatica gramil / sonda de altura",
    funciones: [
      {
        id: "ALTURA",
        nombre: "Medicion de altura",
        patron_tipo: "BANCO_HORIZONTAL",
        puntos: puntos.map((p, i) => createPoint({
          id: `ALT_${i + 1}`,
          etiqueta: `Altura ${p} mm`,
          funcion: "ALTURA",
          nominal: p,
          patron_tipo: "BANCO_HORIZONTAL",
          repeticiones: rep
        }))
      }
    ],
    regla_global: "PEOR_PUNTO"
  };
}
