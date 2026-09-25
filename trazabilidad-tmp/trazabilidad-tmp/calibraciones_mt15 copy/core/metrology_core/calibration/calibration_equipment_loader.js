/* ===========================================================
   TMP CALIBRATION EQUIPMENT LOADER V1
   -----------------------------------------------------------
   Cargador real de equipos para Calibracion Guiada.
   =========================================================== */

export const TMP_CALIBRATION_EQUIPMENT_LOADER_VERSION =
  "TMP_CALIBRATION_EQUIPMENT_LOADER_V1";

export function normalizeCode(value = "") {
  return String(value || "").trim();
}

export async function loadEquipmentByCode(supabase, code = "") {
  if (!supabase) {
    return {
      ok: false,
      error: "SUPABASE_NO_DISPONIBLE",
      message: "No se ha recibido cliente Supabase."
    };
  }

  const c = normalizeCode(code);

  if (!c) {
    return {
      ok: false,
      error: "CODIGO_VACIO",
      message: "Introduce un codigo de equipo."
    };
  }

  const selectFields = [
    "id",
    "codigo",
    "descripcion",
    "fabricante",
    "rango",
    "precision",
    "observaciones",
    "estado",
    "ubicacion",
    "ubicacion_actual",
    "fecha_calibracion",
    "fecha_proxima_calibracion",
    "proxima_calibracion",
    "tipo_calibracion",
    "tipo_calibracion_id",
    "familia_id",
    "familia_calibracion_id",
    "plan_calibracion_id",
    "informe_calibracion_url"
  ].join(",");

  const exact = await supabase
    .from("instrumentos")
    .select(selectFields)
    .eq("codigo", c)
    .limit(5);

  if (exact.error) {
    return {
      ok: false,
      error: "ERROR_BUSCANDO_EQUIPO",
      message: exact.error.message,
      raw: exact.error
    };
  }

  if (exact.data && exact.data.length === 1) {
    return {
      ok: true,
      source: "instrumentos.codigo exact",
      instrumento: exact.data[0],
      matches: exact.data
    };
  }

  if (exact.data && exact.data.length > 1) {
    return {
      ok: false,
      error: "CODIGO_DUPLICADO",
      message: `Hay ${exact.data.length} instrumentos con el codigo ${c}.`,
      matches: exact.data
    };
  }

  const flexible = await supabase
    .from("instrumentos")
    .select(selectFields)
    .ilike("codigo", `%${c}%`)
    .limit(20);

  if (flexible.error) {
    return {
      ok: false,
      error: "ERROR_BUSQUEDA_FLEXIBLE",
      message: flexible.error.message,
      raw: flexible.error
    };
  }

  if (!flexible.data || !flexible.data.length) {
    return {
      ok: false,
      error: "EQUIPO_NO_ENCONTRADO",
      message: `No se ha encontrado ningun equipo con codigo ${c}.`,
      matches: []
    };
  }

  if (flexible.data.length === 1) {
    return {
      ok: true,
      source: "instrumentos.codigo ilike",
      instrumento: flexible.data[0],
      matches: flexible.data,
      warning: "Encontrado por busqueda flexible, revisar codigo."
    };
  }

  return {
    ok: false,
    error: "VARIOS_EQUIPOS_ENCONTRADOS",
    message: `Se han encontrado ${flexible.data.length} equipos. Selecciona uno.`,
    matches: flexible.data
  };
}

export function isCalibrationCurrent(instrumento = {}, today = new Date()) {
  const raw = instrumento.fecha_proxima_calibracion || instrumento.proxima_calibracion || null;

  if (!raw) {
    return {
      ok: false,
      current: false,
      error: "SIN_FECHA_PROXIMA",
      message: "El equipo no tiene fecha de proxima calibracion registrada."
    };
  }

  const next = new Date(raw);
  const now = today instanceof Date ? today : new Date(today);

  if (Number.isNaN(next.getTime())) {
    return {
      ok: false,
      current: false,
      error: "FECHA_PROXIMA_INVALIDA",
      message: "La fecha de proxima calibracion no es valida.",
      raw
    };
  }

  const nextDay = new Date(next.getFullYear(), next.getMonth(), next.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return {
    ok: true,
    current: nextDay >= nowDay,
    expired: nextDay < nowDay,
    fecha_proxima: nextDay.toISOString().slice(0, 10),
    today: nowDay.toISOString().slice(0, 10),
    message: nextDay >= nowDay
      ? "Calibracion vigente. No deberia recalibrarse salvo autorizacion."
      : "Calibracion caducada. Puede iniciar calibracion."
  };
}

export function buildEquipmentSummary(instrumento = {}) {
  if (!instrumento || !instrumento.id) {
    return { ok: false, error: "SIN_INSTRUMENTO" };
  }

  return {
    ok: true,
    id: instrumento.id,
    codigo: instrumento.codigo,
    descripcion: instrumento.descripcion,
    rango: instrumento.rango,
    precision: instrumento.precision,
    estado: instrumento.estado,
    ubicacion_actual: instrumento.ubicacion_actual || instrumento.ubicacion,
    fecha_calibracion: instrumento.fecha_calibracion,
    fecha_proxima_calibracion: instrumento.fecha_proxima_calibracion || instrumento.proxima_calibracion,
    familia_id: instrumento.familia_id,
    familia_calibracion_id: instrumento.familia_calibracion_id,
    plan_calibracion_id: instrumento.plan_calibracion_id,
    informe_calibracion_url: instrumento.informe_calibracion_url
  };
}
