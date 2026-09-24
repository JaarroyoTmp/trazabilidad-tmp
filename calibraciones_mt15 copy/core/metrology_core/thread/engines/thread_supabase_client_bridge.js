/* ===========================================================
   TMP MT16 SUPABASE BRIDGE V21
   -----------------------------------------------------------
   Usa EXACTAMENTE el supabase_client.js real que usa MT15.

   Punto clave:
   - MT15 esta en: core/metrology_core/app_mt15.js
   - MT15 importa: ../supabase_client.js
   - Por tanto el cliente real esta en: core/supabase_client.js

   MT16 bridge esta en:
   core/metrology_core/thread/engines/thread_supabase_client_bridge.js

   Desde aqui hasta core/supabase_client.js:
   ../../../supabase_client.js

   Archivo:
   core/metrology_core/thread/engines/thread_supabase_client_bridge.js
   =========================================================== */

export const TMP_MT16_SUPABASE_BRIDGE_VERSION =
  "TMP_MT16_SUPABASE_BRIDGE_V21_20260625_RUTA_REAL_MT15";

import { ensureSupabase as conectarSupabase } from "../../../supabase_client.js";

let cachedClient = null;

function setBadgeMT16(ok) {
  window.tmpMt16SupabaseOnline = Boolean(ok);
}

export async function getSupabaseClient() {
  if (cachedClient) {
    return {
      ok: true,
      client: cachedClient,
      source: "CACHE_MT15_REAL_CONNECTION",
      version: TMP_MT16_SUPABASE_BRIDGE_VERSION
    };
  }

  try {
    const client = await conectarSupabase(setBadgeMT16);

    if (!client || typeof client.from !== "function") {
      return {
        ok: false,
        client: null,
        source: "MT15_REAL_ENSURE_SUPABASE_RETURNED_INVALID_CLIENT",
        version: TMP_MT16_SUPABASE_BRIDGE_VERSION,
        error: "ensureSupabase no devolvio un cliente Supabase valido desde core/supabase_client.js."
      };
    }

    cachedClient = client;
    window.tmpSupabaseClient = client;

    return {
      ok: true,
      client,
      source: "MISMA_CONEXION_REAL_QUE_MT15_CORE_SUPABASE_CLIENT",
      version: TMP_MT16_SUPABASE_BRIDGE_VERSION
    };
  } catch (e) {
    return {
      ok: false,
      client: null,
      source: "MT15_REAL_ENSURE_SUPABASE_ERROR",
      version: TMP_MT16_SUPABASE_BRIDGE_VERSION,
      error: e.message || String(e)
    };
  }
}

export function clearSupabaseClientCache() {
  cachedClient = null;
}
