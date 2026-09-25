/* ===========================================================
   TMP THREAD ISO1502 ENGINE V7
   -----------------------------------------------------------
   Motor ISO1502 para MT16 - Tampón roscado P/NP.

   V7:
   - Lee límites desde thread_iso1502_database.js.
   - Distingue beta vs validado.
   - Bloquea certificado final si validated:false.
   =========================================================== */

import {
  TMP_ISO1502_DATABASE_VERSION,
  ISO1502_VALIDATION_STATUS,
  getISO1502ThreadPlugGaugeLimits,
  getISO1502ValidationStatus,
  normalizeISO1502Designation,
  validateISO1502RowShape
} from "../data/thread_iso1502_database.js";

export const TMP_THREAD_ISO1502_ENGINE_VERSION =
  "TMP_THREAD_ISO1502_ENGINE_V7_20260624_GATE";

export function parseNum(value, fallback = null) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function resolveDesignationFromInput({
  designation = null,
  iso965 = null,
  parsed = null
} = {}) {
  if (designation) return normalizeISO1502Designation(designation);

  const nominal =
    iso965?.major_diameter ||
    parsed?.nominal_mm ||
    parsed?.diameter_mm ||
    null;

  const pitch =
    iso965?.pitch ||
    parsed?.pitch_mm ||
    parsed?.pitch ||
    null;

  const cls =
    iso965?.tolerance_class ||
    parsed?.tolerance_class ||
    "6H";

  if (!nominal || !pitch) return null;

  return normalizeISO1502Designation(`M${nominal}x${pitch}-${cls}`);
}

export function calculateISO1502InternalPlugGaugeLimits({
  designation = null,
  iso965 = null,
  parsed = null
} = {}) {
  const key = resolveDesignationFromInput({
    designation,
    iso965,
    parsed
  });

  if (!key) {
    return {
      ok: false,
      source: "thread_iso1502_engine",
      version: TMP_THREAD_ISO1502_ENGINE_VERSION,
      database_version: TMP_ISO1502_DATABASE_VERSION,
      status: ISO1502_VALIDATION_STATUS.INVALID,
      error: "ISO1502_DESIGNATION_NOT_RESOLVED",
      can_emit_certificate: false,
      message:
        "No se pudo resolver la designación ISO1502 a partir de la entrada."
    };
  }

  const row = getISO1502ThreadPlugGaugeLimits(key);

  if (!row) {
    return {
      ok: false,
      source: "thread_iso1502_engine",
      version: TMP_THREAD_ISO1502_ENGINE_VERSION,
      database_version: TMP_ISO1502_DATABASE_VERSION,
      status: ISO1502_VALIDATION_STATUS.MISSING,
      designation: key,
      error: "ISO1502_LIMITS_NOT_FOUND",
      can_emit_certificate: false,
      message:
        "No hay límites ISO1502 cargados para esta designación."
    };
  }

  const shape = validateISO1502RowShape(row);
  const validation = getISO1502ValidationStatus(key);

  if (!shape.ok) {
    return {
      ok: false,
      source: "thread_iso1502_engine",
      version: TMP_THREAD_ISO1502_ENGINE_VERSION,
      database_version: TMP_ISO1502_DATABASE_VERSION,
      status: ISO1502_VALIDATION_STATUS.INVALID,
      designation: key,
      error: shape.error,
      can_emit_certificate: false,
      row,
      message: shape.message
    };
  }

  return {
    ok: true,
    source: "thread_iso1502_engine",
    version: TMP_THREAD_ISO1502_ENGINE_VERSION,
    database_version: TMP_ISO1502_DATABASE_VERSION,

    status: validation.status,
    designation: key,
    standard: "ISO1502",
    validated: Boolean(row.validated),
    validation_reference: row.validation_reference,
    warning: row.validated
      ? null
      : "Límites ISO1502 en beta. No se permite certificado final hasta validación.",

    can_emit_certificate: Boolean(validation.can_emit_certificate),

    input: {
      iso965,
      parsed
    },

    table_row: row,
    constants_mm: row.constants_mm || {},

    pass: {
      ...row.pass
    },

    no_pass: {
      ...row.no_pass
    },

    decision_permission: {
      ok: Boolean(validation.can_emit_certificate),
      reason: row.validated ? "ISO1502_VALIDATED" : "ISO1502_NO_VALIDADO",
      message: validation.message
    },

    message: row.validated
      ? "Límites ISO1502 validados."
      : "Límites ISO1502 disponibles sólo en beta."
  };
}

export function canISO1502EmitFinalDecision(iso1502 = {}) {
  if (!iso1502?.ok) {
    return {
      ok: false,
      reason: "ISO1502_NOT_OK",
      message: "No se puede decidir sin límites ISO1502 válidos."
    };
  }

  if (!iso1502.validated || !iso1502.can_emit_certificate) {
    return {
      ok: false,
      reason: "ISO1502_NO_VALIDADO",
      message:
        "ISO1502 está en beta. Se permite prueba técnica, pero no certificado final."
    };
  }

  return {
    ok: true,
    reason: "ISO1502_VALIDATED",
    message: "ISO1502 validado. Se permite decisión final si el resto del flujo es válido."
  };
}

export function buildISO1502AuditBlock(iso1502 = {}) {
  return {
    source: "thread_iso1502_engine",
    engine_version: TMP_THREAD_ISO1502_ENGINE_VERSION,
    database_version: TMP_ISO1502_DATABASE_VERSION,
    designation: iso1502.designation || null,
    status: iso1502.status || null,
    validated: Boolean(iso1502.validated),
    validation_reference: iso1502.validation_reference || null,
    can_emit_certificate: Boolean(iso1502.can_emit_certificate),
    pass: iso1502.pass || null,
    no_pass: iso1502.no_pass || null,
    warning: iso1502.warning || null
  };
}

export default {
  TMP_THREAD_ISO1502_ENGINE_VERSION,
  calculateISO1502InternalPlugGaugeLimits,
  canISO1502EmitFinalDecision,
  buildISO1502AuditBlock
};
