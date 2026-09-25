import { createPoint, clampPoints, rangePoints } from "./shared.js";

export function buildMicrometroExteriorProcedure(ctx = {}) {
  const max = ctx.rango_max || 25;
  const min = ctx.rango_min || 0;
  const rep = ctx.repeticiones || 5;

  let puntos;
  if (max <= 25) puntos = [5, 10, 15, 20, 25];
  else puntos = rangePoints(max, [0.1, 0.25, 0.5, 0.75, 0.95]);

  puntos = clampPoints(puntos.filter((p) => p >= min), max);

  return {
    procedimiento: "MT15-CAP-02",
    norma: ["MT-15 Cap.2", "ILAC-G8", "ISO 14253"],
    descripcion: "Pauta automatica micrometro exterior",
    funciones: [
      {
        id: "EXTERIORES",
        nombre: "Medicion exterior",
        patron_tipo: "JUEGO_CALAS",
        puntos: puntos.map((p, i) => createPoint({
          id: `MIC_EXT_${i + 1}`,
          etiqueta: `Exterior ${p} mm`,
          funcion: "EXTERIORES",
          nominal: p,
          patron_tipo: "JUEGO_CALAS",
          repeticiones: rep
        }))
      }
    ],
    regla_global: "PEOR_PUNTO"
  };
}
