/* ===========================================================
   TMP P1 - PIE DE REY EXPERTO V1.5
   -----------------------------------------------------------
   Genera pauta inteligente bajo / medio / alto.
   Los datos tecnicos vienen del alta/Supabase.
   Los patrones se seleccionan mediante MC-01 Pattern Selection.
   =========================================================== */

export function parseNum(value, fallback = null) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(",", ".").replace(/[^0-9.+-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectPieDeReyType(equipo = {}) {
  const text = normalizeText([equipo.descripcion, equipo.tipo, equipo.modelo, equipo.rango, equipo.designacion].filter(Boolean).join(" "));
  if (text.includes("digital")) return "DIGITAL";
  if (text.includes("analog") || text.includes("nonio") || text.includes("vernier")) return "ANALOGICO";
  if (text.includes("reloj")) return "RELOJ";
  return equipo.tipo_pie_de_rey || equipo.tipo || "NO_DETECTADO";
}

export function detectRangeMax(equipo = {}) {
  const candidates = [
    equipo.rango_max,
    equipo.rango_hasta,
    equipo.alcance_max,
    equipo.alcance,
    equipo.rango,
    equipo.designacion,
    equipo.descripcion
  ];

  for (const c of candidates) {
    if (c === null || c === undefined || c === "") continue;
    if (typeof c === "number") return c;
    const nums = String(c).match(/\d+(?:[,.]\d+)?/g)?.map((x) => parseNum(x)).filter((x) => x !== null) || [];
    if (nums.length >= 2) return Math.max(...nums);
    if (nums.length === 1) return nums[0];
  }

  return null;
}

export function detectResolution(equipo = {}) {
  const candidates = [
    equipo.resolucion,
    equipo.precision,
    equipo.division_escala,
    equipo.apreciacion,
    equipo.descripcion,
    equipo.modelo
  ];
  for (const c of candidates) {
    const n = parseNum(c, null);
    if (n !== null && n > 0 && n <= 0.1) return n;
  }
  return null;
}

export function getLowMidHighPoints(rangeMax) {
  const max = parseNum(rangeMax, 150);
  if (max <= 0) return [20, 75, 150];

  const low = max <= 100 ? Math.max(10, Math.round(max * 0.2)) : 20;
  const mid = Math.round((max / 2) / 5) * 5;
  const high = max;

  return [...new Set([low, mid, high])].filter((x) => x > 0 && x <= max);
}

export function buildPieDeReyPlan({ equipo = {}, funciones = {}, lecturasPorPunto = 5 } = {}) {
  const rangoMax = detectRangeMax(equipo);
  const resolucion = detectResolution(equipo);
  const tipo = detectPieDeReyType(equipo);
  const pointsBase = getLowMidHighPoints(rangoMax || 150);
  const points = [];

  const addPoints = (funcion, prefix, labelBase, nominales = pointsBase) => {
    nominales.forEach((nominal, idx) => {
      points.push({
        id: `${prefix}_${idx + 1}`,
        funcion,
        punto: `${labelBase} ${nominal} mm`,
        nominal,
        lecturas: lecturasPorPunto,
        unidad: "mm"
      });
    });
  };

  if (funciones.exteriores !== false) addPoints("EXTERIORES", "EXT", "Exterior");
  if (funciones.interiores) addPoints("INTERIORES", "INT", "Interior");
  if (funciones.profundidad) addPoints("PROFUNDIDAD", "PROF", "Profundidad");
  if (funciones.escalon) addPoints("ESCALON", "ESC", "Escalon");

  return {
    family: "PIE_DE_REY",
    version: "P1_5_LOW_MID_HIGH_PATTERN_SELECTION",
    equipo,
    detected: {
      tipo,
      rangoMax,
      resolucion,
      confidence: [tipo !== "NO_DETECTADO", rangoMax !== null, resolucion !== null].filter(Boolean).length / 3
    },
    funciones: {
      exteriores: funciones.exteriores !== false,
      interiores: Boolean(funciones.interiores),
      profundidad: Boolean(funciones.profundidad),
      escalon: Boolean(funciones.escalon)
    },
    strategy: "Bajo / medio / alto del rango util. 5 lecturas por punto.",
    points,
    accessories: buildAccessoryHints(funciones),
    guides: buildOperationGuides(funciones)
  };
}

export function buildAccessoryHints(funciones = {}) {
  const items = [
    "Pano limpio / alcohol isopropilico",
    "Condicion ambiental 20 +/- 1 C",
    "Registro de estabilizacion"
  ];

  if (funciones.exteriores !== false) items.push("Exterior: banco Trimos/banco horizontal si esta disponible y vigente");
  if (funciones.interiores) items.push("Interior: anillos patron vigentes del rango disponible");
  if (funciones.profundidad) items.push("Profundidad: bloques patron + superficie de referencia");
  if (funciones.escalon) items.push("Escalon: bloques patron + superficie de referencia");

  return items;
}

export function buildOperationGuides(funciones = {}) {
  const guides = [];

  if (funciones.exteriores !== false) {
    guides.push({
      funcion: "EXTERIORES",
      titulo: "Medicion exterior",
      instrucciones: [
        "Priorizar banco Trimos o banco horizontal vigente si cubre el rango.",
        "Cerrar mordazas sin forzar y mantener el calibre alineado.",
        "Tomar cinco lecturas por punto y evitar presion excesiva."
      ]
    });
  }

  if (funciones.interiores) {
    guides.push({
      funcion: "INTERIORES",
      titulo: "Medicion interior",
      instrucciones: [
        "Usar anillos patron vigentes del rango disponible.",
        "Asegurar contacto simetrico de las puntas interiores.",
        "Evitar inclinacion durante la lectura."
      ]
    });
  }

  if (funciones.profundidad) {
    guides.push({
      funcion: "PROFUNDIDAD",
      titulo: "Medicion de profundidad",
      instrucciones: [
        "Apoyar la base del calibre en superficie plana de referencia.",
        "Medir contra bloque patron o composicion estable.",
        "Verificar que la varilla baja sin deformacion ni holgura."
      ]
    });
  }

  if (funciones.escalon) {
    guides.push({
      funcion: "ESCALON",
      titulo: "Medicion de escalon",
      instrucciones: [
        "Usar montaje estable con bloques patron.",
        "Comprobar apoyo completo del calibre.",
        "Evitar error por inclinacion."
      ]
    });
  }

  return guides;
}

export default { buildPieDeReyPlan, detectPieDeReyType, detectRangeMax, detectResolution, getLowMidHighPoints };
