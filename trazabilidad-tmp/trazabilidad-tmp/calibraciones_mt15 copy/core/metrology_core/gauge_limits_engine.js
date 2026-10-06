import { calculateInternalPlugGaugeLimits } from "./iso1938_plain_gauge_limits.js";

/* ===========================================================
   TMP GAUGE LIMITS ENGINE V3 - ISO 1938-1:2026
   -----------------------------------------------------------
   Limites normativos para calibres lisos P/NP.

   Esta version elimina definitivamente la antigua tolerancia
   provisional del 10 % del IT.

   Alcance:
   - tampon liso cilindrico P/NP para agujero (Gauge type A)
   - hasta 500 mm
   - limites de desgaste para calibracion periodica
   =========================================================== */

export function parseNum(value, fallback = NaN) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function round(value, decimals = 6) {
  const n = parseNum(value);
  if (!Number.isFinite(n)) return null;
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

function collectRawText(input = {}) {
  return [
    input.designacion,
    input.rango,
    input.descripcion,
    input.nombre,
    input.modelo,
    input.observaciones
  ].filter(Boolean).join(" ");
}

function parseDirectLinearTolerance(input = {}) {
  const raw = collectRawText(input)
    .replace(/[Ø⌀]/g, " ")
    .replace(/,/g, ".")
    .replace(/\s+/g, " ")
    .trim();

  // X +/- A
  let m = raw.match(/(\d+(?:\.\d+)?)\s*[±]\s*(\d+(?:\.\d+)?)/);
  if (m) {
    const nominal = Number(m[1]);
    const t = Number(m[2]);
    return { ok: true, lower: nominal - t, upper: nominal + t, nominal, source: "DIRECT_PLUS_MINUS" };
  }

  // X +A / -B   (permite /, espacios o texto intermedio corto)
  m = raw.match(/(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)\s*(?:\/|;|\s)\s*-\s*(\d+(?:\.\d+)?)/);
  if (m) {
    const nominal = Number(m[1]);
    return {
      ok: true,
      lower: nominal - Number(m[3]),
      upper: nominal + Number(m[2]),
      nominal,
      source: "DIRECT_ASYMMETRIC"
    };
  }

  // X +A (desviacion inferior cero)
  m = raw.match(/(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)/);
  if (m) {
    const nominal = Number(m[1]);
    return { ok: true, lower: nominal, upper: nominal + Number(m[2]), nominal, source: "DIRECT_PLUS" };
  }

  return { ok: false };
}

function resolveWorkpieceLimits(input = {}) {
  const explicitPasa = parseNum(input.nominal_pasa);
  const explicitNoPasa = parseNum(input.nominal_no_pasa);

  if (Number.isFinite(explicitPasa) && Number.isFinite(explicitNoPasa) && explicitNoPasa > explicitPasa) {
    return {
      ok: true,
      lower: explicitPasa,
      upper: explicitNoPasa,
      size: parseNum(input.plain_limit_data?.parsed?.nominal, explicitPasa),
      isoGrade: input.plain_limit_data?.parsed?.grade ?? null,
      source: "NOMINALES_PASA_NO_PASA_RESUELTOS"
    };
  }

  const pld = input.plain_limit_data;
  if (pld?.ok) {
    const pasa = parseNum(pld.nominal_pasa);
    const noPasa = parseNum(pld.nominal_no_pasa);
    if (Number.isFinite(pasa) && Number.isFinite(noPasa) && noPasa > pasa) {
      return {
        ok: true,
        lower: pasa,
        upper: noPasa,
        size: parseNum(pld.parsed?.nominal, pasa),
        isoGrade: pld.parsed?.grade ?? null,
        source: "PLAIN_LIMIT_ENGINE"
      };
    }
  }

  const direct = parseDirectLinearTolerance(input);
  if (direct.ok && direct.upper > direct.lower) {
    return {
      ok: true,
      lower: direct.lower,
      upper: direct.upper,
      size: direct.nominal,
      isoGrade: null,
      source: direct.source
    };
  }

  return {
    ok: false,
    error: "LIMITES_PIEZA_NO_RESUELTOS",
    message: "No se han podido resolver los limites funcionales PASA/NO PASA de la pieza."
  };
}

function buildSide(result, side) {
  const data = side === "PASA" ? result.pasa : result.no_pasa;
  const wear = data.wear_state;

  return {
    ok: true,
    side,
    nominal_funcional: side === "PASA" ? result.workpiece.lower_mm : result.workpiece.upper_mm,
    limite_inferior: wear.lower_mm,
    limite_superior: wear.upper_mm,
    centro_zona_desgaste: wear.center_mm,
    // NO se devuelve tolerancia_abs: la zona puede ser asimetrica respecto al nominal marcado.
    criterio: "ISO1938_1_2026_TYPE_A_WEAR_LIMITS",
    estado_evaluado: "LIMITE_DESGASTE",
    new_state: data.new_state,
    wear_state: data.wear_state,
    equivalent_it: result.equivalent_it,
    parameters: result.parameters,
    normativa: ["ISO 1938-1:2026", "ISO 286-1:2010", "ISO 14253-1:2017"],
    audit: result.audit
  };
}

export function buildPlainPlugGaugeLimits(input = {}) {
  const workpiece = resolveWorkpieceLimits(input);
  if (!workpiece.ok) return workpiece;

  const calculated = calculateInternalPlugGaugeLimits({
    workpieceLowerMm: workpiece.lower,
    workpieceUpperMm: workpiece.upper,
    sizeMm: workpiece.size,
    isoGrade: workpiece.isoGrade
  });

  if (!calculated.ok) {
    return {
      ...calculated,
      workpiece_source: workpiece.source
    };
  }

  return {
    ok: true,
    engine_version: "TMP_GAUGE_LIMITS_V3_ISO1938_2026",
    workpiece_source: workpiece.source,
    workpiece: calculated.workpiece,
    equivalent_it: calculated.equivalent_it,
    parameters: calculated.parameters,
    pasa: buildSide(calculated, "PASA"),
    no_pasa: buildSide(calculated, "NO_PASA"),
    audit: {
      ...calculated.audit,
      workpiece_source: workpiece.source,
      normativa: ["ISO 1938-1:2026 7.2/7.4 Tables 6-11", "ISO 286-1:2010", "ISO 14253-1:2017"],
      note: "Para calibracion periodica se evaluan los limites de desgaste del calibre. Los limites de nuevo se conservan para trazabilidad. Base normativa vigente: ISO 1938-1:2026 + ISO 286-1:2010 + ISO 14253-1:2017."
    }
  };
}
