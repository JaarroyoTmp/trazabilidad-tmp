/* ===========================================================
   TMP ISO965 DATABASE V3 - MT16 V41
   -----------------------------------------------------------
   Base normativa inicial ISO965 para roscas métricas ISO.

   Fuente:
   - ISO 965-2:1998
   - Tabla 3: Roscas interiores finas, calidad media,
     grupo de acoplamiento normal, clase 6H.

   Estado:
   - V2 técnica para MT16 beta.
   - Contiene límites ISO965 reales para varias roscas interiores 6H.
   - No emitir certificado final hasta completar ISO1502 y validación.
   =========================================================== */

export const ISO965_DATABASE = {
  "M12x1.25-6H": {
    type: "internal",
    source: "ISO965-2:1998_TABLE_3",
    major_diameter: 12,
    pitch: 1.25,
    tolerance_class: "6H",
    pitch_diameter_max: 11.368,
    pitch_diameter_min: 11.188,
    minor_diameter_max: 10.912,
    minor_diameter_min: 10.647
  },

  "M12x1.5-6H": {
    type: "internal",
    source: "ISO965-2:1998_TABLE_3",
    major_diameter: 12,
    pitch: 1.5,
    tolerance_class: "6H",
    pitch_diameter_max: 11.216,
    pitch_diameter_min: 11.026,
    minor_diameter_max: 10.676,
    minor_diameter_min: 10.376
  },

  "M14x1.5-6H": {
    type: "internal",
    source: "ISO965-2:1998_TABLE_3",
    major_diameter: 14,
    pitch: 1.5,
    tolerance_class: "6H",
    pitch_diameter_max: 13.216,
    pitch_diameter_min: 13.026,
    minor_diameter_max: 12.676,
    minor_diameter_min: 12.376
  },

  "M16x1.5-6H": {
    type: "internal",
    source: "ISO965-2:1998_TABLE_3",
    major_diameter: 16,
    pitch: 1.5,
    tolerance_class: "6H",
    pitch_diameter_max: 15.216,
    pitch_diameter_min: 15.026,
    minor_diameter_max: 14.676,
    minor_diameter_min: 14.376
  },

  "M18x1.5-6H": {
    type: "internal",
    source: "ISO965-2:1998_TABLE_3",
    major_diameter: 18,
    pitch: 1.5,
    tolerance_class: "6H",
    pitch_diameter_max: 17.216,
    pitch_diameter_min: 17.026,
    minor_diameter_max: 16.676,
    minor_diameter_min: 16.376
  },

  "M16x2-6H": {
    type: "internal",
    source: "ISO965-2:1998_TABLE_3",
    major_diameter: 16,
    pitch: 2,
    tolerance_class: "6H",
    pitch_diameter_max: 14.913,
    pitch_diameter_min: 14.701,
    minor_diameter_max: 14.210,
    minor_diameter_min: 13.835
  },

  "M18x2-6H": {
    type: "internal",
    source: "ISO965-2:1998_TABLE_3",
    major_diameter: 18,
    pitch: 2,
    tolerance_class: "6H",
    pitch_diameter_max: 16.913,
    pitch_diameter_min: 16.701,
    minor_diameter_max: 16.210,
    minor_diameter_min: 15.835
  },

  "M20x1.5-6H": {
    type: "internal",
    source: "ISO965-2:1998_TABLE_3",
    major_diameter: 20,
    pitch: 1.5,
    tolerance_class: "6H",
    pitch_diameter_max: 19.216,
    pitch_diameter_min: 19.026,
    minor_diameter_max: 18.676,
    minor_diameter_min: 18.376
  },

  "M20x2-6H": {
    type: "internal",
    source: "ISO965-2:1998_TABLE_3",
    major_diameter: 20,
    pitch: 2,
    tolerance_class: "6H",
    pitch_diameter_max: 18.913,
    pitch_diameter_min: 18.701,
    minor_diameter_max: 18.210,
    minor_diameter_min: 17.835
  },

  "M22x1.5-6H": {
    type: "internal",
    source: "ISO965-2:1998_TABLE_3",
    major_diameter: 22,
    pitch: 1.5,
    tolerance_class: "6H",
    pitch_diameter_max: 21.216,
    pitch_diameter_min: 21.026,
    minor_diameter_max: 20.676,
    minor_diameter_min: 20.376
  },

  "M22x2-6H": {
    type: "internal",
    source: "ISO965-2:1998_TABLE_3",
    major_diameter: 22,
    pitch: 2,
    tolerance_class: "6H",
    pitch_diameter_max: 20.913,
    pitch_diameter_min: 20.701,
    minor_diameter_max: 20.210,
    minor_diameter_min: 19.835
  },

  "M24x2-6H": {
    type: "internal",
    source: "ISO965-2:1998_TABLE_3",
    major_diameter: 24,
    pitch: 2,
    tolerance_class: "6H",
    pitch_diameter_max: 22.925,
    pitch_diameter_min: 22.701,
    minor_diameter_max: 22.210,
    minor_diameter_min: 21.835
  },

  "M27x2-6H": {
    type: "internal",
    source: "ISO965-2:1998_TABLE_3",
    major_diameter: 27,
    pitch: 2,
    tolerance_class: "6H",
    pitch_diameter_max: 25.925,
    pitch_diameter_min: 25.701,
    minor_diameter_max: 25.210,
    minor_diameter_min: 24.835
  },

  "M30x2-6H": {
    type: "internal",
    source: "ISO965-2:1998_TABLE_3",
    major_diameter: 30,
    pitch: 2,
    tolerance_class: "6H",
    pitch_diameter_max: 28.925,
    pitch_diameter_min: 28.701,
    minor_diameter_max: 28.210,
    minor_diameter_min: 27.835
  },

  "M33x2-6H": {
    type: "internal",
    source: "ISO965-2:1998_TABLE_3",
    major_diameter: 33,
    pitch: 2,
    tolerance_class: "6H",
    pitch_diameter_max: 31.925,
    pitch_diameter_min: 31.701,
    minor_diameter_max: 31.210,
    minor_diameter_min: 30.835
  },

  "M36x3-6H": {
    type: "internal",
    source: "ISO965-2:1998_TABLE_3",
    major_diameter: 36,
    pitch: 3,
    tolerance_class: "6H",
    pitch_diameter_max: 34.316,
    pitch_diameter_min: 34.051,
    minor_diameter_max: 33.252,
    minor_diameter_min: 32.752
  },

  "M39x3-6H": {
    type: "internal",
    source: "ISO965-2:1998_TABLE_3",
    major_diameter: 39,
    pitch: 3,
    tolerance_class: "6H",
    pitch_diameter_max: 37.316,
    pitch_diameter_min: 37.051,
    minor_diameter_max: 36.252,
    minor_diameter_min: 35.752
  },

  "M42x3-6H": {
    type: "internal",
    source: "ISO965-2:1998_TABLE_3",
    major_diameter: 42,
    pitch: 3,
    tolerance_class: "6H",
    pitch_diameter_max: 40.316,
    pitch_diameter_min: 40.051,
    minor_diameter_max: 39.252,
    minor_diameter_min: 38.752
  }
};

export function normalizeISO965Designation(value = "") {
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

export function getISO965Data(designation) {
  const key = normalizeISO965Designation(designation);
  return ISO965_DATABASE[key] || null;
}

export function existsISO965Designation(designation) {
  return getISO965Data(designation) !== null;
}

export function listISO965Designations() {
  return Object.keys(ISO965_DATABASE);
}

export function getISO965Status(designation) {
  const key = normalizeISO965Designation(designation);
  const data = getISO965Data(key);

  if (!data) {
    return {
      ok: false,
      error: "ISO965_DESIGNATION_NOT_FOUND",
      designation: key
    };
  }

  const complete =
    data.pitch_diameter_max !== null &&
    data.pitch_diameter_min !== null &&
    data.minor_diameter_max !== null &&
    data.minor_diameter_min !== null;

  return {
    ok: complete,
    designation: key,
    complete,
    data,
    message: complete
      ? "Designación ISO965 cargada completa."
      : "Designación ISO965 cargada parcialmente. Faltan límites normativos."
  };
}

export function listISO965Internal6H() {
  return Object.entries(ISO965_DATABASE)
    .filter(([, row]) => row.type === "internal" && row.tolerance_class === "6H")
    .map(([designation, row]) => ({
      designation,
      major_diameter: row.major_diameter,
      pitch: row.pitch,
      pitch_diameter_max: row.pitch_diameter_max,
      pitch_diameter_min: row.pitch_diameter_min,
      minor_diameter_max: row.minor_diameter_max,
      minor_diameter_min: row.minor_diameter_min,
      source: row.source
    }));
}

export default ISO965_DATABASE;