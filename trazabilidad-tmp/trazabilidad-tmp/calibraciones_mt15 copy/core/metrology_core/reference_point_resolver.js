/* ===========================================================
   TMP REFERENCE POINT RESOLVER V1
   -----------------------------------------------------------
   Une:
   - procedure_builder.js
   - pattern_matcher.js
   - reference_value_resolver.js

   Objetivo:
   Para cada punto de la pauta:
   - saber qué patrón tipo necesita
   - buscar patrón real compatible
   - resolver valor real de referencia
   - devolver al operario el nominal/valor esperado

   V1 soporta:
   - JUEGO_CALAS / BLOQUES_PATRON / CALAS
   - BANCO_HORIZONTAL básico por valores de patron_valores
   - ANILLO_PATRON básico por nominal cercano
   - TAMPON_ROSCADO con rodillo recomendado ya generado en pauta

   No calcula decisión.
   No calcula incertidumbre final del equipo.
   =========================================================== */

import {
  resolveReferenceValue,
  loadPatternValuesFromSupabase,
  parseNum,
  roundTo
} from "./reference_value_resolver.js";

import {
  buildPatternRequirement,
  matchPatterns,
  loadPatternCandidatesFromSupabase
} from "./pattern_matcher.js";

export function normalizePatternType(value) {
  const t = String(value || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (t.includes("CALA") || t.includes("BLOQUE")) return "JUEGO_CALAS";
  if (t.includes("BANCO")) return "BANCO_HORIZONTAL";
  if (t.includes("ANILLO")) return "ANILLO_PATRON";
  if (t.includes("TRIDIMENSIONAL") || t.includes("CMM")) return "TRIDIMENSIONAL";
  if (t.includes("RODILLO")) return "RODILLOS_ROSCA";
  return t;
}

export function makePointContext({ procedure, funcion, punto }) {
  return {
    family: procedure.family,
    familia: procedure.family,
    strategy: funcion?.id || punto?.funcion,
    estrategia: funcion?.id || punto?.funcion,
    nominal: punto.nominal,
    unidad: punto.unidad || "mm",
    punto,
    funcion,
    procedure
  };
}

/* ===========================================================
   Busqueda de patron real
   =========================================================== */

export async function selectPatternForPoint(supabase, ctx = {}, options = {}) {
  if (!supabase && options.candidates) {
    const requirement = buildPatternRequirement(ctx);
    const matched = matchPatterns(requirement, options.candidates, options);
    return {
      requirement,
      match: matched,
      selected: matched.selected?.pattern || null
    };
  }

  if (!supabase) {
    return {
      requirement: buildPatternRequirement(ctx),
      match: null,
      selected: null,
      warning: "SIN_SUPABASE_Y_SIN_CANDIDATOS"
    };
  }

  const requirement = buildPatternRequirement(ctx);
  const candidates = await loadPatternCandidatesFromSupabase(supabase, requirement);
  const matched = matchPatterns(requirement, candidates, options);

  return {
    requirement,
    match: matched,
    selected: matched.selected?.pattern || null
  };
}

/* ===========================================================
   Resolver según tipo patrón
   =========================================================== */

export async function resolveGaugeBlocksPoint(supabase, pattern, punto, options = {}) {
  const patronId = pattern?.patron_id || pattern?.id || options.patron_id;

  let values = options.values || [];
  if (!values.length && supabase && patronId) {
    values = await loadPatternValuesFromSupabase(supabase, patronId);
  }

  const ref = await resolveReferenceValue({
    tipo_patron: "JUEGO_CALAS",
    nominal: punto.nominal,
    patron_id: patronId,
    values,
    options: options.compositionOptions || {}
  });

  return {
    ...ref,
    metodo_referencia: "COMPOSICION_CALAS",
    instrucciones_operario: ref.ok
      ? [`Componer ${punto.nominal} mm con: ${ref.componentes.map((c) => c.nominal).join(" + ")} mm.`]
      : [`No se pudo componer exactamente ${punto.nominal} mm con las calas cargadas.`]
  };
}

export async function resolveSinglePatternValuePoint(supabase, pattern, punto, options = {}) {
  const patronId = pattern?.patron_id || pattern?.id || options.patron_id;
  const nominal = parseNum(punto.nominal);

  let values = options.values || [];

  if (!values.length && supabase && patronId) {
    const { data, error } = await supabase
      .from("patron_valores")
      .select("*")
      .eq("patron_id", patronId)
      .eq("activo", true)
      .order("nominal", { ascending: true });

    if (error) throw error;
    values = data || [];
  }

  if (!values.length) {
    return {
      ok: false,
      tipo_referencia: "VALOR_PATRON_DIRECTO",
      error: "SIN_VALORES_PATRON",
      nominal_objetivo: nominal,
      message: "El patrón no tiene valores individuales cargados."
    };
  }

  const candidates = values
    .map((v) => ({
      ...v,
      nominal_num: parseNum(v.nominal),
      distancia: Math.abs(parseNum(v.nominal) - nominal)
    }))
    .sort((a, b) => a.distancia - b.distancia);

  const best = candidates[0];
  const tolerance = parseNum(options.matchToleranceMm, 0.001);
  const exactEnough = best && best.distancia <= tolerance;

  const correctionUm = parseNum(best?.correccion);
  const uncertaintyUm = parseNum(best?.incertidumbre);
  const valueReal = nominal + correctionUm / 1000;

  return {
    ok: Boolean(best),
    exacto: exactEnough,
    tipo_referencia: "VALOR_PATRON_DIRECTO",
    nominal_objetivo: nominal,
    nominal_patron: best?.nominal_num ?? null,
    diferencia_nominal: best ? roundTo(best.distancia, 9) : null,
    valor_real: roundTo(valueReal, 9),
    correccion_total_um: roundTo(correctionUm, 6),
    correccion_total_mm: roundTo(correctionUm / 1000, 9),
    incertidumbre_total_um: roundTo(uncertaintyUm, 6),
    incertidumbre_total_mm: roundTo(uncertaintyUm / 1000, 9),
    k: parseNum(best?.k, 2),
    componentes: best ? [{
      id: best.id,
      identificacion_elemento: best.identificacion_elemento,
      nominal: best.nominal_num,
      correccion_um: correctionUm,
      incertidumbre_um: uncertaintyUm,
      k: parseNum(best.k, 2)
    }] : [],
    warnings: exactEnough ? [] : [`No hay valor exacto para ${nominal} mm. Se ha encontrado ${best?.nominal_num} mm.`],
    instrucciones_operario: [`Usar punto de referencia ${nominal} mm con ${pattern?.codigo || "patrón seleccionado"}.`]
  };
}

/* ===========================================================
   Resolver punto individual
   =========================================================== */

export async function resolveProcedurePoint(supabase, { procedure, funcion, punto } = {}, options = {}) {
  const ctx = makePointContext({ procedure, funcion, punto });

  const selectedPatternInfo = await selectPatternForPoint(supabase, ctx, options);
  const pattern = selectedPatternInfo.selected;

  const patronTipo = normalizePatternType(punto.patron_tipo || funcion?.patron_tipo || pattern?.tipo_patron);

  let reference;

  if (patronTipo === "JUEGO_CALAS") {
    reference = await resolveGaugeBlocksPoint(supabase, pattern, punto, options);
  } else if (patronTipo === "BANCO_HORIZONTAL" || patronTipo === "ANILLO_PATRON") {
    reference = await resolveSinglePatternValuePoint(supabase, pattern, punto, options);
  } else {
    reference = {
      ok: false,
      tipo_referencia: patronTipo,
      error: "TIPO_REFERENCIA_NO_IMPLEMENTADO",
      nominal_objetivo: punto.nominal,
      message: `Tipo de referencia ${patronTipo} no implementado en V1.`
    };
  }

  const resolvedPoint = {
    ...punto,
    patron_real: pattern ? {
      patron_id: pattern.patron_id || pattern.id,
      codigo: pattern.codigo,
      descripcion: pattern.descripcion,
      tipo_patron: pattern.tipo_patron,
      laboratorio: pattern.laboratorio,
      certificado: pattern.numero_certificado,
      fecha_vencimiento: pattern.fecha_vencimiento
    } : null,
    requirement: selectedPatternInfo.requirement,
    match_score: selectedPatternInfo.match?.selected?.score ?? null,
    referencia: reference,
    valor_referencia_esperado: reference?.valor_real ?? null,
    incertidumbre_referencia: reference?.incertidumbre_total_mm ?? null,
    instrucciones_operario: [
      ...(reference?.instrucciones_operario || []),
      `Tomar ${punto.repeticiones || 5} lecturas.`
    ]
  };

  return resolvedPoint;
}

/* ===========================================================
   Resolver procedimiento completo
   =========================================================== */

export async function resolveProcedureReferences(supabase, procedure = {}, options = {}) {
  const funciones = procedure.funciones || [];

  const resolvedFunctions = [];

  for (const funcion of funciones) {
    const puntos = funcion.puntos || [];
    const resolvedPoints = [];

    for (const punto of puntos) {
      const resolved = await resolveProcedurePoint(supabase, {
        procedure,
        funcion,
        punto
      }, options);

      resolvedPoints.push(resolved);
    }

    resolvedFunctions.push({
      ...funcion,
      puntos: resolvedPoints
    });
  }

  return {
    ...procedure,
    referencias_resueltas: true,
    funciones: resolvedFunctions,
    warnings: [
      ...(procedure.warnings || []),
      ...collectReferenceWarnings(resolvedFunctions)
    ]
  };
}

export function collectReferenceWarnings(funciones = []) {
  const warnings = [];

  for (const f of funciones) {
    for (const p of f.puntos || []) {
      if (!p.referencia?.ok) {
        warnings.push(`Referencia no resuelta: ${f.id || f.nombre} / ${p.id || p.etiqueta}`);
      }

      if (p.referencia?.warnings?.length) {
        warnings.push(...p.referencia.warnings.map((w) => `${p.id || p.etiqueta}: ${w}`));
      }
    }
  }

  return warnings;
}

/* ===========================================================
   Ejemplo de uso:
   const pauta = buildProcedure(...)
   const pautaConReferencias = await resolveProcedureReferences(supabase, pauta)
   =========================================================== */
