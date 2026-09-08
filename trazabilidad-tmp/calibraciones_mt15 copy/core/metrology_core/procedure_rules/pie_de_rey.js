import { createPoint, rangePoints, clampPoints } from "./shared.js";

export function buildPieDeReyProcedure(ctx = {}) {
  const max = ctx.rango_max || 300;
  const rep = ctx.repeticiones || 5;
  const respuestas = ctx.respuestas || {};

  const calibrarExteriores = respuestas.calibrar_exteriores !== false;
  const calibrarInteriores = respuestas.calibrar_interiores !== false;

  const tieneSonda = ctx.instrumento?.tiene_sonda !== false;
  const puedeSonda = max <= 300 && tieneSonda;
  const calibrarSonda = puedeSonda && respuestas.calibrar_sonda !== false;

  const funciones = [];

  if (calibrarExteriores) {
    const puntos = clampPoints(max <= 300 ? [25, 100, 200, max] : rangePoints(max, [0.1, 0.5, 0.9]), max);
    funciones.push({
      id: "EXTERIORES",
      nombre: "Medicion de exteriores",
      patron_tipo: "BANCO_HORIZONTAL",
      regla_decision_global: "CUALQUIER_FUNCION_NO_OK_ES_NO_APTO",
      puntos: puntos.map((p, i) => createPoint({
        id: `EXT_${i + 1}`,
        etiqueta: `Exterior ${p} mm`,
        funcion: "EXTERIORES",
        nominal: p,
        patron_tipo: "BANCO_HORIZONTAL",
        repeticiones: rep
      }))
    });
  }

  if (calibrarInteriores) {
    const puntos = clampPoints(max <= 300 ? [25, 100, 200] : rangePoints(max, [0.1, 0.5, 0.9]), max);
    funciones.push({
      id: "INTERIORES",
      nombre: "Medicion de interiores",
      patron_tipo: "ANILLO_PATRON",
      regla_decision_global: "CUALQUIER_FUNCION_NO_OK_ES_NO_APTO",
      puntos: puntos.map((p, i) => createPoint({
        id: `INT_${i + 1}`,
        etiqueta: `Interior ${p} mm`,
        funcion: "INTERIORES",
        nominal: p,
        patron_tipo: "ANILLO_PATRON",
        repeticiones: rep
      }))
    });
  }

  if (calibrarSonda) {
    const puntos = clampPoints([50, 150, 250], max);
    funciones.push({
      id: "SONDA_PROFUNDIDAD",
      nombre: "Sonda de profundidad",
      patron_tipo: "JUEGO_CALAS",
      regla_decision_global: "CUALQUIER_FUNCION_NO_OK_ES_NO_APTO",
      puntos: puntos.map((p, i) => createPoint({
        id: `SONDA_${i + 1}`,
        etiqueta: `Profundidad ${p} mm`,
        funcion: "SONDA_PROFUNDIDAD",
        nominal: p,
        patron_tipo: "JUEGO_CALAS",
        repeticiones: rep
      }))
    });
  }

  return {
    procedimiento: "MT15-CAP-03",
    norma: ["MT-15 Cap.3", "ILAC-G8", "ISO 14253"],
    descripcion: "Pauta automatica pie de rey",
    preguntas: [
      { id: "calibrar_exteriores", texto: "Calibrar exteriores", defecto: true },
      { id: "calibrar_interiores", texto: "Calibrar interiores", defecto: true },
      { id: "calibrar_sonda", texto: "Calibrar sonda de profundidad", defecto: puedeSonda, visible: puedeSonda }
    ],
    funciones,
    regla_global: "CUALQUIER_FUNCION_NO_OK_ES_NO_APTO",
    warnings: puedeSonda ? [] : ["Sonda de profundidad no propuesta por rango > 300 mm o equipo sin sonda."]
  };
}
