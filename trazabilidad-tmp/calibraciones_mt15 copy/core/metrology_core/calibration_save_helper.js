/* ===========================================================
   TMP CALIBRATION SAVE HELPER V3.1
   -----------------------------------------------------------
   Guardado real Supabase compatible con tablas actuales.

   V3.1:
   - Evita insertar patrones duplicados en calibracion_patrones.
   - Necesario cuando PASA y NO PASA usan el mismo patrón.
   =========================================================== */

export function parseNum(value, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function toISODate(value = new Date()) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function addMonthsISO(dateValue, months = 12) {
  const d = dateValue instanceof Date ? new Date(dateValue) : new Date(dateValue);
  if (Number.isNaN(d.getTime())) throw new Error("Fecha de calibración inválida");

  const m = parseNum(months, 12);
  if (!Number.isFinite(m) || m <= 0) throw new Error("Frecuencia de calibración inválida");
  if (m > 60) throw new Error("Frecuencia de calibración demasiado alta. Revisar configuración del equipo.");

  const result = new Date(d);
  const originalDay = result.getDate();
  result.setMonth(result.getMonth() + m);
  if (result.getDate() !== originalDay) result.setDate(0);
  return toISODate(result);
}

export async function getInstrumentForCalibration(supabase, payload = {}) {
  const instrumentoId =
    payload.calibracion?.instrumento_id ||
    payload.calibracion?.equipo_id ||
    payload.instrumento_id ||
    payload.equipo_id ||
    payload.instrumento?.id ||
    payload.equipo?.id ||
    null;

  if (!instrumentoId) {
    return { ok: false, error: "SIN_INSTRUMENTO_ID", message: "No se pudo identificar el instrumento para actualizar fechas." };
  }

  const { data, error } = await supabase
    .from("instrumentos")
    .select("*")
    .eq("id", instrumentoId)
    .single();

  if (error) {
    return { ok: false, error: "ERROR_LEYENDO_INSTRUMENTO", message: error.message, raw: error };
  }

  return { ok: true, instrumento: data };
}

export function resolveCalibrationDates(payload = {}, instrumento = {}) {
  const fechaCalibracion =
    payload.calibracion?.fecha_ultima ||
    payload.calibracion?.fecha_calibracion ||
    payload.calibracion?.fecha ||
    payload.fecha_calibracion ||
    toISODate(new Date());

  const frecuencia = parseNum(
    instrumento.frecuencia_calibracion_meses ??
    payload.calibracion?.frecuencia_calibracion_meses ??
    payload.frecuencia_calibracion_meses,
    12
  );

  const fechaProxima = addMonthsISO(fechaCalibracion, frecuencia);

  return {
    fecha_calibracion: toISODate(fechaCalibracion),
    fecha_proxima_calibracion: fechaProxima,
    fecha_ultima: toISODate(fechaCalibracion),
    fecha_proxima: fechaProxima,
    proxima_calibracion: fechaProxima,
    frecuencia_calibracion_meses: frecuencia,
    aviso_frecuencia:
      instrumento.frecuencia_calibracion_meses === null ||
      instrumento.frecuencia_calibracion_meses === undefined
        ? "FRECUENCIA_NO_CONFIGURADA_USANDO_12_MESES"
        : null
  };
}

export function resolveInstrumentStateFromPayload(payload = {}) {
  const resultado =
    payload.calibracion?.resultado_operativo ||
    payload.calibracion?.resultado ||
    payload.resultado_operativo ||
    payload.resultado ||
    "";

  const r = String(resultado).toUpperCase();

  if (r.includes("NO APTO") || r.includes("NOK")) return { estado: "NO APTO", motivo_estado: "Resultado de calibración NO APTO" };
  if (r.includes("NO EVALUABLE")) return { estado: "NO EVALUABLE", motivo_estado: "Calibración no evaluable" };
  if (r.includes("APTO") || r.includes("OK")) return { estado: "En laboratorio", motivo_estado: "Calibración APTO" };

  return { estado: null, motivo_estado: "Estado no modificado" };
}

export async function updateInstrumentCalibrationDates(supabase, payload = {}) {
  const instrumentResult = await getInstrumentForCalibration(supabase, payload);
  if (!instrumentResult.ok) return instrumentResult;

  const instrumento = instrumentResult.instrumento;
  const dates = resolveCalibrationDates(payload, instrumento);
  const state = resolveInstrumentStateFromPayload(payload);

  const updatePayload = {
    fecha_calibracion: dates.fecha_calibracion,
    fecha_proxima_calibracion: dates.fecha_proxima_calibracion,
    proxima_calibracion: dates.proxima_calibracion
  };

  if (state.estado) updatePayload.estado = state.estado;

  const { data, error } = await supabase
    .from("instrumentos")
    .update(updatePayload)
    .eq("id", instrumento.id)
    .select("*")
    .single();

  if (error) {
    return { ok: false, error: "ERROR_ACTUALIZANDO_INSTRUMENTO", message: error.message, raw: error };
  }

  return { ok: true, instrumento_actualizado: data, fechas: dates, estado: state };
}

export async function saveCalibrationExecutionPayload(supabase, payload = {}) {
  if (!supabase) throw new Error("Falta cliente Supabase");
  if (!payload.calibracion) throw new Error("Falta payload.calibracion");

  const instrumentResult = await getInstrumentForCalibration(supabase, payload);

  if (instrumentResult.ok) {
    const dates = resolveCalibrationDates(payload, instrumentResult.instrumento);

    payload.calibracion = {
      ...payload.calibracion,
      fecha_ultima: dates.fecha_ultima,
      fecha_proxima: dates.fecha_proxima,
      fecha_calibracion: new Date(dates.fecha_calibracion).toISOString()
    };

    payload.calibracion.datos_motor = {
      ...(payload.calibracion.datos_motor || {}),
      fecha_proxima_calibracion: dates.fecha_proxima_calibracion,
      proxima_calibracion: dates.proxima_calibracion,
      frecuencia_calibracion_meses: dates.frecuencia_calibracion_meses,
      aviso_frecuencia: dates.aviso_frecuencia
    };
  }

  const { data: cal, error: calError } = await supabase
    .from("calibraciones")
    .insert(payload.calibracion)
    .select("*")
    .single();

  if (calError) throw calError;

  const savedPoints = [];

  for (const p of payload.puntos || []) {
    const pointInsert = { ...p, calibracion_id: cal.id };

    const { data: point, error: pointError } = await supabase
      .from("calibracion_puntos")
      .insert(pointInsert)
      .select("*")
      .single();

    if (pointError) throw pointError;
    savedPoints.push(point);
  }

  const lecturasInsert = [];

  for (const l of payload.lecturas || []) {
    const point = savedPoints[l.punto_index];
    if (!point) continue;

    lecturasInsert.push({
      punto_id: point.id,
      lectura_ordinal: l.lectura_ordinal,
      valor: l.valor,
      funcion: l.funcion || null,
      etiqueta_punto: l.etiqueta_punto || null,
      unidad: l.unidad || "mm",
      registrado_por: l.registrado_por || null,
      datos: l.datos || null
    });
  }

  if (lecturasInsert.length) {
    const { error: lectError } = await supabase
      .from("calibracion_lecturas")
      .insert(lecturasInsert);

    if (lectError) throw lectError;
  }

  const patronesInsert = [];
  const patronesVistos = new Set();

  for (const patron of payload.patrones || []) {
    if (!patron?.patron_id) continue;

    const key = String(patron.patron_id);

    if (patronesVistos.has(key)) continue;

    patronesVistos.add(key);

    patronesInsert.push({
      calibracion_id: cal.id,
      patron_id: patron.patron_id,
      factor_aplicacion: patron.factor_aplicacion || "Seleccionado por operario"
    });
  }

  if (patronesInsert.length) {
    const { error: patError } = await supabase
      .from("calibracion_patrones")
      .insert(patronesInsert);

    if (patError) throw patError;
  }

  const updateResult = await updateInstrumentCalibrationDates(supabase, {
    ...payload,
    calibracion: { ...payload.calibracion, id: cal.id }
  });

  return {
    ok: true,
    calibracion: cal,
    puntos: savedPoints,
    lecturas_insertadas: lecturasInsert.length,
    patrones_insertados: patronesInsert.length,
    instrumento_actualizado: updateResult
  };
}