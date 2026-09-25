/* TMP THREAD CORE V30 - iso724_geometry_engine.js */
import { parseNum } from "./thread_parser.js";
export const TMP_ISO724_GEOMETRY_ENGINE_VERSION = "TMP_ISO724_GEOMETRY_ENGINE_V30_20260630";

export function round(value, decimals = 9) {
  const n = parseNum(value, null);
  if (!Number.isFinite(n)) return null;
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

export function calculateIso724Geometry(parsedThread) {
  if (!parsedThread?.ok) return { ok:false, source:TMP_ISO724_GEOMETRY_ENGINE_VERSION, error:"THREAD_NOT_PARSED" };
  const D = parseNum(parsedThread.nominal_mm);
  const P = parseNum(parsedThread.pitch_mm);
  if (!Number.isFinite(D) || !Number.isFinite(P)) return { ok:false, source:TMP_ISO724_GEOMETRY_ENGINE_VERSION, error:"THREAD_NUMERIC_DATA_INCOMPLETE" };

  const H = 0.8660254037844386 * P;
  const D2 = D - 0.649519052838329 * P;
  const D1 = D - 1.082531754730548 * P;

  return {
    ok:true,
    source:TMP_ISO724_GEOMETRY_ENGINE_VERSION,
    standard:"ISO 724",
    H_mm:round(H, 9),
    internal_thread_basic_mm:{ major_diameter_D:round(D,9), pitch_diameter_D2:round(D2,9), minor_diameter_D1:round(D1,9) },
    external_thread_basic_mm:{ major_diameter_d:round(D,9), pitch_diameter_d2:round(D2,9), minor_diameter_d1:round(D1,9) },
    formulae:{ H:"H = 0.8660254038 * P", D2_or_d2:"D2/d2 = D - 0.6495190528 * P", D1_or_d1:"D1/d1 = D - 1.0825317547 * P" }
  };
}
export default { TMP_ISO724_GEOMETRY_ENGINE_VERSION, calculateIso724Geometry };
