/* ===========================================================
   TMP METROLOGY CORE - PATTERN SELECTOR DYNAMIC V1
   -----------------------------------------------------------
   Este módulo NO contiene una lista fija de patrones.
   Genera requisitos de búsqueda para consultar Supabase.

   Regla base:
   - El motor conoce tipos y reglas.
   - Supabase conoce los patrones reales disponibles.
   =========================================================== */

export const PATTERN_TYPES = Object.freeze({
  BANCO_HORIZONTAL: "BANCO_HORIZONTAL",
  TRIDIMENSIONAL: "TRIDIMENSIONAL",
  JUEGO_CALAS: "JUEGO_CALAS",
  CALA_INDIVIDUAL: "CALA_INDIVIDUAL",
  ANILLO_PATRON: "ANILLO_PATRON",
  ANILLO_ROSCA: "ANILLO_ROSCA",
  PATRON_ROSCA: "PATRON_ROSCA",
  PATRON_DUREZA: "PATRON_DUREZA",
  TERMOMETRO: "TERMOMETRO",
  PESA_PATRON: "PESA_PATRON",
  PATRON_RUGOSIDAD: "PATRON_RUGOSIDAD",
  BANCO_TORQUE: "BANCO_TORQUE",
  PATRON_ESPESOR: "PATRON_ESPESOR"
});

export const PATTERN_LEVELS = Object.freeze({
  PATRON_MAESTRO: "PATRON_MAESTRO",
  PATRON_SECUNDARIO: "PATRON_SECUNDARIO",
  EQUIPO_PATRON: "EQUIPO_PATRON",
  EQUIPO_AUXILIAR: "EQUIPO_AUXILIAR"
});

export function parseNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}

export function normalizarTexto(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function estaVigente(patron, fechaReferencia = new Date()) {
  const estado = normalizarTexto(patron.estado || patron.estado_actual || patron.situacion || "");
  if (estado.includes("baja") || estado.includes("fuera") || estado.includes("no uso")) return false;

  const proxima = patron.fecha_proxima_calibracion || patron.fecha_proxima || patron.proxima_calibracion;
  if (!proxima) return false;

  const fecha = new Date(proxima);
  if (Number.isNaN(+fecha)) return false;

  return fecha >= fechaReferencia;
}

export function tieneTrazabilidadValida(patron) {
  const certificado = patron.certificado_url || patron.certificado || patron.certificado_pdf_url || patron.numero_certificado;
  const trazabilidad = normalizarTexto(patron.trazabilidad || patron.tipo_trazabilidad || patron.calibrado_por || "");
  const uso = normalizarTexto(patron.uso_permitido || patron.uso || "");

  if (uso.includes("no calibracion") || uso.includes("solo referencia")) return false;
  if (certificado) return true;
  if (trazabilidad.includes("enac") || trazabilidad.includes("extern")) return true;

  return false;
}

export function cumpleRango(patron, requisito) {
  const nominalReq = parseNumber(requisito.nominal);
  const minimoReq = parseNumber(requisito.rango_min);
  const maximoReq = parseNumber(requisito.rango_max);

  const nominalPatron = parseNumber(patron.nominal ?? patron.valor_nominal ?? patron.medida);
  const rangoMinPatron = parseNumber(patron.rango_min ?? patron.rango_desde ?? patron.minimo);
  const rangoMaxPatron = parseNumber(patron.rango_max ?? patron.rango_hasta ?? patron.maximo);

  if (nominalReq !== null && nominalPatron !== null) {
    const toleranciaBusqueda = parseNumber(requisito.tolerancia_busqueda) ?? 0;
    return Math.abs(nominalPatron - nominalReq) <= toleranciaBusqueda;
  }

  if (nominalReq !== null && rangoMinPatron !== null && rangoMaxPatron !== null) {
    return nominalReq >= rangoMinPatron && nominalReq <= rangoMaxPatron;
  }

  if (minimoReq !== null && maximoReq !== null && rangoMinPatron !== null && rangoMaxPatron !== null) {
    return minimoReq >= rangoMinPatron && maximoReq <= rangoMaxPatron;
  }

  return true;
}

export function calcularScorePatron(patron, requisito) {
  let score = 0;

  const nominalReq = parseNumber(requisito.nominal);
  const nominalPatron = parseNumber(patron.nominal ?? patron.valor_nominal ?? patron.medida);
  const incertidumbre = parseNumber(patron.incertidumbre ?? patron.u_k2 ?? patron.U ?? patron.inc);

  const nivel = patron.nivel_metrologico || patron.nivel || patron.clase_metrologica;
  if (nivel === PATTERN_LEVELS.PATRON_MAESTRO) score += 500;
  if (nivel === PATTERN_LEVELS.EQUIPO_PATRON) score += 400;
  if (nivel === PATTERN_LEVELS.PATRON_SECUNDARIO) score += 250;

  if (estaVigente(patron)) score += 300;
  if (tieneTrazabilidadValida(patron)) score += 300;

  if (nominalReq !== null && nominalPatron !== null) {
    const diferencia = Math.abs(nominalPatron - nominalReq);
    score += Math.max(0, 200 - diferencia * 20);
    if (diferencia === 0) score += 200;
  }

  if (incertidumbre !== null) {
    score += Math.max(0, 100 - incertidumbre * 1000);
  }

  const fechaCal = new Date(patron.fecha_calibracion || patron.fecha_ultima || 0);
  if (!Number.isNaN(+fechaCal)) {
    score += Math.min(100, fechaCal.getFullYear() - 2000);
  }

  return score;
}

export function filtrarPatronesCandidatos(patrones = [], requisito = {}) {
  const tiposAceptados = Array.isArray(requisito.tipos)
    ? requisito.tipos
    : requisito.tipo
      ? [requisito.tipo]
      : [];

  return patrones
    .filter((patron) => {
      const tipoPatron = patron.tipo_patron || patron.tipo || patron.familia_patron || patron.clase;
      if (tiposAceptados.length && !tiposAceptados.includes(tipoPatron)) return false;

      if (requisito.requiere_vigente !== false && !estaVigente(patron)) return false;
      if (requisito.requiere_trazabilidad !== false && !tieneTrazabilidadValida(patron)) return false;
      if (!cumpleRango(patron, requisito)) return false;

      return true;
    })
    .map((patron) => ({
      ...patron,
      _score_selector_tmp: calcularScorePatron(patron, requisito)
    }))
    .sort((a, b) => b._score_selector_tmp - a._score_selector_tmp);
}

export function construirRequisitosPatron({ instrumento = {}, procedimiento = {}, punto = {} } = {}) {
  const familia = instrumento.familia_normalizada || instrumento.familia_mt15 || instrumento.familia || "";
  const descripcion = normalizarTexto([
    instrumento.codigo,
    instrumento.descripcion,
    instrumento.familia,
    instrumento.tipo_calibracion,
    instrumento.rango,
    procedimiento.codigo,
    procedimiento.titulo
  ].filter(Boolean).join(" "));

  const nominal = parseNumber(punto.nominal ?? punto.valor_nominal ?? instrumento.nominal);
  const rangoMin = parseNumber(instrumento.rango_min ?? instrumento.rango_desde);
  const rangoMax = parseNumber(instrumento.rango_max ?? instrumento.rango_hasta);

  const base = {
    nominal,
    rango_min: rangoMin,
    rango_max: rangoMax,
    unidad: instrumento.unidad_base || instrumento.unidad || "mm",
    requiere_vigente: true,
    requiere_trazabilidad: true,
    trazabilidad_minima: "EXTERNA_ENAC_O_EQUIVALENTE",
    motivo: ""
  };

  if (descripcion.includes("tampon") && descripcion.includes("rosca")) {
    return {
      ...base,
      tipos: [PATTERN_TYPES.PATRON_ROSCA, PATTERN_TYPES.ANILLO_ROSCA, PATTERN_TYPES.TRIDIMENSIONAL],
      motivo: "Calibración de tampón de rosca P/NP: requiere patrón rosca/anillo rosca o equipo patrón validado."
    };
  }

  if (descripcion.includes("tampon") || descripcion.includes("p/np") || descripcion.includes("pasa") || descripcion.includes("no pasa")) {
    return {
      ...base,
      tipos: [PATTERN_TYPES.BANCO_HORIZONTAL, PATTERN_TYPES.JUEGO_CALAS, PATTERN_TYPES.CALA_INDIVIDUAL],
      motivo: "Calibración de calibre pasa/no pasa: priorizar banco horizontal y calas patrón trazables."
    };
  }

  if (descripcion.includes("anillo") && descripcion.includes("rosca")) {
    return {
      ...base,
      tipos: [PATTERN_TYPES.PATRON_ROSCA, PATTERN_TYPES.TRIDIMENSIONAL],
      motivo: "Anillo de rosca: requiere patrón de rosca o tridimensional según método definido."
    };
  }

  if (descripcion.includes("anillo")) {
    return {
      ...base,
      tipos: [PATTERN_TYPES.BANCO_HORIZONTAL, PATTERN_TYPES.JUEGO_CALAS, PATTERN_TYPES.TRIDIMENSIONAL],
      motivo: "Anillo patrón: priorizar banco horizontal; alternativa tridimensional validada."
    };
  }

  if (descripcion.includes("micrometro") && descripcion.includes("interior")) {
    return {
      ...base,
      tipos: [PATTERN_TYPES.ANILLO_PATRON],
      motivo: "Micrómetro interior de 3 contactos: requiere anillo patrón adecuado al rango."
    };
  }

  if (descripcion.includes("micrometro")) {
    return {
      ...base,
      tipos: [PATTERN_TYPES.JUEGO_CALAS, PATTERN_TYPES.CALA_INDIVIDUAL],
      motivo: "Micrómetro exterior: requiere calas patrón trazables."
    };
  }

  if (descripcion.includes("pie de rey") || descripcion.includes("calibre")) {
    return {
      ...base,
      tipos: [PATTERN_TYPES.JUEGO_CALAS, PATTERN_TYPES.CALA_INDIVIDUAL, PATTERN_TYPES.ANILLO_PATRON],
      motivo: "Pie de rey/calibre: calas para exteriores y sonda; anillo para interiores si aplica."
    };
  }

  if (descripcion.includes("comparador") || descripcion.includes("reloj")) {
    return {
      ...base,
      tipos: [PATTERN_TYPES.BANCO_HORIZONTAL, PATTERN_TYPES.JUEGO_CALAS, PATTERN_TYPES.CALA_INDIVIDUAL],
      motivo: "Reloj comparador: banco horizontal o composición de calas según campo."
    };
  }

  if (descripcion.includes("gramil") || descripcion.includes("sonda de altura")) {
    return {
      ...base,
      tipos: [PATTERN_TYPES.BANCO_HORIZONTAL, PATTERN_TYPES.JUEGO_CALAS, PATTERN_TYPES.TRIDIMENSIONAL],
      motivo: "Gramil/sonda altura: banco horizontal, calas o tridimensional según método."
    };
  }

  if (descripcion.includes("rugos")) {
    return {
      ...base,
      tipos: [PATTERN_TYPES.PATRON_RUGOSIDAD],
      motivo: "Rugosímetro: requiere patrón de rugosidad certificado."
    };
  }

  if (descripcion.includes("durom")) {
    return {
      ...base,
      tipos: [PATTERN_TYPES.PATRON_DUREZA],
      motivo: "Durómetro: requiere bloques patrón de dureza del método aplicable."
    };
  }

  if (descripcion.includes("dinamometr")) {
    return {
      ...base,
      tipos: [PATTERN_TYPES.BANCO_TORQUE],
      motivo: "Llave dinamométrica: requiere banco/transductor de par certificado."
    };
  }

  if (descripcion.includes("balanza")) {
    return {
      ...base,
      tipos: [PATTERN_TYPES.PESA_PATRON],
      motivo: "Balanza: requiere pesas patrón certificadas adecuadas al rango."
    };
  }

  if (descripcion.includes("utillaje") || descripcion.includes("fabricacion propia")) {
    return {
      ...base,
      tipos: [PATTERN_TYPES.TRIDIMENSIONAL],
      motivo: "Utillaje propio: priorizar medición tridimensional según plano/pauta interna."
    };
  }

  return {
    ...base,
    tipos: [PATTERN_TYPES.TRIDIMENSIONAL, PATTERN_TYPES.BANCO_HORIZONTAL, PATTERN_TYPES.JUEGO_CALAS],
    motivo: "Sin regla específica: requiere validación metrológica antes de seleccionar patrón definitivo."
  };
}

export function seleccionarPatronesParaCalibracion({ instrumento = {}, procedimiento = {}, puntos = [], patronesDisponibles = [] } = {}) {
  const puntosTrabajo = puntos.length ? puntos : [{ nominal: instrumento.nominal ?? null }];

  return puntosTrabajo.map((punto, index) => {
    const requisito = construirRequisitosPatron({ instrumento, procedimiento, punto });
    const candidatos = filtrarPatronesCandidatos(patronesDisponibles, requisito);

    return {
      punto_ordinal: index + 1,
      punto,
      requisito,
      candidatos,
      recomendado: candidatos[0] || null,
      estado: candidatos.length ? "PATRON_RECOMENDADO" : "SIN_PATRON_VALIDO"
    };
  });
}

export function construirConsultaSupabasePatrones(requisito = {}) {
  return {
    tabla: "patrones",
    filtros_logicos: {
      tipo_patron_in: requisito.tipos || (requisito.tipo ? [requisito.tipo] : []),
      estado: "EN_USO",
      certificado_vigente: requisito.requiere_vigente !== false,
      trazabilidad_requerida: requisito.requiere_trazabilidad !== false,
      nominal: requisito.nominal ?? null,
      rango_min: requisito.rango_min ?? null,
      rango_max: requisito.rango_max ?? null,
      unidad: requisito.unidad || "mm"
    },
    orden_recomendado: [
      "coincidencia_nominal_exacta",
      "certificado_vigente",
      "trazabilidad_externa",
      "menor_incertidumbre",
      "fecha_calibracion_mas_reciente"
    ]
  };
}