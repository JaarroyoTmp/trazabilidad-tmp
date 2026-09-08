/* TMP THREAD CORE V38 - iso1502_engine.js */
import { resolveIso965Limits } from "./iso965_engine.js";
import { getISO1502InternalPlugRowByTd2, round } from "../data/thread_iso1502_tables.js";

export const TMP_ISO1502_ENGINE_VERSION = "TMP_ISO1502_ENGINE_V38_20260702_DYNAMIC_FROM_ISO965";

export const TMP_ISO1502_FUNCTIONAL_LIMITS = {
  "M12x1.25|6H": {
    source:"ISO1502_PENDING_FINAL_VALIDATION",
    status:"ISO1502_BETA_LIMITS",
    pass:{ id:"PASA", d2_nominal_mm:11.2, min_mm:11.1945, max_mm:11.2055, wear_max_mm:11.1705 },
    no_pass:{ id:"NO_PASA", d2_nominal_mm:11.368, min_mm:11.3625, max_mm:11.3735, wear_max_mm:11.3565 },
    warning:"Limites ISO1502 V30 pendientes de validacion final contra tabla completa y clausula aplicable."
  }
};

function normalizeKey(parsedThread = {}) {
  const nominal = Number(parsedThread.nominal_mm);
  const pitch = Number(parsedThread.pitch_mm);
  const cls = String(parsedThread.tolerance_class || "6H").toUpperCase().replace("H6", "6H");
  if (!Number.isFinite(nominal) || !Number.isFinite(pitch)) return null;
  const n = Number.isInteger(nominal) ? String(nominal) : String(nominal).replace(/0+$/, "").replace(/\.$/, "");
  const p = Number.isInteger(pitch) ? String(pitch) : String(pitch).replace(/0+$/, "").replace(/\.$/, "");
  return `M${n}x${p}|${cls}`;
}

function buildDynamicIso1502FromIso965(parsedThread) {
  const iso965 = resolveIso965Limits(parsedThread);
  if (!iso965?.ok) return { ok:false, source:TMP_ISO1502_ENGINE_VERSION, error:"ISO965_NOT_READY", iso965 };

  const D2min = Number(iso965.summary?.D2_min_mm);
  const D2max = Number(iso965.summary?.D2_max_mm);
  const TD2 = Number(iso965.summary?.TD2_mm ?? (D2max - D2min));
  if (![D2min, D2max, TD2].every(Number.isFinite)) {
    return { ok:false, source:TMP_ISO1502_ENGINE_VERSION, error:"ISO965_D2_LIMITS_INCOMPLETE", iso965 };
  }

  const table = getISO1502InternalPlugRowByTd2(TD2);
  if (!table?.ok) return { ok:false, source:TMP_ISO1502_ENGINE_VERSION, error:"ISO1502_TABLE_ROW_NOT_FOUND", iso965, table };

  const zpl = Number(table.row.zpl_um) / 1000;
  const tpl = Number(table.row.tpl_um) / 1000;
  const wgo = Number(table.row.wgo_um) / 1000;
  const wng = Number(table.row.wng_um) / 1000;

  const passNominal = D2min + zpl;
  const noPassNominal = D2max;

  const data = {
    source: table.row.source || "ISO1502_TABLE_DYNAMIC_FROM_ISO965",
    status: "ISO1502_BETA_LIMITS_DYNAMIC_FROM_ISO965",
    iso965_key: iso965.key,
    td2_mm: round(TD2, 9),
    constants_mm: { z_pl:zpl, t_pl:tpl, w_go:wgo, w_ng:wng },
    pass: {
      id:"PASA",
      d2_nominal_mm: round(passNominal, 9),
      min_mm: round(passNominal - tpl / 2, 9),
      max_mm: round(passNominal + tpl / 2, 9),
      wear_max_mm: round(passNominal - wgo, 9)
    },
    no_pass: {
      id:"NO_PASA",
      d2_nominal_mm: round(noPassNominal, 9),
      min_mm: round(noPassNominal - tpl / 2, 9),
      max_mm: round(noPassNominal + tpl / 2, 9),
      wear_max_mm: round(noPassNominal - wng, 9)
    },
    warning:"Calculo dinamico ISO1502 desde limites ISO965 y tabla ISO1502 cargada. Validar contra tabla oficial antes de emitir certificado acreditado."
  };

  return { ok:true, data, iso965, table };
}

export function resolveIso1502Limits(parsedThread) {
  if (!parsedThread?.ok) return { ok:false, source:TMP_ISO1502_ENGINE_VERSION, error:"THREAD_NOT_PARSED" };
  const key = normalizeKey(parsedThread);
  const staticData = TMP_ISO1502_FUNCTIONAL_LIMITS[key];
  const dynamic = staticData ? { ok:true, data:staticData } : buildDynamicIso1502FromIso965(parsedThread);
  if (!dynamic?.ok) return { ok:false, source:TMP_ISO1502_ENGINE_VERSION, status:"ISO1502_LIMITS_NOT_LOADED", key, message:"No se pueden obtener limites ISO1502 para esta combinacion.", detail:dynamic };
  const data = dynamic.data;
  return {
    ok:true,
    source:TMP_ISO1502_ENGINE_VERSION,
    status:data.status,
    key,
    data,
    summary:{
      pass_d2_nominal_mm:data.pass.d2_nominal_mm,
      pass_min_mm:data.pass.min_mm,
      pass_max_mm:data.pass.max_mm,
      no_pass_d2_nominal_mm:data.no_pass.d2_nominal_mm,
      no_pass_min_mm:data.no_pass.min_mm,
      no_pass_max_mm:data.no_pass.max_mm
    },
    iso965:dynamic.iso965 || null,
    table:dynamic.table || null,
    warning:data.warning
  };
}
export default { TMP_ISO1502_ENGINE_VERSION, TMP_ISO1502_FUNCTIONAL_LIMITS, resolveIso1502Limits };
