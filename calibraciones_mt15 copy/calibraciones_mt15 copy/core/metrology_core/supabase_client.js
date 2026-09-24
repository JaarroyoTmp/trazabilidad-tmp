/* ===========================================================
   TMP Supabase Client Bridge - MC-02
   Ubicación: core/metrology_core/supabase_client.js

   Objetivo:
   - Evitar errores de ruta/MIME en MT17.
   - Reutilizar el cliente oficial si existe en ../supabase_client.js.
   - Mantener compatibilidad con app_mt17.js: ensureSupabase(setBadge).
   =========================================================== */

export const TMP_SUPABASE_CLIENT_VERSION = 'TMP_SUPABASE_CLIENT_BRIDGE_MC02_20260707';

let cachedClient = null;
let cachedSource = null;

async function tryImport(path) {
  try {
    return await import(path);
  } catch (e) {
    return null;
  }
}

async function loadOfficialClient(setBadge) {
  const candidates = [
    '../supabase_client.js',
    '../../supabase_client.js',
    './core/supabase_client.js'
  ];

  for (const path of candidates) {
    const mod = await tryImport(path);
    if (!mod) continue;

    if (typeof mod.ensureSupabase === 'function') {
      const client = await mod.ensureSupabase(setBadge);
      if (client) {
        cachedSource = path;
        return client;
      }
    }

    if (typeof mod.getSupabaseClient === 'function') {
      const res = await mod.getSupabaseClient();
      if (res?.ok && res.client) {
        if (setBadge) setBadge(true);
        cachedSource = path;
        return res.client;
      }
    }
  }

  return null;
}

export async function ensureSupabase(setBadge) {
  if (cachedClient) {
    if (setBadge) setBadge(true);
    return cachedClient;
  }

  const official = await loadOfficialClient(setBadge);
  if (official) {
    cachedClient = official;
    return cachedClient;
  }

  // Ultimo recurso: si otra pantalla ya lo ha creado.
  if (window.tmpSupabaseClient) {
    cachedClient = window.tmpSupabaseClient;
    cachedSource = 'window.tmpSupabaseClient';
    if (setBadge) setBadge(true);
    return cachedClient;
  }

  if (setBadge) setBadge(false);
  console.warn('[TMP MC-02] Supabase no disponible. No se encontro cliente oficial ni cliente global.', { source: cachedSource });
  return null;
}

export async function getSupabaseClient() {
  const client = await ensureSupabase();
  return {
    ok: !!client,
    client,
    source: cachedSource || 'NOT_AVAILABLE',
    version: TMP_SUPABASE_CLIENT_VERSION,
    error: client ? null : 'Supabase no disponible. Revisa core/supabase_client.js o la ruta de ejecucion.'
  };
}

export function isSupabaseConfigured() {
  return true; // La configuracion real vive en el cliente oficial si existe.
}

export default { ensureSupabase, getSupabaseClient, isSupabaseConfigured, TMP_SUPABASE_CLIENT_VERSION };
