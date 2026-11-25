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
