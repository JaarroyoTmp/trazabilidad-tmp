/* TMP THREAD CORE V41 - iso965_engine.js */
import { ISO965_DATABASE } from "../data/thread_iso965_database.js";

export const TMP_ISO965_ENGINE_VERSION = "TMP_ISO965_ENGINE_V41_20260702_DB_BRIDGE";

export const TMP_ISO965_INTERNAL_LIMITS = {
  "M12x1.25|6H": { source:"ISO965-2:1998_TABLE_3_INTERNAL_THREAD", type:"internal", major_diameter_mm:12, pitch_mm:1.25, tolerance_class:"6H", pitch_diameter_D2_max_mm:11.368, pitch_diameter_D2_min_mm:11.188, minor_diameter_D1_max_mm:10.912, minor_diameter_D1_min_mm:10.647 }
};

export function normalizeKey(parsedThread = {}) {
  const nominal = Number(parsedThread.nominal_mm);
  const pitch = Number(parsedThread.pitch_mm);
  const cls = String(parsedThread.tolerance_class || "6H").toUpperCase().replace("H6", "6H");
  if (!Number.isFinite(nominal) || !Number.isFinite(pitch)) return null;
  const n = Number.isInteger(nominal) ? String(nominal) : String(nominal).replace(/0+$/, "").replace(/\.$/, "");
  const p = Number.isInteger(pitch) ? String(pitch) : String(pitch).replace(/0+$/, "").replace(/\.$/, "");
  return { legacy:`M${n}x${p}|${cls}`, db:`M${n}x${p}-${cls}` };
}

function adaptDatabaseRow(row) {
  if (!row) return null;
  return {
    source: row.source || "ISO965_DATABASE",
    type: row.type || "internal",
    major_diameter_mm: row.major_diameter,
    pitch_mm: row.pitch,
    tolerance_class: row.tolerance_class,
    pitch_diameter_D2_max_mm: row.pitch_diameter_max,
    pitch_diameter_D2_min_mm: row.pitch_diameter_min,
    minor_diameter_D1_max_mm: row.minor_diameter_max,
    minor_diameter_D1_min_mm: row.minor_diameter_min
  };
}

export function resolveIso965Limits(parsedThread) {
  if (!parsedThread?.ok) return { ok:false, source:TMP_ISO965_ENGINE_VERSION, error:"THREAD_NOT_PARSED" };
  const keys = normalizeKey(parsedThread);
  if (!keys) return { ok:false, source:TMP_ISO965_ENGINE_VERSION, error:"THREAD_NUMERIC_DATA_INCOMPLETE" };
  const data = TMP_ISO965_INTERNAL_LIMITS[keys.legacy] || adaptDatabaseRow(ISO965_DATABASE?.[keys.db]);
  if (!data) return { ok:false, source:TMP_ISO965_ENGINE_VERSION, status:"ISO965_LIMITS_NOT_LOADED", key:keys.db, message:"No hay tabla ISO965 cargada para esta combinacion.", required_action:"Anadir fila normativa a ISO965_DATABASE." };
  const td2 = Number(data.pitch_diameter_D2_max_mm) - Number(data.pitch_diameter_D2_min_mm);
  return {
    ok:true,
    source:TMP_ISO965_ENGINE_VERSION,
    status:"ISO965_LIMITS_FOUND",
    key:keys.db,
    data,
    summary:{
      D2_min_mm:data.pitch_diameter_D2_min_mm,
      D2_max_mm:data.pitch_diameter_D2_max_mm,
      TD2_mm:Number.isFinite(td2) ? Math.round(td2 * 1e9) / 1e9 : null,
      D1_min_mm:data.minor_diameter_D1_min_mm,
      D1_max_mm:data.minor_diameter_D1_max_mm
    },
    message:"Limites ISO965 encontrados en base normativa TMP."
  };
}
export default { TMP_ISO965_ENGINE_VERSION, TMP_ISO965_INTERNAL_LIMITS, resolveIso965Limits };
