const SUPABASE_URL = "https://uukxdslfmxesufuxjzvt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1a3hkc2xmbXhlc3VmdXhqenZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMjg5MjksImV4cCI6MjA3NjcwNDkyOX0.7bmDUEQTfl6Y5jdzORyFZUFtOs7GM0dNdfp1zsURkWw";

let supabase = null;

export async function ensureSupabase(setBadge) {
  if (!SUPABASE_URL.startsWith("http")) {
    if (setBadge) setBadge(false);
    return null;
  }

  if (!supabase) {
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.5");
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
      console.warn("Error cargando supabase-js:", e);
      supabase = null;
    }
  }

  if (setBadge) setBadge(!!supabase);
  return supabase;
}