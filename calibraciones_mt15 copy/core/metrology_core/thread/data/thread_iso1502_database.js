/* ===========================================================
   TMP ISO1502 DATABASE V7
   -----------------------------------------------------------
   Base ISO1502 para MT16 - Tampón roscado P/NP.

   IMPORTANTE:
   - validated:false = sólo prueba técnica.
   - validated:true  = permitido para decisión final si el resto
     del flujo también está completo.
   =========================================================== */

export const TMP_ISO1502_DATABASE_VERSION =
  "TMP_ISO1502_DATABASE_V7_20260624_GATE";

export const ISO1502_VALIDATION_STATUS = {
  BETA: "ISO1502_BETA_LIMITS",
  VALIDATED: "ISO1502_VALIDATED",
  MISSING: "ISO1502_MISSING",
  INVALID: "ISO1502_INVALID"
};

export const ISO1502_THREAD_PLUG_GAUGE_LIMITS = {
  "M12x1.25-6H": {
    designation: "M12x1.25-6H",
    thread_type: "METRIC_INTERNAL",
    gauge_type: "THREAD_PLUG_GAUGE_GO_NOGO",
    standard: "ISO1502",

    validated: false,
    validation_status: ISO1502_VALIDATION_STATUS.BETA,
    validation_reference: null,
    validation_notes:
      "Fila beta pendiente de validación contra tabla ISO1502 oficial completa.",

    source: "ISO1502_PENDING_FINAL_VALIDATION",

    input_basis: {
      iso965_designation: "M12x1.25-6H",
      nominal_mm: 12,
      pitch_mm: 1.25,
      tolerance_class: "6H",
      pitch_diameter_min_mm: 11.188,
      pitch_diameter_max_mm: 11.368
    },

    constants_mm: {
      z_pl: 0.012,
      t_pl: 0.011,
      w_go: 0.0175,
      w_ng: 0.0115
    },

    pass: {
      id: "PASA",
      lado: "PASA",
      d2_nominal: 11.2,
      min: 11.1945,
      max: 11.2055,
      wear_max: 11.1705
    },

    no_pass: {
      id: "NO_PASA",
      lado: "NO_PASA",
      d2_nominal: 11.368,
      min: 11.3625,
      max: 11.3735,
      wear_max: 11.3565
    }
  }
};

export function normalizeISO1502Designation(value = "") {
  return String(value || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/,/g, ".")
    .replace("X", "x")
    .replace("-H6", "-6H")
    .replace("H6", "6H")
    .replace(/--+/g, "-")
    .trim();
}

export function getISO1502ThreadPlugGaugeLimits(designation) {
  const key = normalizeISO1502Designation(designation);
  return ISO1502_THREAD_PLUG_GAUGE_LIMITS[key] || null;
}

export function getISO1502ValidationStatus(designation) {
  const key = normalizeISO1502Designation(designation);
  const row = getISO1502ThreadPlugGaugeLimits(key);

  if (!row) {
    return {
      ok: false,
      designation: key,
      status: ISO1502_VALIDATION_STATUS.MISSING,
      can_emit_certificate: false,
      message: "No existe fila ISO1502 para esta designación."
    };
  }

  if (!row.validated) {
    return {
      ok: false,
      designation: key,
      status: row.validation_status || ISO1502_VALIDATION_STATUS.BETA,
      can_emit_certificate: false,
      row,
      message:
        "La fila ISO1502 existe, pero está en beta. No se permite certificado final."
    };
  }

  return {
    ok: true,
    designation: key,
    status: ISO1502_VALIDATION_STATUS.VALIDATED,
    can_emit_certificate: true,
    row,
    message: "Fila ISO1502 validada para decisión final."
  };
}

export function validateISO1502RowShape(row = {}) {
  const required = [
    row.designation,
    row.pass,
    row.no_pass,
    row.pass?.d2_nominal,
    row.pass?.min,
    row.pass?.max,
    row.no_pass?.d2_nominal,
    row.no_pass?.min,
    row.no_pass?.max
  ];

  const complete = required.every(v => v !== null && v !== undefined && v !== "");

  if (!complete) {
    return {
      ok: false,
      error: "ISO1502_ROW_INCOMPLETE",
      message: "La fila ISO1502 no tiene todos los campos obligatorios."
    };
  }

  if (Number(row.pass.min) > Number(row.pass.max)) {
    return {
      ok: false,
      error: "ISO1502_PASS_LIMITS_INVERTED",
      message: "Los límites PASA están invertidos."
    };
  }

  if (Number(row.no_pass.min) > Number(row.no_pass.max)) {
    return {
      ok: false,
      error: "ISO1502_NOPASS_LIMITS_INVERTED",
      message: "Los límites NO PASA están invertidos."
    };
  }

  return {
    ok: true,
    message: "Estructura de fila ISO1502 correcta."
  };
}

export default ISO1502_THREAD_PLUG_GAUGE_LIMITS;
