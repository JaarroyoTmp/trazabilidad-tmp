/* TMP THREAD CORE V30 - thread_uncertainty_engine_core.js */
import { parseNum } from "./thread_parser.js";
export const TMP_THREAD_UNCERTAINTY_CORE_VERSION = "TMP_THREAD_UNCERTAINTY_CORE_V31_20260925_TRIMOS_MODEL";
export function round(v, d = 9) { const n = parseNum(v, null); if (!Number.isFinite(n)) return null; const f = Math.pow(10, d); return Math.round(n * f) / f; }
export function mean(values = []) { const nums = values.map(v => parseNum(v, null)).filter(Number.isFinite); if (!nums.length) return null; return nums.reduce((a,b) => a+b, 0) / nums.length; }
export function sampleStd(values = []) { const nums = values.map(v => parseNum(v, null)).filter(Number.isFinite); if (nums.length < 2) return 0; const m = mean(nums); return Math.sqrt(nums.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / (nums.length - 1)); }
export function calculatePointUncertainty({ readings = [], patterns = null, model = {} } = {}) {
  const n = readings.length;
  const s = sampleStd(readings);
  const uRepeat = n > 1 ? s / Math.sqrt(n) : 0;
  const uBank = parseNum(patterns?.selected_bank?.u_standard_mm, null) ?? parseNum(model.u_bank_mm, 0);
  // TMP MT16: rodillos/hilos son utiles de medicion y no se incorporan como patron
  // certificado independiente. Tampoco se exige un patron de rosca adicional.
  const uRollers = 0;
  const uMaster = 0;
  const resolution = parseNum(model.resolution_mm, 0.001);
  const uResolution = resolution / Math.sqrt(12);
  const uTemperature = parseNum(model.u_temperature_mm, 0);
  const uc = Math.sqrt(uRepeat**2 + uBank**2 + uRollers**2 + uMaster**2 + uResolution**2 + uTemperature**2);
  const k = parseNum(model.k, 2);
  return { ok:true, source:TMP_THREAD_UNCERTAINTY_CORE_VERSION, n, s_repeatability_mm:round(s,9), u_repeatability_mm:round(uRepeat,9), u_bank_mm:round(uBank,9), u_rollers_mm:round(uRollers,9), u_master_mm:round(uMaster,9), resolution_mm:round(resolution,9), u_resolution_mm:round(uResolution,9), u_temperature_mm:round(uTemperature,9), uc_mm:round(uc,9), k, U_mm:round(uc*k,9) };
}
export function calculateThreadUncertainty({ readingResults = [], patterns = null, model = {} } = {}) {
  const points = readingResults.map(r => ({ point_id:r.point_id || r.id || r.lado, lado:r.lado, ...calculatePointUncertainty({ readings:r.readings_trimos_mm || r.readings || [], patterns, model }) }));
  return { ok:true, source:TMP_THREAD_UNCERTAINTY_CORE_VERSION, points, global_U_max_mm:round(Math.max(...points.map(p => p.U_mm || 0)), 9) };
}
export default { TMP_THREAD_UNCERTAINTY_CORE_VERSION, calculatePointUncertainty, calculateThreadUncertainty };
