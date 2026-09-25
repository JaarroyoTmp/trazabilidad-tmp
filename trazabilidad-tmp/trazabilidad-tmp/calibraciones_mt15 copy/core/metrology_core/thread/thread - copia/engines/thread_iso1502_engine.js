/* ===========================================================
   TMP ISO1502 ENGINE V1
   -----------------------------------------------------------
   Motor inicial ISO1502 para calibres roscados metricos.

   Alcance V1:
   - Calibres tampon roscados para rosca interior ISO.
   - Calcula estructura PASA / NO PASA desde limites ISO965.
   - Usa tabla auxiliar ISO1502 parcial.
   - Bloquea decision final si la tabla esta pendiente.
   =========================================================== */

import {
  getISO1502InternalPlugRowByTd2,
  parseNum,
  round,
  umToMm
} from "../data/thread_iso1502_tables.js";

export const TMP_ISO1502_ENGINE_VERSION = "TMP_ISO1502_ENGINE_V1";

export function calculateTd2FromISO965(iso965 = {}) {
  const max = parseNum(iso965.pitch_diameter_max, NaN);
  const min = parseNum(iso965.pitch_diameter_min, NaN);

  if (!Number.isFinite(max) || !Number.isFinite(min)) {
    return {
      ok: false,
      error: "ISO965_D2_LIMITES_INVALIDOS",
      message: "Faltan D2 maximo/minimo ISO965."
    };
  }

  return {
    ok: true,
    td2_mm: round(max - min, 6),
    d2_max_mm: round(max, 6),
    d2_min_mm: round(min, 6)
  };
}

export function calculateISO1502InternalPlugGaugeLimits({
  designation,
  iso965
} = {}) {
  if (!iso965) {
    return {
      ok: false,
      error: "ISO965_NO_RECIBIDO",
      message: "No se puede calcular ISO1502 sin limites ISO965."
    };
  }

  const td2 = calculateTd2FromISO965(iso965);

  if (!td2.ok) return td2;

  const table = getISO1502InternalPlugRowByTd2(td2.td2_mm);

  if (!table.ok) {
    return {
      ok: false,
      status: "ISO1502_TABLE_PENDING",
      designation,
      td2,
      error: table.error,
      message: table.message
    };
  }

  const row = table.row;

  const zpl = umToMm(row.zpl_um);
  const tpl = umToMm(row.tpl_um);
  const wgo = umToMm(row.wgo_um);
  const wng = umToMm(row.wng_um);

  const d2Min = td2.d2_min_mm;
  const d2Max = td2.d2_max_mm;

  const goNominal = round(d2Min + zpl, 6);
  const goMin = round(goNominal - tpl / 2, 6);
  const goMax = round(goNominal + tpl / 2, 6);
  const goWearLimit = round(d2Min - wgo, 6);

  const noGoNominal = round(d2Max, 6);
  const noGoMin = round(noGoNominal - tpl / 2, 6);
  const noGoMax = round(noGoNominal + tpl / 2, 6);
  const noGoWearLimit = round(d2Max - wng, 6);

  return {
    ok: true,
    status: "ISO1502_BETA_LIMITS",
    designation,
    source: row.source,
    warning:
      "Limites ISO1502 V1 pendientes de validacion final contra tablas completas y clausula 13.",
    input: {
      iso965,
      td2
    },
    table_row: row,
    constants_mm: {
      zpl,
      tpl,
      wgo,
      wng
    },
    pass: {
      id: "PASA",
      lado: "PASA",
      d2_nominal: goNominal,
      min: goMin,
      max: goMax,
      wear_max: goWearLimit
    },
    no_pass: {
      id: "NO_PASA",
      lado: "NO_PASA",
      d2_nominal: noGoNominal,
      min: noGoMin,
      max: noGoMax,
      wear_max: noGoWearLimit
    }
  };
}

export function canISO1502EmitFinalDecision(iso1502Result = {}) {
  if (!iso1502Result?.ok) {
    return {
      ok: false,
      reason: iso1502Result?.error || "ISO1502_INVALIDO",
      message: "No se puede emitir decision final sin ISO1502 valido."
    };
  }

  if (iso1502Result.status !== "ISO1502_VALIDATED") {
    return {
      ok: false,
      reason: "ISO1502_NO_VALIDADO",
      message: "ISO1502 esta calculado en beta, pero no validado para certificado final."
    };
  }

  return {
    ok: true,
    reason: "ISO1502_VALIDADO",
    message: "ISO1502 validado para decision final."
  };
}

export default {
  TMP_ISO1502_ENGINE_VERSION,
  calculateTd2FromISO965,
  calculateISO1502InternalPlugGaugeLimits,
  canISO1502EmitFinalDecision
};
