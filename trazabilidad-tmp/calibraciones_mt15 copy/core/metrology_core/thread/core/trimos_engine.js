/* TMP THREAD CORE V30 - trimos_engine.js */
import { parseNum } from "./thread_parser.js";
export const TMP_TRIMOS_THREAD_ENGINE_VERSION = "TMP_TRIMOS_THREAD_ENGINE_V30_20260630";
export const COMMERCIAL_WIRES_MM = [0.170,0.195,0.220,0.250,0.290,0.335,0.390,0.455,0.530,0.620,0.725,0.895,1.100,1.350,1.650,2.050,2.550,3.200];

export function round(value, decimals = 9) {
  const n = parseNum(value, null);
  if (!Number.isFinite(n)) return null;
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}
export function calculateBestWire(parsedThread, commercialSeries = COMMERCIAL_WIRES_MM) {
  if (!parsedThread?.ok) return { ok:false, source:TMP_TRIMOS_THREAD_ENGINE_VERSION, error:"THREAD_NOT_PARSED" };
  const P = parseNum(parsedThread.pitch_mm);
  const angle = parseNum(parsedThread.angle_deg, 60);
  if (!Number.isFinite(P) || !Number.isFinite(angle)) return { ok:false, source:TMP_TRIMOS_THREAD_ENGINE_VERSION, error:"THREAD_NUMERIC_DATA_INCOMPLETE" };
  const ideal = P / (2 * Math.cos((angle / 2) * Math.PI / 180));
  let selected = commercialSeries[0], minDiff = Math.abs(selected - ideal);
  for (const wire of commercialSeries) { const diff = Math.abs(wire - ideal); if (diff < minDiff) { selected = wire; minDiff = diff; } }
  return { ok:true, source:TMP_TRIMOS_THREAD_ENGINE_VERSION, method:"BEST_WIRE_DIAMETER_60_DEG_NEAREST_COMMERCIAL", pitch_mm:P, angle_deg:angle, ideal_wire_mm:round(ideal,9), selected_wire_mm:round(selected,9), difference_mm:round(selected - ideal,9), commercial_series_mm:commercialSeries, warning:"Verificar fisicamente que el juego de hilos/rodillos seleccionado esta disponible." };
}
export function calculateTrimosCorrection(parsedThread, wireResult) {
  if (!parsedThread?.ok || !wireResult?.ok) return { ok:false, source:TMP_TRIMOS_THREAD_ENGINE_VERSION, error:"THREAD_OR_WIRE_NOT_READY" };
  const P = parseNum(parsedThread.pitch_mm), w = parseNum(wireResult.selected_wire_mm);
  const correction = 3 * w - 0.8660254037844386 * P;
  return { ok:true, source:TMP_TRIMOS_THREAD_ENGINE_VERSION, method:"TRIMOS_THREAD_CORRECTION_CURRENT_ENGINE", wire_mm:w, pitch_mm:P, correction_mm:round(correction,9), formula:"C = 3*w - 0.8660254038*P" };
}
export function buildTrimosPlan(parsedThread, iso1502Result, wireResult, correctionResult) {
  if (!parsedThread?.ok) return { ok:false, source:TMP_TRIMOS_THREAD_ENGINE_VERSION, error:"THREAD_NOT_PARSED" };
  if (!iso1502Result?.ok) return { ok:false, source:TMP_TRIMOS_THREAD_ENGINE_VERSION, error:"ISO1502_NOT_READY" };
  if (!wireResult?.ok) return { ok:false, source:TMP_TRIMOS_THREAD_ENGINE_VERSION, error:"WIRE_NOT_READY" };
  if (!correctionResult?.ok) return { ok:false, source:TMP_TRIMOS_THREAD_ENGINE_VERSION, error:"CORRECTION_NOT_READY" };
  const C = correctionResult.correction_mm;
  const point = (src, lado) => ({ id:src.id, lado, d2_nominal_mm:round(src.d2_nominal_mm,9), target_trimos_mm:round(src.d2_nominal_mm + C,9), limits_d2_mm:{ min:round(src.min_mm,9), max:round(src.max_mm,9), wear_max:round(src.wear_max_mm,9) }, repetitions:5 });
  return { ok:true, source:TMP_TRIMOS_THREAD_ENGINE_VERSION, method:"TRIMOS_PLAN_FROM_ISO1502_AND_NORMATIVE_WIRE", setup:{ bank:"TRIMOS", wire_mm:wireResult.selected_wire_mm, ideal_wire_mm:wireResult.ideal_wire_mm, correction_mm:C, angle_deg:parsedThread.angle_deg, instruction:`Montar rodillos Ø${wireResult.selected_wire_mm} mm, colocar adaptadores Trimos, poner a cero y tomar lecturas.` }, points:[point(iso1502Result.data.pass, "PASA"), point(iso1502Result.data.no_pass, "NO_PASA")] };
}
export function buildTrimosThreadSetup(parsedThread, iso1502Result) {
  const wire = calculateBestWire(parsedThread);
  const correction = calculateTrimosCorrection(parsedThread, wire);
  const plan = buildTrimosPlan(parsedThread, iso1502Result, wire, correction);
  return { ok:Boolean(wire.ok && correction.ok && plan.ok), source:TMP_TRIMOS_THREAD_ENGINE_VERSION, wire, correction, plan, setup:plan.setup, points:plan.points };
}
export default { TMP_TRIMOS_THREAD_ENGINE_VERSION, calculateBestWire, calculateTrimosCorrection, buildTrimosPlan, buildTrimosThreadSetup };
