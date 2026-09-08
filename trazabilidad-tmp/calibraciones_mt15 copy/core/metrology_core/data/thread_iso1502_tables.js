/* ===========================================================
   TMP ISO1502 TABLES V1
   -----------------------------------------------------------
   Tablas auxiliares ISO1502 para calibres roscados metricos.

   IMPORTANTE:
   - V1 contiene estructura normativa y tablas parciales.
   - NO emitir certificado final hasta completar tablas ISO1502
     clausula 12 / tablas 4 a 9 y formulas clausula 13.
   =========================================================== */

export const TMP_ISO1502_TABLES_VERSION = "TMP_ISO1502_TABLES_V1";

export const ISO1502_INTERNAL_PLUG_GAUGE_TABLE = [
  {
    id: "TD2_125_200",
    td2_min_um_exclusive: 125,
    td2_max_um_inclusive: 200,
    zpl_um: 12,
    tpl_um: 11,
    wgo_um: 17.5,
    wng_um: 11.5,
    source: "ISO1502_PENDING_FINAL_VALIDATION"
  },
  {
    id: "TD2_200_315",
    td2_min_um_exclusive: 200,
    td2_max_um_inclusive: 315,
    zpl_um: 18,
    tpl_um: 14,
    wgo_um: 21,
    wng_um: 15,
    source: "ISO1502_PENDING_FINAL_VALIDATION"
  },
  {
    id: "TD2_315_500",
    td2_min_um_exclusive: 315,
    td2_max_um_inclusive: 500,
    zpl_um: 20,
    tpl_um: 18,
    wgo_um: 25.5,
    wng_um: 19.5,
    source: "ISO1502_PENDING_FINAL_VALIDATION"
  }
];

export function parseNum(value, fallback = null) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function round(value, decimals = 6) {
  const n = parseNum(value, NaN);
  if (!Number.isFinite(n)) return null;
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

export function mmToUm(valueMm) {
  const n = parseNum(valueMm, NaN);
  return Number.isFinite(n) ? n * 1000 : null;
}

export function umToMm(valueUm) {
  const n = parseNum(valueUm, NaN);
  return Number.isFinite(n) ? n / 1000 : null;
}

export function getISO1502InternalPlugRowByTd2(td2_mm) {
  const td2Um = mmToUm(td2_mm);

  if (!Number.isFinite(td2Um)) {
    return {
      ok: false,
      error: "TD2_INVALIDO",
      message: "No se puede buscar ISO1502 sin tolerancia TD2 valida."
    };
  }

  const row = ISO1502_INTERNAL_PLUG_GAUGE_TABLE.find(r =>
    td2Um > r.td2_min_um_exclusive &&
    td2Um <= r.td2_max_um_inclusive
  );

  if (!row) {
    return {
      ok: false,
      error: "RANGO_TD2_NO_CARGADO",
      td2_mm,
      td2_um: round(td2Um, 3),
      message: "No existe todavia fila ISO1502 cargada para esta tolerancia TD2."
    };
  }

  return {
    ok: true,
    td2_mm,
    td2_um: round(td2Um, 3),
    row
  };
}
