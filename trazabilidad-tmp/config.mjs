// config.mjs — versión estable utilizada antes (FUNCIONA)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---- CREDENCIALES SUPABASE ----
const SUPABASE_URL = "https://uukxdslfmxesufuxjzvt.supabase.co";

const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1a3hkc2xmbXhlc3VmdXhqenZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMjg5MjksImV4cCI6MjA3NjcwNDkyOX0.7bmDUEQTfl6Y5jdzORyFZUFtOs7GM0dNdfp1zsURkWw";

// ---- CREACIÓN CLIENTE SUPABASE ----
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

// Hacerlo accesible globalmente
window.supabase = client;
window.sb = client;

// Parámetro usado en cálculos de calibración
window.APP_CONFIG = {
  CAL_WARNING_DAYS: 30
};

console.log("✔ config.mjs cargado correctamente");
