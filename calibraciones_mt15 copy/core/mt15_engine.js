/* ===========================================================
   MOTOR MT15 - TMP
   Criterios de calibración por tipo de instrumento
   =========================================================== */

export function parseNum(v) {
  if (typeof v === "number") return v;
  if (v === null || v === undefined) return 0;
  const n = Number(String(v).trim().replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function media(valores) {
  const nums = valores.map(parseNum).filter(Number.isFinite);
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function desviacionTipicaMuestral(valores) {
  const nums = valores.map(parseNum).filter(Number.isFinite);
  const n = nums.length;
  if (n < 2) return 0;

  const m = media(nums);
  const suma = nums.reduce((acc, x) => acc + Math.pow(x - m, 2), 0);
  return Math.sqrt(suma / (n - 1));
}

export function evaluarILAC(errorUm, uUm, toleranciaUm) {
  const absE = Math.abs(parseNum(errorUm));
  const U = parseNum(uUm);
  const T = parseNum(toleranciaUm);

  if (absE + U <= T) return "APTO";
  if (absE - U > T) return "NO APTO";
  return "INDETERMINADO";
}

export function detectarFamiliaMT15(instrumento = {}) {
  const txt = [
    instrumento.codigo,
    instrumento.descripcion,
    instrumento.familia,
    instrumento.rango,
    instrumento.tipo_calibracion,
    instrumento.fabricante_tipo
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (txt.includes("tamp") || txt.includes("p/np") || txt.includes("pasa") || txt.includes("no pasa")) {
    return "TAMPON_LISO_PNP";
  }

  if (txt.includes("anillo")) return "ANILLO_PATRON";
  if (txt.includes("pie de rey") || txt.includes("calibre")) return "PIE_DE_REY";
  if (txt.includes("micrometro") || txt.includes("micrómetro")) return "MICROMETRO";
  if (txt.includes("alexometro") || txt.includes("alexómetro") || txt.includes("alesometro") || txt.includes("alesómetro")) return "ALEXOMETRO";
  if (txt.includes("reloj comparador") || txt.includes("comparador")) return "RELOJ_COMPARADOR";
  if (txt.includes("trimos") || txt.includes("banco")) return "BANCO_HORIZONTAL";
  if (txt.includes("bloque")) return "BLOQUE_PATRON";

  return "GENERICO";
}

export function obtenerCriterioMT15(familia) {
  const criterios = {
    TAMPON_LISO_PNP: {
      procedimiento: "MT15 - Tampón liso P/NP",
      tipo: "Dimensional por comparación",
      puntos_minimos: 2,
      repeticiones_minimas: 3,
      referencia: "Patrón materializado",
      regla_decision: "ILAC-G8",
      criterios: [
        "Evaluar lado GO y lado NO GO por separado.",
        "Calcular media de lecturas.",
        "Calcular error frente al valor nominal o patrón.",
        "Evaluar conformidad considerando incertidumbre expandida.",
        "Resultado global no apto si cualquier punto es no apto."
      ]
    },

    ANILLO_PATRON: {
      procedimiento: "MT15 - Anillo patrón",
      tipo: "Dimensional por comparación",
      puntos_minimos: 1,
      repeticiones_minimas: 3,
      referencia: "Banco horizontal / patrón trazable",
      regla_decision: "ILAC-G8",
      criterios: [
        "Calcular diámetro medio.",
        "Aplicar corrección del patrón si existe.",
        "Calcular error respecto al nominal.",
        "Evaluar incertidumbre expandida.",
        "Emitir decisión global por ILAC-G8."
      ]
    },

    PIE_DE_REY: {
      procedimiento: "MT15 - Pie de rey / calibre",
      tipo: "Dimensional de indicación",
      puntos_minimos: 5,
      repeticiones_minimas: 3,
      referencia: "Bloques patrón",
      regla_decision: "ILAC-G8",
      criterios: [
        "Evaluar varios puntos del rango.",
        "Calcular error de indicación.",
        "Considerar resolución del equipo.",
        "Evaluar repetibilidad.",
        "Decisión global según peor punto."
      ]
    },

    MICROMETRO: {
      procedimiento: "MT15 - Micrómetro",
      tipo: "Dimensional de indicación",
      puntos_minimos: 5,
      repeticiones_minimas: 3,
      referencia: "Bloques patrón",
      regla_decision: "ILAC-G8",
      criterios: [
        "Evaluar puntos distribuidos en el rango.",
        "Calcular error de indicación.",
        "Considerar resolución.",
        "Evaluar repetibilidad.",
        "Evaluar conformidad según tolerancia definida."
      ]
    },

    ALEXOMETRO: {
      procedimiento: "MT15 - Alexómetro",
      tipo: "Dimensional por comparación",
      puntos_minimos: 1,
      repeticiones_minimas: 3,
      referencia: "Anillo patrón / bloques patrón",
      regla_decision: "ILAC-G8",
      criterios: [
        "Ajustar contra patrón trazable.",
        "Evaluar desviación de indicación.",
        "Calcular repetibilidad.",
        "Considerar patrón utilizado.",
        "Aplicar decisión ILAC-G8."
      ]
    },

    RELOJ_COMPARADOR: {
      procedimiento: "MT15 - Reloj comparador",
      tipo: "Indicador de desplazamiento",
      puntos_minimos: 5,
      repeticiones_minimas: 3,
      referencia: "Banco de comparación",
      regla_decision: "ILAC-G8",
      criterios: [
        "Evaluar error de indicación.",
        "Evaluar repetibilidad.",
        "Evaluar retorno o histéresis si aplica.",
        "Considerar resolución.",
        "Aplicar decisión global por peor punto."
      ]
    },

    BANCO_HORIZONTAL: {
      procedimiento: "MT15 - Banco horizontal",
      tipo: "Equipo patrón dimensional",
      puntos_minimos: 5,
      repeticiones_minimas: 3,
      referencia: "Bloques patrón / patrón trazable",
      regla_decision: "ILAC-G8",
      criterios: [
        "Evaluar error de indicación en varios puntos.",
        "Aplicar correcciones del certificado patrón.",
        "Calcular incertidumbre expandida.",
        "Evaluar linealidad.",
        "Emitir decisión global."
      ]
    },

    BLOQUE_PATRON: {
      procedimiento: "MT15 - Bloque patrón",
      tipo: "Patrón materializado",
      puntos_minimos: 1,
      repeticiones_minimas: 3,
      referencia: "Certificado externo / comparador",
      regla_decision: "ILAC-G8",
      criterios: [
        "Evaluar desviación respecto al nominal.",
        "Registrar corrección.",
        "Registrar incertidumbre.",
        "Mantener trazabilidad documental.",
        "Aplicar decisión según tolerancia asignada."
      ]
    },

    GENERICO: {
      procedimiento: "MT15 - Calibración dimensional genérica",
      tipo: "Dimensional",
      puntos_minimos: 1,
      repeticiones_minimas: 3,
      referencia: "Patrón trazable",
      regla_decision: "ILAC-G8",
      criterios: [
        "Calcular media.",
        "Calcular error.",
        "Calcular repetibilidad.",
        "Aplicar incertidumbre.",
        "Aplicar decisión ILAC-G8."
      ]
    }
  };

  return criterios[familia] || criterios.GENERICO;
}
