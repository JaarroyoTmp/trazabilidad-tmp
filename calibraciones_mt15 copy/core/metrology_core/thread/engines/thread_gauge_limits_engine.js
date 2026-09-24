/* ===========================================================
   TMP THREAD GAUGE LIMITS ENGINE V1 - SAFE ISO1502 STUB
   -----------------------------------------------------------
   Motor seguro de límites de calibres roscados.

   Esta versión NO calcula todavía límites PASA/NO PASA porque
   faltan las tablas 4 a 9 y las fórmulas completas de ISO 1502.

   Objetivo:
   - Evitar que TMP invente valores.
   - Dejar preparada la integración normativa.
   =========================================================== */

import {
  TMP_ISO1502_DATABASE,
  assertISO1502GaugeTablesLoaded
} from "../data/thread_iso1502_database.js";

export const TMP_THREAD_GAUGE_LIMITS_ENGINE_VERSION =
  "TMP_THREAD_GAUGE_LIMITS_ENGINE_V1_SAFE_STUB";

export function buildThreadGaugeLimits(input = {}) {
  const ready = assertISO1502GaugeTablesLoaded();

  if (!ready.ok) {
    return {
      ok: false,
      source: "thread_gauge_limits_engine",
      engine: TMP_THREAD_GAUGE_LIMITS_ENGINE_VERSION,
      error: ready.error,
      message: ready.message,
      input,
      normative_source: TMP_ISO1502_DATABASE.source,
      next_required: [
        "ISO1502 tablas 4 a 9",
        "ISO1502 cláusula 13",
        "ISO965 tolerancias de rosca",
        "ISO724 geometría básica"
      ]
    };
  }

  return {
    ok: false,
    error: "IMPLEMENTACION_PENDIENTE",
    message: "Las tablas están marcadas como cargadas, pero el cálculo final aún no está implementado."
  };
}
