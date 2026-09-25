import { createPoint, parseNum } from "./shared.js";

export function buildLlaveDinamometricaProcedure(ctx = {}) {
  const max = ctx.rango_max || parseNum(ctx.instrumento?.alcance) || 100;
  const rep = ctx.repeticiones || 5;

  const puntos = [
    Math.max(max * 0.2, parseNum(ctx.instrumento?.rango_min, 0)),
    max * 0.6,
    max
  ].filter((p) => p > 0);

  return {
    procedimiento: "PC-02-35",
    norma: ["UNE-EN ISO 6789", "EA-4/02", "ISO 14253"],
    descripcion: "Pauta automatica llave dinamometrica",
    funciones: [
      {
        id: "TORQUE",
        nombre: "Puntos de par",
        patron_tipo: "BANCO_TORQUE",
        puntos: puntos.map((p, i) => createPoint({
          id: `TORQUE_${i + 1}`,
          etiqueta: `${Math.round(p * 1000) / 1000} Nm`,
          funcion: "TORQUE",
          nominal: p,
          unidad: "Nm",
          patron_tipo: "BANCO_TORQUE",
          repeticiones: rep
        }))
      }
    ],
    regla_global: "PEOR_PUNTO"
  };
}
