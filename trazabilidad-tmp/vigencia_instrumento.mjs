const FAMILIA_TAMPONES_DE_ROSCA = "2fd6085a-0952-4459-ad10-d6f5996aef23";

export function controlaPorMT16(instrumento) {
  return instrumento?.familia_id === FAMILIA_TAMPONES_DE_ROSCA;
}

export function fechaVigenciaInstrumento(instrumento) {
  if (controlaPorMT16(instrumento)) return instrumento.fecha_proxima_verificacion || null;
  return instrumento?.fecha_proxima_calibracion || instrumento?.proxima_calibracion || null;
}

export function esNoAptoMT16(instrumento) {
  return controlaPorMT16(instrumento) && String(instrumento.estado || "").trim().toUpperCase() === "NO APTO";
}

const FORMATO_DIA_MADRID = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit"
});

export const CAMPOS_INVENTARIO = "codigo, descripcion, estado, ubicacion_id, ubicacion_actual, ubicacion, familia_id, fecha_calibracion, fecha_proxima_calibracion, proxima_calibracion, fecha_ultima_verificacion, fecha_proxima_verificacion";

export function esEquipoRetirado(instrumento) {
  const estado = String(instrumento?.estado ?? "").trim().toUpperCase();
  const ubicacion = String(instrumento?.ubicacion_actual ?? "").trim().toUpperCase();
  return ["BAJA DEFINITIVA", "BAJA TÉCNICA", "RETIRADO"].includes(estado) || ubicacion === "RETIRADO";
}

export function tipoUbicacionEquipo(instrumento, ubicacion) {
  const oficial = String(ubicacion?.tipo ?? "").trim().toLowerCase();
  if (oficial === "laboratorio" || oficial === "taller") return oficial;

  const texto = String(instrumento?.ubicacion ?? "").trim().toLowerCase();
  const actual = String(instrumento?.ubicacion_actual ?? "").trim().toLowerCase();
  if (!oficial && (actual === "laboratorio" || texto === "laboratorio")) return "laboratorio";
  if (texto === "taller") return "taller";
  return oficial;
}

function diaCivil(value) {
  const texto = String(value ?? "").trim().replaceAll("_", "-");
  const literal = texto.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  const fecha = literal ? new Date(literal + "T00:00:00Z") : new Date(texto);
  return !Number.isNaN(fecha.getTime()) && (!literal || fecha.toISOString().slice(0, 10) === literal)
    ? fecha.toISOString().slice(0, 10) : null;
}

export function estadoVigencia(instrumento, hoy = new Date()) {
  const fecha = diaCivil(fechaVigenciaInstrumento(instrumento));
  if (String(instrumento?.estado ?? "").trim().toUpperCase() === "NO APTO") {
    return { key: "FUERA", motivo: "NO_APTO", texto: "NO APTO", fecha };
  }
  if (!fecha) return { key: "FUERA", motivo: "SIN_FECHA", texto: "SIN FECHA · FUERA", fecha: null };
  const dias = (Date.parse(fecha) - Date.parse(FORMATO_DIA_MADRID.format(hoy))) / 86400000;
  if (dias < 0) return { key: "FUERA", motivo: "VENCIDO", texto: "FUERA DE PLAZO", fecha };
  if (dias <= 30) return { key: "PROXIMA", motivo: "PROXIMA", texto: "PRÓXIMA", fecha };
  return { key: "OK", motivo: "VIGENTE", texto: "OK", fecha };
}
