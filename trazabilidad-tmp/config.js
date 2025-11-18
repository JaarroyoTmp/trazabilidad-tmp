// config.js — versión CORRECTA Y FUNCIONAL PARA VERCEL

const SUPABASE_URL = "https://uukxdslfmxesufuxjzvt.supabase.co";

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1a3hkc2xmbXhlc3VmdXhqenZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMjg5MjksImV4cCI6MjA3NjcwNDkyOX0.7bmDUEQTfl6Y5jdzORyFZUFtOs7GM0dNdfp1zsURkWw";

// ⚠️ ESTA ES LA FORMA CORRECTA EN VERCEL
const { createClient } = supabase;

window.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configuración general
window.APP_CONFIG = {
  CAL_WARNING_DAYS: 30
};
