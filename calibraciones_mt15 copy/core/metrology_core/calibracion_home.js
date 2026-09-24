/* TMP HOME CALIBRACIONES V1 */
import { ensureSupabase } from "./supabase_client.js";

export const TMP_CALIBRATION_HOME_VERSION = "TMP_CALIBRATION_HOME_V1_20260701";

const ROUTES = {
  THREAD_PLUG: "./thread/thread_mt16_workflow_test.html",
  PLAIN_PLUG: "./calibraciones_mt15_guiada.html",
  DEFAULT: "./calibraciones_mt15_guiada.html"
};

const $ = (s) => document.querySelector(s);
let supabase = null;

function esc(v) {
  return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function norm(v = "") {
  return String(v || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/×/g, "X").replace(/,/g, ".").replace(/\s+/g, " ").trim();
}
function toast(message, type = "ok") {
  const box = $("#toastBox");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  box.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}
async function initSupabase() {
  try {
    supabase = await ensureSupabase((ok) => {
      $("#supabaseBadge").textContent = ok ? "Supabase conectado" : "Supabase no disponible";
      $("#supabaseBadge").className = ok ? "badge ok" : "badge warn";
    });
    if (supabase) {
      $("#supabaseBadge").textContent = "Supabase conectado";
      $("#supabaseBadge").className = "badge ok";
    }
  } catch (e) {
    supabase = null;
    $("#supabaseBadge").textContent = "Supabase error";
    $("#supabaseBadge").className = "badge warn";
  }
}
function classifyEquipment(equipment = {}) {
  const text = norm([equipment.codigo,equipment.descripcion,equipment.descripcion_equipo,equipment.tipo,equipment.tipo_instrumento,equipment.familia,equipment.rango,equipment.modelo,equipment.observaciones].filter(Boolean).join(" "));
  if (text.includes("ROSCA") || text.includes("ROSCADO") || text.includes("THREAD") || /\bM\s*\d+(?:\.\d+)?\s*(?:X|-)\s*\d+(?:\.\d+)?/.test(text)) {
    return { family: "THREAD_PLUG", label: "Tampón roscado", procedure: "MT16 · Tampón roscado P/NP", route: ROUTES.THREAD_PLUG, confidence: 95, why: "Detectada designación o texto de rosca. El flujo recomendado es MT16." };
  }
  if (text.includes("TAMPON") || text.includes("TAPÓN") || text.includes("PASA") || text.includes("NO PASA") || text.includes("P/NP") || text.includes("LISO")) {
    return { family: "PLAIN_PLUG", label: "Tampón liso", procedure: "MT15 · Tampón liso P/NP", route: ROUTES.PLAIN_PLUG, confidence: 82, why: "Detectado tampón liso o calibre P/NP. El flujo recomendado es MT15." };
  }
  return { family: "UNKNOWN", label: "Familia no confirmada", procedure: "Revisión manual", route: ROUTES.DEFAULT, confidence: 0, why: "No hay señales suficientes para seleccionar procedimiento automáticamente." };
}
function calibrationState(equipment = {}) {
  const next = equipment.fecha_proxima_calibracion || equipment.proxima_calibracion || equipment.fecha_proxima || null;
  if (!next) return { label: "Sin fecha próxima", cls: "warn", message: "No se ha encontrado fecha de próxima calibración." };
  const d = new Date(next);
  if (Number.isNaN(d.getTime())) return { label: "Fecha no válida", cls: "warn", message: "La fecha de próxima calibración no es interpretable." };
  const today = new Date(); today.setHours(0,0,0,0); d.setHours(0,0,0,0);
  const days = Math.round((d - today) / 86400000);
  if (days < 0) return { label: "Caducado", cls: "bad", message: `Calibración vencida hace ${Math.abs(days)} días.` };
  if (days <= 30) return { label: "Próximo", cls: "warn", message: `Calibración próxima en ${days} días.` };
  return { label: "Vigente", cls: "ok", message: `Calibración vigente. Faltan ${days} días.` };
}
async function findEquipment(code) {
  if (!supabase) throw new Error("Supabase no está disponible.");
  const clean = String(code || "").trim();
  const attempts = [
    () => supabase.from("instrumentos").select("*").eq("codigo", clean).limit(1),
    () => supabase.from("instrumentos").select("*").eq("codigo_interno", clean).limit(1),
    () => supabase.from("instrumentos").select("*").ilike("codigo", `%${clean}%`).limit(1)
  ];
  for (const make of attempts) {
    try {
      const { data, error } = await make();
      if (!error && Array.isArray(data) && data.length) return data[0];
    } catch (_) {}
  }
  return null;
}
function demoThreadEquipment() {
  return { codigo: "75148", descripcion: "Tampón de Rosca P/NP", rango: "M12 x 1.25 - 6H", modelo: "M12x1.25", ubicacion: "Laboratorio", fecha_proxima_calibracion: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10) };
}
function renderEquipment(equipment, classification, state) {
  $("#mainState").textContent = state.label; $("#familyState").textContent = classification.label; $("#procedureState").textContent = classification.procedure;
  $("#decisionChip").textContent = state.label; $("#decisionChip").className = `chip ${state.cls}`;
  $("#equipmentCard").className = "";
  $("#equipmentCard").innerHTML = `<div class="data-grid">
      <div class="data-item"><span>Código</span><strong>${esc(equipment.codigo || equipment.codigo_interno || "-")}</strong></div>
      <div class="data-item"><span>Descripción</span><strong>${esc(equipment.descripcion || equipment.descripcion_equipo || "-")}</strong></div>
      <div class="data-item"><span>Rango</span><strong>${esc(equipment.rango || equipment.range || "-")}</strong></div>
      <div class="data-item"><span>Ubicación</span><strong>${esc(equipment.ubicacion || equipment.destino || "-")}</strong></div>
      <div class="data-item"><span>Próxima calibración</span><strong>${esc(equipment.fecha_proxima_calibracion || equipment.proxima_calibracion || "-")}</strong></div>
      <div class="data-item"><span>Estado</span><strong>${esc(state.message)}</strong></div>
    </div>`;
}
function renderProcedure(classification) {
  let html = "";
  if (classification.family === "THREAD_PLUG") {
    html = `<div class="callout ok"><strong>Procedimiento experto MT16</strong><br>Tampón roscado PASA / NO PASA con banco patrón Trimos.</div>
      <div class="data-grid">
        <div class="data-item"><span>Normas</span><strong>ISO 1502 · ISO 965 · ISO 724 · DIN 2269 · ILAC-G8</strong></div>
        <div class="data-item"><span>Patrón real</span><strong>Banco Trimos certificado</strong></div>
        <div class="data-item"><span>Útil</span><strong>Rodillos calculados por norma</strong></div>
        <div class="data-item"><span>Decisión</span><strong>Automática, sin criterio manual</strong></div>
      </div>`;
  } else if (classification.family === "PLAIN_PLUG") {
    html = `<div class="callout ok"><strong>Procedimiento MT15</strong><br>Tampón liso PASA / NO PASA con patrón dimensional certificado.</div>
      <div class="data-grid">
        <div class="data-item"><span>Normas</span><strong>ISO 286 · ISO 1938 · ILAC-G8</strong></div>
        <div class="data-item"><span>Patrón real</span><strong>Patrón dimensional certificado</strong></div>
        <div class="data-item"><span>Lecturas</span><strong>5 por punto</strong></div>
        <div class="data-item"><span>Decisión</span><strong>Automática</strong></div>
      </div>`;
  } else html = `<div class="callout warn"><strong>Familia no confirmada</strong><br>Revisar clasificación del equipo antes de calibrar.</div>`;
  $("#procedureCard").className = ""; $("#procedureCard").innerHTML = html;
}
function renderRoute(equipment, classification, state) {
  const code = encodeURIComponent(equipment.codigo || equipment.codigo_interno || $("#equipmentCode").value || "");
  const href = `${classification.route}?codigo=${code}&from=home_calibraciones`;
  const note = state.cls === "ok" ? "El equipo parece vigente. El flujo final podrá bloquear recalibración si procede." : "Puede abrirse el flujo de calibración guiada.";
  $("#routeCard").className = "";
  $("#routeCard").innerHTML = `<div class="callout ${state.cls === "bad" ? "bad" : "warn"}">${esc(note)}</div>
    <div class="route-actions"><a href="${esc(href)}">Abrir ${esc(classification.procedure)}</a><a class="secondary-link" href="#" id="copyCodeLink">Copiar código del equipo</a></div>`;
  $("#copyCodeLink").addEventListener("click", async (ev) => {
    ev.preventDefault(); await navigator.clipboard?.writeText(String(equipment.codigo || equipment.codigo_interno || "")); toast("Código copiado.", "ok");
  });
}
function renderWizard(classification) {
  const steps = classification.family === "THREAD_PLUG"
    ? [["Equipo","Confirmar tampón roscado y designación."],["Normas","Aplicar ISO 1502 / ISO 965 / DIN 2269."],["Banco","Preparar banco Trimos certificado."],["Rodillos","Montar rodillos calculados por norma."],["PASA","Tomar 5 lecturas del lado PASA."],["NO PASA","Tomar 5 lecturas del lado NO PASA."],["Decisión","Calcular incertidumbre y aplicar ILAC-G8."]]
    : classification.family === "PLAIN_PLUG"
      ? [["Equipo","Confirmar tampón liso P/NP."],["Patrón","Seleccionar patrón dimensional certificado."],["PASA","Tomar lecturas del lado PASA."],["NO PASA","Tomar lecturas del lado NO PASA."],["Decisión","Calcular y aplicar regla de decisión."]]
      : [["Revisión","No hay pasos automáticos hasta confirmar familia."]];
  $("#wizardPreview").innerHTML = steps.map((s, i) => `<div class="step"><div class="step-no">${i + 1}</div><div><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></div><span class="tag">${i === 0 ? "inicio" : "pendiente"}</span></div>`).join("");
}
function renderWhy(classification) {
  const text = classification.family === "THREAD_PLUG"
    ? `<strong>Por qué MT16:</strong><br>El texto del equipo contiene una designación o descripción de rosca. Para este caso el sistema debe aplicar ISO 1502 / ISO 965 / ISO 724 y DIN 2269.<br><br><strong>Criterio TMP:</strong><br>El banco Trimos certificado es el patrón trazable. Los rodillos son útiles calculados por norma para poder tomar la lectura, pero no son la base de incertidumbre principal.<br><br><strong>Operario:</strong><br>Sólo sigue pasos, monta útiles, registra lecturas y no decide OK/NOK.`
    : classification.family === "PLAIN_PLUG"
      ? `<strong>Por qué MT15:</strong><br>El equipo parece un tampón liso o calibre P/NP. El flujo correcto es dimensional, con patrón certificado y decisión automática.`
      : `No se ha podido justificar un procedimiento automático. Revise descripción, rango o familia del equipo.`;
  $("#whyContent").innerHTML = text;
}
function renderAll(equipment) {
  const classification = classifyEquipment(equipment);
  const state = calibrationState(equipment);
  renderEquipment(equipment, classification, state);
  renderProcedure(classification);
  renderRoute(equipment, classification, state);
  renderWizard(classification);
  renderWhy(classification);
  if (classification.family === "THREAD_PLUG") toast("Equipo roscado detectado. Flujo MT16 recomendado.", "ok");
  else if (classification.family === "PLAIN_PLUG") toast("Equipo liso detectado. Flujo MT15 recomendado.", "ok");
  else toast("No se ha podido clasificar el equipo automáticamente.", "warn");
}
async function onSearch() {
  const code = $("#equipmentCode").value.trim();
  if (!code) { toast("Introduce un código de equipo.", "warn"); return; }
  $("#mainState").textContent = "Buscando...";
  try {
    const equipment = await findEquipment(code);
    if (!equipment) {
      toast("No encontrado en Supabase. Se muestra clasificación básica por código/texto.", "warn");
      renderAll({ codigo: code, descripcion: code, rango: code });
      return;
    }
    renderAll(equipment);
  } catch (e) {
    toast(e.message || "Error buscando equipo.", "bad");
    renderAll({ codigo: code, descripcion: code, rango: code });
  }
}
$("#btnSearch").addEventListener("click", onSearch);
$("#equipmentCode").addEventListener("keydown", (ev) => { if (ev.key === "Enter") onSearch(); });
$("#btnDemoThread").addEventListener("click", () => { $("#equipmentCode").value = "75148"; renderAll(demoThreadEquipment()); });
$("#btnWhy").addEventListener("click", () => $("#whyDialog").showModal());
$("#btnCloseWhy").addEventListener("click", () => $("#whyDialog").close());
$("#versionBadge").textContent = TMP_CALIBRATION_HOME_VERSION;
initSupabase();
