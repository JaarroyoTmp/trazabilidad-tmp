/* ===========================================================
   TMP REFERENCE VALUE RESOLVER V1
   -----------------------------------------------------------
   V1:
   - Composición de calas patrón.
   - Suma de correcciones individuales.
   - Combinación de incertidumbres por RSS.
   =========================================================== */

export function parseNum(value, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function roundTo(value, decimals = 6) {
  const n = parseNum(value);
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

export function rss(values = []) {
  return Math.sqrt(
    values.map((v) => parseNum(v)).reduce((acc, v) => acc + Math.pow(v, 2), 0)
  );
}

export function umToMm(valueUm) {
  return parseNum(valueUm) / 1000;
}

export function mmToUm(valueMm) {
  return parseNum(valueMm) * 1000;
}

export function normalizePatternValue(row = {}) {
  return {
    id: row.id || null,
    patron_id: row.patron_id || null,
    certificado_id: row.certificado_id || null,
    identificacion_elemento: row.identificacion_elemento || row.codigo || null,
    nominal: parseNum(row.nominal),
    unidad: row.unidad || "mm",
    correccion: parseNum(row.correccion),
    correccion_unidad: row.correccion_unidad || "um",
    incertidumbre: parseNum(row.incertidumbre),
    incertidumbre_unidad: row.incertidumbre_unidad || "um",
    variacion: parseNum(row.variacion),
    variacion_unidad: row.variacion_unidad || "um",
    k: parseNum(row.k, 2),
    activo: row.activo !== false,
    raw: row
  };
}

/**
 * Compone calas para alcanzar un nominal.
 * V1 usa búsqueda greedy descendente.
 */
export function composeGaugeBlocks(targetMm, values = [], options = {}) {
  const toleranceMm = parseNum(options.toleranceMm, 0.000001);
  const maxBlocks = parseNum(options.maxBlocks, 8);
  const target = roundTo(targetMm, 6);

  const blocks = values
    .map(normalizePatternValue)
    .filter((v) => v.activo && v.nominal > 0)
    .sort((a, b) => b.nominal - a.nominal);

  let remaining = target;
  const selected = [];

  for (const block of blocks) {
    if (selected.length >= maxBlocks) break;

    const n = roundTo(block.nominal, 6);
    if (n <= remaining + toleranceMm) {
      selected.push(block);
      remaining = roundTo(remaining - n, 6);

      if (Math.abs(remaining) <= toleranceMm) {
        remaining = 0;
        break;
      }
    }
  }

  const nominalSum = roundTo(
    selected.reduce((acc, b) => acc + parseNum(b.nominal), 0),
    6
  );

  const ok = Math.abs(target - nominalSum) <= toleranceMm;

  return {
    ok,
    target,
    nominal_sum: nominalSum,
    remaining: roundTo(target - nominalSum, 6),
    selected,
    selected_nominals: selected.map((b) => b.nominal),
    selected_ids: selected.map((b) => b.identificacion_elemento),
    strategy: "GREEDY_DESC"
  };
}

/**
 * Calcula valor real e incertidumbre de la composición.
 * Convención:
 * - nominal en mm
 * - correcciones e incertidumbres en µm
 * - valor_real = nominal_total + correccion_total_mm
 */
export function calculateGaugeBlockReference(composition) {
  const selected = composition.selected || [];

  const correctionUm = selected.reduce(
    (acc, b) => acc + parseNum(b.correccion),
    0
  );

  const uncertaintyUm = rss(selected.map((b) => b.incertidumbre));

  const nominalMm = parseNum(composition.nominal_sum);
  const correctionMm = umToMm(correctionUm);
  const uncertaintyMm = umToMm(uncertaintyUm);

  return {
    ok: composition.ok,
    tipo_referencia: "JUEGO_CALAS_COMPOSICION",
    nominal_objetivo: composition.target,
    nominal_composicion: nominalMm,
    valor_real: roundTo(nominalMm + correctionMm, 9),

    correccion_total_um: roundTo(correctionUm, 6),
    correccion_total_mm: roundTo(correctionMm, 9),

    incertidumbre_total_um: roundTo(uncertaintyUm, 6),
    incertidumbre_total_mm: roundTo(uncertaintyMm, 9),

    k: selected.length ? selected[0].k : 2,

    componentes: selected.map((b) => ({
      id: b.id,
      identificacion_elemento: b.identificacion_elemento,
      nominal: b.nominal,
      correccion_um: b.correccion,
      incertidumbre_um: b.incertidumbre,
      variacion_um: b.variacion,
      k: b.k
    })),

    warnings: composition.ok
      ? []
      : [`No se pudo componer exactamente ${composition.target} mm. Resto: ${composition.remaining} mm.`]
  };
}

/**
 * Resolver principal V1.
 */
export async function resolveReferenceValue(request = {}) {
  const tipo = String(request.tipo_patron || request.tipo || "").toUpperCase();
  const nominal = parseNum(request.nominal);

  if (!nominal) {
    return {
      ok: false,
      error: "NOMINAL_INVALIDO",
      message: "No se ha indicado un nominal válido."
    };
  }

  if (tipo === "JUEGO_CALAS" || tipo === "BLOQUES_PATRON" || tipo === "CALAS") {
    let values = request.values || [];

    if (!values.length && typeof request.loadValues === "function") {
      values = await request.loadValues(request);
    }

    if (!values.length) {
      return {
        ok: false,
        error: "SIN_VALORES_PATRON",
        message: "No hay valores individuales cargados para el juego de calas."
      };
    }

    const composition = composeGaugeBlocks(nominal, values, request.options || {});
    const reference = calculateGaugeBlockReference(composition);

    return {
      ...reference,
      patron_id: request.patron_id || null,
      certificado_id: request.certificado_id || null
    };
  }

  return {
    ok: false,
    error: "TIPO_PATRON_NO_IMPLEMENTADO",
    message: `El tipo de patrón ${tipo || "(vacío)"} todavía no está implementado en V1.`
  };
}

export async function loadPatternValuesFromSupabase(supabase, patronId) {
  if (!supabase) throw new Error("Falta cliente Supabase");
  if (!patronId) throw new Error("Falta patronId");

  const { data, error } = await supabase
    .from("patron_valores")
    .select("*")
    .eq("patron_id", patronId)
    .eq("activo", true)
    .order("nominal", { ascending: false });

  if (error) throw error;
  return data || [];
}