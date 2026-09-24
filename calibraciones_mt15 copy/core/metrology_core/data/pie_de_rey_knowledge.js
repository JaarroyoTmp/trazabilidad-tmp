export const PIE_DE_REY_KNOWLEDGE = {
  norma: ["ISO 13385-1", "ILAC-G8", "ISO 14253-1"],
  familia: "PIE_DE_REY",
  funciones: {
    exteriores: {
      label: "Exteriores",
      patron: "Bloques patrón longitudinales",
      montaje: "Cerrar mordazas exteriores sobre el bloque patrón, sin forzar, manteniendo el calibre alineado.",
      notas: ["Limpiar mordazas y bloques antes de medir.", "Evitar inclinación del calibre.", "No aplicar presión excesiva."]
    },
    interiores: {
      label: "Interiores",
      patron: "Anillos patrón o accesorio de interiores",
      montaje: "Verificar con anillo patrón o accesorio equivalente validado por el laboratorio.",
      notas: ["Comprobar contacto simétrico.", "Evitar basculamiento en la lectura."]
    },
    profundidad: {
      label: "Profundidad",
      patron: "Bloques patrón sobre superficie de referencia",
      montaje: "Apoyar la base del calibre en superficie plana y medir contra bloque patrón.",
      notas: ["Asegurar apoyo completo de la base.", "La varilla debe estar limpia y sin deformación."]
    },
    escalon: {
      label: "Escalón",
      patron: "Bloques patrón / escalón de referencia",
      montaje: "Verificar con montaje estable de bloques patrón o patrón de escalón.",
      notas: ["Solo activar si el equipo dispone de función de escalón y el procedimiento interno lo contempla."]
    }
  },
  criteriosAltaEquipo: [
    "Familia: PIE_DE_REY",
    "Tipo: DIGITAL / ANALOGICO",
    "Rango: 0-150 / 0-200 / 0-300...",
    "Resolución: 0.01 / 0.02 / 0.05 mm",
    "Funciones disponibles: exteriores, interiores, profundidad, escalón"
  ]
};
