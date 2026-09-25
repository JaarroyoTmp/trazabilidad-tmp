/* ===========================================================
   TMP GAUGE LIMITS ENGINE V1
   -----------------------------------------------------------
   Motor normativo para límites de calibres lisos P/NP.

   Objetivo:
   - No inventar tolerancias.
   - Calcular límites de uso del calibre desde Ø + tolerancia ISO.
   - Entregar límites al decision_engine.

   V1:
   - Agujeros H con grados IT5-IT12.
   - Base ISO 286 para anchura IT.
   - Preparado para ampliar ISO 1938 / DIN 2250 con desgaste.
   =========================================================== */

export function parseNum(value, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function round(value, decimals = 6) {
  const f = Math.pow(10, decimals);
  return Math.round(parseNum(value) * f) / f;
}

export function iso286UnitI(nominalMm) {
  const D = parseNum(nominalMm);
  if (!D || D <= 0) return 0;

  // i en micras, fórmula ISO 286 para 1-500 mm
  return 0.45 * Math.cbrt(D) + 0.001 * D;
}

export function iso286ITWidthUm(nominalMm, grade) {
  const factors = {
    5: 7,
    6: 10,
    7: 16,
    8: 25,
    9: 40,
    10: 64,
    11: 100,
    12: 160
  };

  const factor = factors[grade];

  if (!factor) {
    return {
      ok: false,
      error: "GRADO_IT_NO_IMPLEMENTADO",
      grade
    };
  }

  const i = iso286UnitI(nominalMm);

  return {
    ok: true,
    grade,
    i_um: round(i, 6),
    width_um: round(i * factor, 3),
    width_mm: round((i * factor) / 1000, 6)
  };
}

export function parseGaugeDesignation(input = {}) {
  const raw = [
    input.designacion,
    input.rango,
    input.descripcion,
    input.nombre,
    input.modelo
  ].filter(Boolean).join(" ");

  const txt = String(raw || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[Ø⌀]/g, " Ø")
    .replace(/\s+/g, " ")
    .trim();

  const match = txt.match(/(?:Ø|D|DIAM(?:ETRO)?\.?)?\s*(\d+(?:[\.,]\d+)?)\s*([A-Z]{1,2})\s*(\d{1,2})/i);

  if (!match) {
    return {
      ok: false,
      error: "DESIGNACION_NO_RECONOCIDA",
      message: "No se pudo interpretar una designación tipo Ø8.5 H8.",
      raw,
      normalized: txt
    };
  }

  const nominal = parseNum(match[1]);
  const letter = match[2];
  const grade = parseInt(match[3], 10);
  const tipo = letter === letter.toUpperCase() ? "AGUJERO" : "EJE";

  return {
    ok: true,
    raw,
    normalized: txt,
    nominal,
    letter,
    grade,
    tipo,
    tolerance: `${letter}${grade}`
  };
}

export function calculateHoleLimitsISO286(parsed) {
  if (!parsed?.ok) return parsed;

  if (parsed.tipo !== "AGUJERO") {
    return {
      ok: false,
      error: "SOLO_AGUJERO_IMPLEMENTADO_V1",
      message: "V1 solo implementa calibres para agujeros."
    };
  }

  if (String(parsed.letter).toUpperCase() !== "H") {
    return {
      ok: false,
      error: "SOLO_AGUJERO_H_IMPLEMENTADO_V1",
      message: `V1 solo implementa agujeros H. Recibido: ${parsed.letter}${parsed.grade}.`
    };
  }

  const it = iso286ITWidthUm(parsed.nominal, parsed.grade);

  if (!it.ok) return it;

  const lower = parsed.nominal;
  const upper = parsed.nominal + it.width_mm;

  return {
    ok: true,
    nominal_base: parsed.nominal,
    tolerance: parsed.tolerance,
    agujero: {
      limite_inferior: round(lower, 6),
      limite_superior: round(upper, 6),
      ancho_tolerancia: it.width_mm
    },
    it,
    normativa: ["ISO 286", "ISO 1938-1", "DIN 2250-1"],
    warning: "V1 calcula límites ISO 286. La tolerancia propia del calibre/desgaste debe completarse con tabla ISO 1938/DIN 2250 validada."
  };
}

/*
  V1 de límites de aceptación del calibre:
  - Genera ventana de aceptación alrededor de cada nominal.
  - De momento usa tolerancia del calibre como porcentaje prudente del IT del agujero.
  - Lo correcto en V2 será cargar tabla ISO 1938/DIN 2250 real.
*/
export function calculateGaugeSideAcceptanceLimits({
  side,
  targetNominal,
  holeITWidthMm
} = {}) {
  const target = parseNum(targetNominal);
  const it = parseNum(holeITWidthMm);

  if (!target || !it) {
    return {
      ok: false,
      error: "DATOS_INSUFICIENTES_LIMITES_CALIBRE"
    };
  }

  /*
    Regla V1 TMP:
    tolerancia de aceptación provisional del calibre = 10% del IT del agujero,
    limitada entre 0.001 mm y 0.003 mm.
    Esto evita usar 0.01 genérico y deja el punto listo para sustituir por tabla ISO 1938.
  */
  const tol = Math.min(0.003, Math.max(0.001, it * 0.10));

  return {
    ok: true,
    side,
    nominal: round(target, 6),
    tolerancia_abs: round(tol, 6),
    limite_inferior: round(target - tol, 6),
    limite_superior: round(target + tol, 6),
    criterio: "TMP_GAUGE_LIMITS_V1",
    normativa: ["ISO 286", "ISO 1938-1", "DIN 2250-1"],
    nota: "Tolerancia V1 provisional derivada del IT. Sustituir por tabla ISO 1938/DIN 2250 validada."
  };
}

export function buildPlainPlugGaugeLimits(input = {}) {
  const parsed = parseGaugeDesignation(input);

  if (!parsed.ok) return parsed;

  const hole = calculateHoleLimitsISO286(parsed);

  if (!hole.ok) return hole;

  const pasa = calculateGaugeSideAcceptanceLimits({
    side: "PASA",
    targetNominal: hole.agujero.limite_inferior,
    holeITWidthMm: hole.agujero.ancho_tolerancia
  });

  const noPasa = calculateGaugeSideAcceptanceLimits({
    side: "NO_PASA",
    targetNominal: hole.agujero.limite_superior,
    holeITWidthMm: hole.agujero.ancho_tolerancia
  });

  return {
    ok: true,
    parsed,
    hole,
    pasa,
    no_pasa: noPasa,
    audit: {
      metodo: "Límites del calibre generados a partir de designación ISO del agujero.",
      normativa: ["ISO 286", "ISO 1938-1", "DIN 2250-1"],
      observaciones: [
        hole.warning,
        pasa.nota,
        noPasa.nota
      ]
    }
  };
}