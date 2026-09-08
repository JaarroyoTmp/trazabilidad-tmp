import { createPoint, rangePoints } from "./shared.js";

export function buildMicrometroInteriorProcedure(ctx = {}) {
  const max = ctx.rango_max || 25;
  const min = ctx.rango_min || 0;
  const rep = ctx.repeticiones || 5;
  const puntos = rangePoints(max, [0.2, 0.5, 0.9]).filter((p) => p >= min);

  return {
    procedimiento: "MT15-CAP-13",
    norma: ["MT-15 Cap.13", "ILAC-G8", "ISO 14253"],
    descripcion: "Pauta automatica micrometro interior 3 contactos",
    funciones: [
      {
        id: "INTERIORES",
        nombre: "Medicion interior con anillos patron",
        patron_tipo: "ANILLO_PATRON",
        puntos: puntos.map((p, i) => createPoint({
          id: `MIC_INT_${i + 1}`,
          etiqueta: `Interior ${p} mm`,
          funcion: "INTERIORES",
          nominal: p,
          patron_tipo: "ANILLO_PATRON",
          repeticiones: rep
        }))
      }
    ],
    regla_global: "PEOR_PUNTO"
  };
}
