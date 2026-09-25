/* TMP THREAD CORE V30 - thread_decision_engine_core.js */
import { parseNum } from "./thread_parser.js";
export const TMP_THREAD_DECISION_CORE_VERSION = "TMP_THREAD_DECISION_CORE_V30_20260630";
export function round(v, d = 9) { const n = parseNum(v, null); if (!Number.isFinite(n)) return null; const f = Math.pow(10, d); return Math.round(n * f) / f; }
export function decidePointWithGuardBand({ meanD2, limits, U } = {}) {
  const x = parseNum(meanD2, null), min = parseNum(limits?.min, null), max = parseNum(limits?.max, null), u = parseNum(U, 0);
  if (!Number.isFinite(x) || !Number.isFinite(min) || !Number.isFinite(max)) return { ok:false, decision:"NO_EVALUABLE", message:"Faltan datos para decision." };
  const low = x - u, high = x + u;
  if (low >= min && high <= max) return { ok:true, decision:"OK", rule:"ILAC_G8_GUARD_BAND_CONSERVATIVE", interval_mm:{ low:round(low,9), high:round(high,9) }, message:"OK: el intervalo medido +/- U queda dentro de los limites." };
  if (high < min || low > max) return { ok:true, decision:"NOK", rule:"ILAC_G8_GUARD_BAND_CONSERVATIVE", interval_mm:{ low:round(low,9), high:round(high,9) }, message:"NOK: el intervalo medido +/- U queda fuera de los limites." };
  return { ok:true, decision:"INDETERMINADO", rule:"ILAC_G8_GUARD_BAND_CONSERVATIVE", interval_mm:{ low:round(low,9), high:round(high,9) }, message:"INDETERMINADO: el intervalo medido +/- U cruza el limite." };
}
export function decideThreadCalibration({ readingResults = [], uncertainty = null } = {}) {
  const decisions = readingResults.map(r => {
    const u = uncertainty?.points?.find(p => p.point_id === (r.point_id || r.id || r.lado) || p.lado === r.lado);
    return { point_id:r.point_id || r.id || r.lado, lado:r.lado, meanD2_mm:r.media_d2_mm, limits:r.limits_d2_mm, U_mm:u?.U_mm, ...decidePointWithGuardBand({ meanD2:r.media_d2_mm, limits:r.limits_d2_mm, U:u?.U_mm }) };
  });
  const anyNok = decisions.some(d => d.decision === "NOK");
  const anyInd = decisions.some(d => d.decision === "INDETERMINADO" || d.decision === "NO_EVALUABLE");
  const global = anyNok ? "NOK" : anyInd ? "INDETERMINADO" : "OK";
  return { ok:true, source:TMP_THREAD_DECISION_CORE_VERSION, global_decision:global, decisions, message: global === "OK" ? "Calibracion OK segun ILAC-G8 conservadora." : global === "NOK" ? "Calibracion NOK segun ILAC-G8 conservadora." : "Calibracion indeterminada segun ILAC-G8 conservadora." };
}
export default { TMP_THREAD_DECISION_CORE_VERSION, decidePointWithGuardBand, decideThreadCalibration };
