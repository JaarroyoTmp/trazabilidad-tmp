import { createPoint } from "./shared.js";

export function buildBalanzaProcedure(ctx = {}) {
  const max = ctx.rango_max || 1000;
  const rep = ctx.repeticiones || 5;

  const puntos = [max * 0.25, max * 0.5, max * 0.75, max];

  return {
    procedimiento: "PROC-PC-BALANZA",
    norma: ["OIML R76", "EA-4/02", "ISO 14253"],
    descripcion: "Pauta automatica balanza",
    funciones: [
      {
        id: "LINEALIDAD",
        nombre: "Linealidad",
        patron_tipo: "PESAS_PATRON",
        puntos: puntos.map((p, i) => createPoint({
          id: `LIN_${i + 1}`,
          etiqueta: `Carga ${p} g`,
          funcion: "LINEALIDAD",
          nominal: p,
          unidad: "g",
          patron_tipo: "PESAS_PATRON",
          repeticiones: rep
        }))
      },
      {
        id: "REPETIBILIDAD",
        nombre: "Repetibilidad",
        patron_tipo: "PESAS_PATRON",
        puntos: [createPoint({
          id: "REP_1",
          etiqueta: `Repetibilidad ${max * 0.5} g`,
          funcion: "REPETIBILIDAD",
          nominal: max * 0.5,
          unidad: "g",
          patron_tipo: "PESAS_PATRON",
          repeticiones: rep
        })]
      }
    ],
    regla_global: "CUALQUIER_PRUEBA_NO_OK_ES_NO_APTO"
  };
}
