/* TMP APP MT15 GUIDED V5.2 - GUARDADO ESTABLE + BLOQUEO POR VIGENCIA + SELECTOR EQUIPO */
import { ensureSupabase as conectarSupabase } from "../supabase_client.js";
import { resolveFamilyFromInstrument, attachResolvedFamily } from "./family_resolver.js";
import { buildProcedure } from "./procedure_builder.js";
import { buildPatternOptions, selectPatternOption } from "./pattern_options_engine.js";
import { calculateUncertainty, mean, sampleStd, parseNum, roundTo } from "./uncertainty_engine.js";
import { decidePoint, decideGlobal } from "./decision_engine.js";
import { getNormativeTraceForFamily } from "./normative_registry.js";
import { getAuditRequirements } from "./metrology_rules_repository.js";
import { openTMPReportPreview } from "./report_engine.js";
import { resolvePatternCorrectionAtPoint } from "./pattern_correction_resolver.js";
import { saveCalibrationExecutionPayload, resolveCalibrationDates } from "./calibration_save_helper.js";

const $ = q => document.querySelector(q);
const $$ = q => Array.from(document.querySelectorAll(q));
let supabase = null;

const state = {
  step: 1,
  instrumento: null,
  familyResolved: null,
  answers: {},
  pauta: null,
  patterns: [],
  patternOptionsByPoint: {},
  selections: {},
  readings: {},
  results: null,
  audit: null
};

window.TMP_MT15_STATE = state;

function setBadge(ok) {
  const b = $("#onlineBadge");
  b.textContent = ok ? "Online (Supabase)" : "Offline";
  b.className = ok ? "pill success" : "pill warn";
}

async function ensureSupabase() {
  supabase = await conectarSupabase(setBadge);
  return supabase;
}

function setStep(n) {
  state.step = n;
  $$(".section").forEach(s => s.classList.toggle("active", Number(s.dataset.step) === n));
  $$(".step").forEach(s => {
    const sn = Number(s.dataset.stepLabel);
    s.classList.toggle("active", sn === n);
    s.classList.toggle("done", sn < n);
  });
}

function setMotorStatus(t) {
  $("#motorStatus").innerHTML = t;
}

function pointKey(fid, pid) {
  return `${fid}::${pid}`;
}

function getPointMeta(p = {}, key, fallback = null) {
  return p[key] ?? p.extra?.[key] ?? p.gauge_limits?.[key] ?? fallback;
}

function fmt(value, decimals = 6) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return roundTo(n, decimals);
}

function fmtUm(valueMm, decimals = 3) {
  const n = Number(valueMm);
  if (!Number.isFinite(n)) return "-";
  return `${roundTo(n * 1000, decimals)} µm`;
}

function isExpired(dateValue) {
  if (!dateValue) return false;
  const vence = new Date(dateValue);
  if (Number.isNaN(vence.getTime())) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  vence.setHours(0, 0, 0, 0);
  return vence < hoy;
}

function statusClass(status) {
  if (status === "APTO") return "success";
  if (status === "NO_APTO") return "danger";
  if (status === "NO_EVALUABLE") return "warn";
  if (status === "INDETERMINADO") return "warn";
  return "warn";
}

function bannerClass(status) {
  if (status === "APTO") return "ok";
  if (status === "NO_APTO") return "bad";
  return "warn";
}

function safeStatus(value, fallback = "NO_EVALUABLE") {
  return value || fallback;
}

function getDecisionAudit(decision = {}) {
  return safeStatus(decision.resultado_auditoria || decision.decision_auditoria || decision.status || decision.decision);
}

function getDecisionOperational(decision = {}) {
  return safeStatus(decision.resultado_operativo || decision.decision_operativa || decision.status || decision.decision);
}

function buildOperationalGlobalFromPoints(points = []) {
  const estados = points.map(p => getDecisionOperational(p.decision));

  if (!estados.length) {
    return {
      resultado_operativo: "NO_EVALUABLE",
      motivo_operativo: "Resultado operativo TMP: no hay puntos evaluados.",
      puntos_operativos_aptos: 0,
      puntos_operativos_no_aptos: 0,
      puntos_operativos_no_evaluables: 0
    };
  }

  const aptos = estados.filter(x => x === "APTO").length;
  const noAptos = estados.filter(x => x === "NO_APTO").length;
  const noEvaluables = estados.filter(x => x === "NO_EVALUABLE").length;

  let resultado = "APTO";
  let motivo = "Resultado operativo TMP: todos los puntos operativos son aptos.";

  if (noAptos > 0) {
    resultado = "NO_APTO";
    motivo = "Resultado operativo TMP: existe al menos un punto operativo no apto.";
  } else if (noEvaluables > 0) {
    resultado = "NO_EVALUABLE";
    motivo = "Resultado operativo TMP: existe al menos un punto no evaluable.";
  }

  return {
    resultado_operativo: resultado,
    decision_operativa: resultado,
    conforme_operativo: resultado === "APTO",
    motivo_operativo: motivo,
    puntos_operativos_aptos: aptos,
    puntos_operativos_no_aptos: noAptos,
    puntos_operativos_no_evaluables: noEvaluables
  };
}



function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function getFirmanteNombre() {
  return $("#firmanteNombre")?.value?.trim() || "";
}

function getAutomaticCalibrationDates() {
  if (!state.instrumento) return null;

  return resolveCalibrationDates(
    {
      calibracion: {
        fecha_calibracion: todayISO()
      }
    },
    state.instrumento
  );
}

function syncAutomaticNextCalibrationDate() {
  const input = $("#firmanteProxima");

  if (!input || !state.instrumento) return null;

  let dates = null;

  try {
    dates = getAutomaticCalibrationDates();

    input.value = dates?.fecha_proxima_calibracion || "";
    input.readOnly = true;
    input.setAttribute("readonly", "readonly");
    input.title = `Fecha automática calculada con frecuencia ${dates?.frecuencia_calibracion_meses || 12} meses.`;

    const label = input.closest(".mt")?.querySelector("label");

    if (label) {
      label.textContent = `Próxima calibración automática (${dates?.frecuencia_calibracion_meses || 12} meses)`;
    }
  } catch (err) {
    console.error("TMP error calculando próxima calibración:", err);

    input.value = "";
    input.readOnly = true;
    input.setAttribute("readonly", "readonly");
    input.title = "No se pudo calcular la próxima calibración. Revisar frecuencia del equipo.";
  }

  return dates;
}

function collectUsedPatternCodesFromState() {
  const codes = Object.values(state.selections || {})
    .map(s => s.codigo || s.raw?.codigo)
    .filter(Boolean);

  return [...new Set(codes)];
}

function buildSupabasePayloadMT15() {
  if (!state.instrumento?.id) {
    throw new Error("No hay instrumento cargado o falta instrumento.id.");
  }

  if (!state.results?.puntos?.length) {
    throw new Error("No hay resultados calculados para guardar.");
  }

  const dates = getAutomaticCalibrationDates();

  if (!dates?.fecha_calibracion || !dates?.fecha_proxima_calibracion) {
    throw new Error("No se pudieron calcular las fechas de calibración.");
  }

  const global = state.results.global || {};
  const resultadoOperativo = safeStatus(global.resultado_operativo || state.results.resultado_operativo || global.status);
  const resultadoAuditoria = safeStatus(global.resultado_auditoria || state.results.resultado_auditoria || global.status);
  const codigoCalibracion = `TMP-MT15-${Date.now()}`;

  const calibracion = {
    instrumento_id: state.instrumento.id,
    procedimiento_id: null,
    codigo: codigoCalibracion,
    fecha_ultima: dates.fecha_calibracion,
    fecha_proxima: dates.fecha_proxima_calibracion,
    fecha_calibracion: new Date(dates.fecha_calibracion).toISOString(),
    laboratorio: "TMP",
    certificado_url: null,
    observaciones: [
      `Resultado operativo TMP: ${resultadoOperativo}`,
      `Resultado auditoría: ${resultadoAuditoria}`,
      global.motivo_operativo || "",
      global.motivo || "",
      dates.aviso_frecuencia || ""
    ].filter(Boolean).join(" | "),
    conforme: resultadoOperativo === "APTO",
    resultado: resultadoOperativo,
    patrones_usados: collectUsedPatternCodesFromState(),
    operador: getFirmanteNombre(),
    incertidumbre: null,
    estado_final: resultadoOperativo,
    execution_id: codigoCalibracion,
    familia_equipo: state.familyResolved?.family || null,
    procedimiento_codigo: state.pauta?.procedimiento || null,
    norma_aplicada: (state.pauta?.norma || []).join(" | "),
    regla_decision: "ILAC-G8 / ISO 14253 / TMP_BINARIO_GUARD_BAND",
    decision_global: resultadoAuditoria,
    datos_motor: {
      resultado_operativo: resultadoOperativo,
      resultado_auditoria: resultadoAuditoria,
      frecuencia_calibracion_meses: dates.frecuencia_calibracion_meses,
      fecha_proxima_calibracion: dates.fecha_proxima_calibracion,
      aviso_frecuencia: dates.aviso_frecuencia || null
    },
    payload_completo: buildFinalJSON(),
    estado_guardado: "GUARDADO_TMP_MT15"
  };

  const puntos = (state.results.puntos || []).map((p, index) => {
    const decisionOperativa = getDecisionOperational(p.decision);
    const decisionAuditoria = getDecisionAudit(p.decision);
    const trazabilidad = p.trazabilidad_patron || {};
    const patronId = p.seleccion?.patron_id || p.patronResolved?.patron_id || null;

    return {
      punto_ordinal: index + 1,
      nominal: p.valorReferencia ?? p.punto?.nominal ?? null,
      unidad: p.punto?.unidad || "mm",
      media: p.mediaCorregida ?? p.media ?? null,
      error: p.error ?? null,
      tolerancia_min: p.decision?.limites?.li ?? getPointMeta(p.punto, "limite_inferior", null),
      tolerancia_max: p.decision?.limites?.ls ?? getPointMeta(p.punto, "limite_superior", null),
      conforme: decisionOperativa === "APTO",
      funcion: p.funcion || null,
      etiqueta: p.punto?.etiqueta || p.punto?.id || null,
      valor_referencia: p.valorReferencia ?? null,
      incertidumbre_expandida: p.uncertainty?.U ?? null,
      k: p.uncertainty?.k || 2,
      decision: decisionOperativa,
      motivo_decision: p.decision?.motivo_operativo || p.decision?.motivo || p.decision?.reason || null,
      patron_id: patronId,
      patron_codigo: trazabilidad.codigo || p.seleccion?.codigo || null,
      datos_referencia: trazabilidad,
      datos_incertidumbre: p.uncertainty || null,
      datos_decision: { operativo: decisionOperativa, auditoria: decisionAuditoria, raw: p.decision },
      extras: {
        key: p.key,
        funcion: p.funcion,
        punto_id: p.punto?.id,
        etiqueta: p.punto?.etiqueta,
        nominal_pauta: p.punto?.nominal,
        valor_referencia: p.valorReferencia,
        media_original: p.media,
        media_corregida: p.mediaCorregida,
        s: p.s,
        U: p.uncertainty?.U ?? null,
        uncertainty: p.uncertainty,
        decision: p.decision,
        trazabilidad_patron: p.trazabilidad_patron,
        patron_resolved: p.patronResolved,
        seleccion: p.seleccion
      }
    };
  });

  const lecturas = [];

  (state.results.puntos || []).forEach((p, pointIndex) => {
    (p.readings || []).forEach((valor, idx) => {
      lecturas.push({
        punto_index: pointIndex,
        lectura_ordinal: idx + 1,
        valor,
        funcion: p.funcion || null,
        etiqueta_punto: p.punto?.etiqueta || p.punto?.id || null,
        unidad: p.punto?.unidad || "mm",
        registrado_por: getFirmanteNombre(),
        datos: { key: p.key, media: p.media, media_corregida: p.mediaCorregida, s: p.s }
      });
    });
  });

  const patrones = Object.values(state.selections || {})
    .filter(s => s?.patron_id)
    .map(s => ({
      patron_id: s.patron_id,
      factor_aplicacion: s.motivo || "Seleccionado por operario entre patrones válidos TMP"
    }));

  return { calibracion, puntos, lecturas, patrones, instrumento_id: state.instrumento.id, resultado_operativo: resultadoOperativo, resultado_auditoria: resultadoAuditoria };
}


function normalizeTMPText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseISODateOnly(value) {
  if (!value) return null;

  const d = new Date(String(value).trim());

  if (Number.isNaN(d.getTime())) return null;

  d.setHours(0, 0, 0, 0);

  return d;
}

function todayDateOnly() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getInstrumentNextCalibrationDate(inst = {}) {
  return inst.fecha_proxima_calibracion || inst.proxima_calibracion || inst.fecha_proxima || null;
}

function validateInstrumentAvailableForCalibration(inst = {}) {
  const nextRaw = getInstrumentNextCalibrationDate(inst);
  const next = parseISODateOnly(nextRaw);
  const today = todayDateOnly();

  if (next && next >= today) {
    return {
      ok: false,
      reason: "Este equipo tiene la calibración vigente. No procede recalibrarlo hasta que caduque o exista una autorización de recalibración forzada.",
      fecha_proxima_calibracion: nextRaw,
      estado: inst.estado || "-",
      ubicacion_actual: inst.ubicacion_actual || "-",
      ubicacion: inst.ubicacion || "-"
    };
  }

  return {
    ok: true,
    reason: nextRaw ? "Calibración caducada o vencida. Se permite calibrar." : "Equipo sin próxima calibración registrada. Se permite calibrar y TMP calculará la nueva fecha.",
    fecha_proxima_calibracion: nextRaw || null,
    estado: inst.estado || "-",
    ubicacion_actual: inst.ubicacion_actual || "-",
    ubicacion: inst.ubicacion || "-"
  };
}

function escapeSupabaseSearchTerm(value) {
  return String(value || "")
    .replace(/[%_]/g, "")
    .replace(/[,()]/g, " ")
    .trim();
}

function ensureInstrumentSelectorUI() {
  const input = $("#insCodigo");
  const loadButton = $("#btnCargarInstrumento");

  if (!input || !loadButton || $("#tmpInstrumentSelectorPanel")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "btnBuscarInstrumentoTMP";
  btn.className = "btn secondary";
  btn.textContent = "Buscar equipo";

  loadButton.insertAdjacentElement("afterend", btn);

  const panel = document.createElement("div");
  panel.id = "tmpInstrumentSelectorPanel";
  panel.className = "card mt hidden";
  panel.style.background = "#f8fbff";
  panel.innerHTML = `
    <h3>Buscar equipo en Supabase</h3>
    <div class="row">
      <input id="tmpInstrumentSearchInput" placeholder="Código, descripción o rango..." style="min-width:280px">
      <button id="tmpInstrumentSearchButton" type="button">Buscar</button>
      <button id="tmpInstrumentCloseButton" type="button" class="secondary">Cerrar</button>
    </div>
    <div class="table-box mt">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Descripción</th>
            <th>Rango</th>
            <th>Próxima calibración</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody id="tmpInstrumentSearchRows">
          <tr><td colspan="5">Pulsa Buscar para cargar equipos.</td></tr>
        </tbody>
      </table>
    </div>
    <p class="mini mt">
      TMP sólo permitirá continuar si la calibración está caducada o sin fecha próxima registrada.
    </p>
  `;

  const instrumentoBox = $("#instrumentoBox");

  if (instrumentoBox) {
    instrumentoBox.insertAdjacentElement("beforebegin", panel);
  } else {
    loadButton.closest(".section")?.appendChild(panel);
  }

  btn.addEventListener("click", async () => {
    panel.classList.toggle("hidden");
    if (!panel.classList.contains("hidden")) {
      await searchInstrumentsForSelector("");
      $("#tmpInstrumentSearchInput")?.focus();
    }
  });

  $("#tmpInstrumentCloseButton").addEventListener("click", () => {
    panel.classList.add("hidden");
  });

  $("#tmpInstrumentSearchButton").addEventListener("click", async () => {
    await searchInstrumentsForSelector($("#tmpInstrumentSearchInput")?.value || "");
  });

  $("#tmpInstrumentSearchInput").addEventListener("keydown", async ev => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      await searchInstrumentsForSelector(ev.currentTarget.value || "");
    }
  });
}

async function searchInstrumentsForSelector(term = "") {
  await ensureSupabase();

  const rows = $("#tmpInstrumentSearchRows");

  if (!rows) return;

  if (!supabase) {
    rows.innerHTML = `<tr><td colspan="5">No hay conexión con Supabase.</td></tr>`;
    return;
  }

  rows.innerHTML = `<tr><td colspan="5">Buscando...</td></tr>`;

  const clean = escapeSupabaseSearchTerm(term);
  let query = supabase
    .from("instrumentos")
    .select("id,codigo,descripcion,rango,estado,ubicacion_actual,ubicacion,fecha_proxima_calibracion,proxima_calibracion")
    .order("codigo", { ascending: true })
    .limit(50);

  if (clean) {
    query = query.or(`codigo.ilike.%${clean}%,descripcion.ilike.%${clean}%,rango.ilike.%${clean}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("TMP error buscando equipos:", error);
    rows.innerHTML = `<tr><td colspan="5">Error buscando equipos. Revisa consola.</td></tr>`;
    return;
  }

  const list = data || [];

  if (!list.length) {
    rows.innerHTML = `<tr><td colspan="5">No se encontraron equipos.</td></tr>`;
    return;
  }

  rows.innerHTML = list.map(inst => {
    const disp = validateInstrumentAvailableForCalibration(inst);
    const status = disp.ok
      ? `<span class="pill success">Disponible</span>`
      : `<span class="pill warn">Vigente</span>`;

    return `
      <tr>
        <td><strong>${inst.codigo || ""}</strong></td>
        <td>${inst.descripcion || ""}</td>
        <td>${inst.rango || "-"}</td>
        <td>${inst.fecha_proxima_calibracion || inst.proxima_calibracion || "-"}<br>${status}</td>
        <td>
          <button type="button" class="secondary tmp-select-instrument" data-codigo="${inst.codigo || ""}">
            Seleccionar
          </button>
        </td>
      </tr>
    `;
  }).join("");

  $$(".tmp-select-instrument").forEach(btn => {
    btn.addEventListener("click", () => {
      $("#insCodigo").value = btn.dataset.codigo || "";
      $("#tmpInstrumentSelectorPanel")?.classList.add("hidden");
      cargarInstrumento();
    });
  });
}



async function cargarInstrumento() {
  const codigo = $("#insCodigo").value.trim();

  if (!codigo) {
    alert("Introduce código de instrumento.");
    return;
  }

  await ensureSupabase();

  let inst = null;

  if (supabase) {
    const { data, error } = await supabase
      .from("instrumentos")
      .select("*")
      .eq("codigo", codigo)
      .maybeSingle();

    if (error) {
      console.error(error);
      alert("Error consultando instrumento.");
      return;
    }

    inst = data;
  }

  if (!inst) {
    alert("Instrumento no encontrado.");
    return;
  }

  const disponibilidad = validateInstrumentAvailableForCalibration(inst);

  if (!disponibilidad.ok) {
    state.instrumento = null;
    state.familyResolved = null;
    $("#goStep2").disabled = true;

    $("#instrumentoBox").className = "mt banner warn";
    $("#instrumentoBox").innerHTML = `
      <strong>Equipo con calibración vigente</strong>
      <br>
      <span class="mini">
        Código: ${inst.codigo || "-"} ·
        Descripción: ${inst.descripcion || inst.nombre || "-"}
      </span>
      <br>
      <span class="mini">
        Próxima calibración: <strong>${disponibilidad.fecha_proxima_calibracion || "-"}</strong>
      </span>
      <br>
      <span class="mini">${disponibilidad.reason}</span>
    `;

    setMotorStatus(`
      <span class="pill warn">Calibración no permitida</span>
      <br>
      ${disponibilidad.reason}
    `);

    alert(disponibilidad.reason);
    return;
  }

  const resolved = resolveFamilyFromInstrument(inst);
  const instrumentoMotor = attachResolvedFamily(inst, resolved);

  state.instrumento = instrumentoMotor;
  state.familyResolved = resolved;

  $("#instrumentoBox").className = "mt banner ok";
  $("#instrumentoBox").innerHTML = `
    <strong>${inst.codigo || ""}</strong> · ${inst.descripcion || inst.nombre || ""}
    <br>
    <span class="mini">
      Rango: ${inst.rango || "-"} ·
      Resolución: ${inst.resolucion || inst.resolucion_equipo || "-"} ·
      Familia detectada: <strong>${resolved.family}</strong>
      (${resolved.source}, confianza ${resolved.confidence})
    </span>
  `;

  setMotorStatus(`
    <span class="pill success">Equipo cargado</span>
    <br>
    Familia motor: <strong>${resolved.family}</strong>
  `);

  $("#goStep2").disabled = false;
}

function renderQuestions() {
  const family = state.familyResolved?.family;
  let html = "";

  if (family === "PIE_DE_REY") {
    const max = extractMaxRange(state.instrumento.rango);
    const puedeSonda = max <= 300 || !max;

    html += yesNoQuestion("calibrar_exteriores", "¿Calibrar exteriores?", true);
    html += yesNoQuestion("calibrar_interiores", "¿Calibrar interiores?", true);

    if (puedeSonda) {
      html += yesNoQuestion("calibrar_sonda", "¿Calibrar sonda de profundidad?", true);
    } else {
      state.answers.calibrar_sonda = false;
      html += `<div class="banner warn mt">Sonda no propuesta porque el rango parece mayor de 300 mm.</div>`;
    }

  } else if (family === "TAMPON_LISO_PNP") {
    html += inputQuestion("nominal_pasa", "Nominal lado PASA (mm)", "");
    html += inputQuestion("nominal_no_pasa", "Nominal lado NO PASA (mm)", "");

  } else if (family === "TAMPON_ROSCADO_PNP") {
    html += inputQuestion("tipo_rosca", "Tipo de rosca", "ISO_METRICA");
    html += inputQuestion("diametro_nominal", "Diámetro nominal", "");
    html += inputQuestion("paso", "Paso", "");
    html += inputQuestion("clase", "Clase", "6H");

  } else {
    html += `<div class="banner">Esta familia no necesita preguntas específicas en V1.</div>`;
  }

  $("#questionsBox").innerHTML = html || `<div class="banner">Sin preguntas.</div>`;

  $$("#questionsBox input").forEach(el => {
    el.addEventListener("change", () => {
      state.answers[el.id] = el.type === "checkbox" ? el.checked : el.value;
    });
    el.dispatchEvent(new Event("change"));
  });
}

function yesNoQuestion(id, label, def = true) {
  return `
    <div class="card mt" style="background:#071426">
      <label style="display:flex;align-items:center;gap:8px;margin:0;color:var(--txt)">
        <input id="${id}" type="checkbox" ${def ? "checked" : ""} style="width:auto">
        ${label}
      </label>
    </div>
  `;
}

function inputQuestion(id, label, value = "") {
  return `
    <div class="mt">
      <label>${label}</label>
      <input id="${id}" value="${value}">
    </div>
  `;
}

function extractMaxRange(rango = "") {
  const nums = String(rango).match(/\d+(?:[.,]\d+)?/g)?.map(x => parseNum(x)) || [];
  return nums.length ? Math.max(...nums) : 0;
}

function generarPauta() {
  if (!state.instrumento) {
    alert("Carga instrumento primero.");
    return;
  }

  state.pauta = buildProcedure({
    instrumento: state.instrumento,
    family: state.familyResolved.family,
    familia: state.familyResolved.family,
    respuestas: state.answers,
    nominal_pasa: state.answers.nominal_pasa,
    nominal_no_pasa: state.answers.nominal_no_pasa,
    tipo_rosca: state.answers.tipo_rosca,
    diametro_nominal: state.answers.diametro_nominal,
    paso: state.answers.paso,
    clase: state.answers.clase
  });

  renderPauta();
  $("#goStep4").disabled = false;
  setStep(3);
}

function renderPauta() {
  const p = state.pauta;

  let html = `
    <div class="banner ok">
      <strong>${p.procedimiento}</strong> · ${p.descripcion || ""}
      <br>
      <span class="mini">Normas: ${(p.norma || []).join(" · ")}</span>
    </div>
  `;

  for (const f of p.funciones || []) {
    html += `
      <div class="card mt" style="background:#071426">
        <div class="row">
          <div class="pill success">${f.id}</div>
          <div class="chip">${f.patron_tipo || "Patrón requerido"}</div>
          <span class="right mini">${(f.puntos || []).length} punto(s)</span>
        </div>

        <div class="table-box mt">
          <table>
            <thead>
              <tr>
                <th>Punto</th>
                <th>Nominal que debe medir</th>
                <th>Patrón tipo</th>
                <th>Lecturas</th>
                <th>LI</th>
                <th>LS</th>
              </tr>
            </thead>
            <tbody>
              ${(f.puntos || []).map(pt => `
                <tr>
                  <td>${pt.etiqueta || pt.id}</td>
                  <td><strong>${pt.nominal}</strong> ${pt.unidad || "mm"}</td>
                  <td>${pt.patron_tipo || f.patron_tipo || "-"}</td>
                  <td>${pt.repeticiones || 5}</td>
                  <td>${getPointMeta(pt, "limite_inferior", "-")}</td>
                  <td>${getPointMeta(pt, "limite_superior", "-")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  if (p.warnings?.length) {
    html += `<div class="banner warn mt">${p.warnings.join("<br>")}</div>`;
  }

  $("#pautaBox").className = "mt";
  $("#pautaBox").innerHTML = html;
}

async function cargarPatrones() {
  await ensureSupabase();

  if (!supabase) {
    state.patterns = [];
    return;
  }

  const { data, error } = await supabase
    .from("v_patrones_certificados_vigentes")
    .select("*")
    .eq("activo", true);

  if (error) {
    console.error(error);
    alert("Error cargando patrones.");
    return;
  }

  state.patterns = (data || []).filter(p => !isExpired(p.fecha_vencimiento || p.fecha_proxima_cal));
}

async function prepararOpcionesPatron() {
  await cargarPatrones();

  state.patternOptionsByPoint = {};
  state.selections = {};

  for (const f of state.pauta.funciones || []) {
    for (const p of f.puntos || []) {
      const input = {
        family: state.familyResolved.family,
        familia: state.familyResolved.family,
        strategy: f.id || p.funcion,
        estrategia: f.id || p.funcion,
        nominal: p.nominal,
        unidad: p.unidad || "mm",
        patron_tipo: p.patron_tipo || f.patron_tipo,
        preferidos: [p.patron_tipo || f.patron_tipo].filter(Boolean)
      };

      state.patternOptionsByPoint[pointKey(f.id, p.id)] =
        buildPatternOptions(input, state.patterns, { includeRejected: false });
    }
  }

  renderPatternOptions();
  setStep(4);
}

function renderPatternOptions() {
  let html = "";

  for (const f of state.pauta.funciones || []) {
    html += `<h3 class="mt">${f.nombre || f.id}</h3>`;

    for (const p of f.puntos || []) {
      const key = pointKey(f.id, p.id);
      const opts = state.patternOptionsByPoint[key];

      html += `
        <div class="card mt" style="background:#071426">
          <div class="row">
            <div class="pill">${p.etiqueta || p.id}</div>
            <div class="chip">Nominal ${p.nominal} ${p.unidad || "mm"}</div>
          </div>
      `;

      if (!opts?.options?.length) {
        html += `<div class="banner bad mt">No hay patrones válidos para este punto.</div>`;
      } else {
        for (const opt of opts.options) {
          if (isExpired(opt.fecha_vencimiento || opt.raw?.fecha_vencimiento || opt.raw?.fecha_proxima_cal)) {
            continue;
          }

          html += `
            <div class="option-card" data-option="${key}" data-patron="${opt.patron_id}">
              <label style="display:flex;gap:8px;align-items:flex-start;color:var(--txt)">
                <input type="radio" name="pat_${key}" value="${opt.patron_id}" style="width:auto;margin-top:3px">
                <span>
                  <strong>${opt.codigo || ""} · ${opt.descripcion || opt.label}</strong>
                  <br>
                  <span class="mini">${opt.categoria} · ${opt.ui?.texto_secundario || ""}</span>
                </span>
              </label>
            </div>
          `;
        }
      }

      html += `</div>`;
    }
  }

  $("#patternOptionsBox").innerHTML = html || `<div class="banner">Sin opciones.</div>`;

  $$("#patternOptionsBox input[type=radio]").forEach(radio => {
    radio.addEventListener("change", () => {
      const card = radio.closest(".option-card");
      const key = card.dataset.option;
      const patronId = card.dataset.patron;
      const opts = state.patternOptionsByPoint[key];

      const selected = selectPatternOption(opts, patronId, {
        operario: $("#firmanteNombre")?.value || ""
      });

      if (selected.ok) {
        state.selections[key] = {
          ...selected.seleccion,
          raw: selected.selected_pattern?.raw || selected.selected_pattern || null
        };
      }

      $$(".option-card").forEach(c => {
        if (c.dataset.option === key) c.classList.remove("selected");
      });

      card.classList.add("selected");
      validatePatternSelections();
    });
  });
}

function validatePatternSelections() {
  let req = 0;
  let sel = 0;

  for (const f of state.pauta.funciones || []) {
    for (const p of f.puntos || []) {
      req++;
      if (state.selections[pointKey(f.id, p.id)]) sel++;
    }
  }

  $("#goStep5").disabled = req !== sel;
}

function renderReadings() {
  let html = "";

  for (const f of state.pauta.funciones || []) {
    html += `
      <h3 class="mt">${f.nombre || f.id}</h3>
      <div class="table-box mt">
        <table>
          <thead>
            <tr>
              <th>Punto</th>
              <th>Nominal</th>
              <th>Patrón seleccionado</th>
              <th>R1</th>
              <th>R2</th>
              <th>R3</th>
              <th>R4</th>
              <th>R5</th>
              <th>Media</th>
              <th>s</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (const p of f.puntos || []) {
      const key = pointKey(f.id, p.id);
      const s = state.selections[key];

      html += `
        <tr data-read-row="${key}">
          <td>${p.etiqueta || p.id}</td>
          <td>${p.nominal} ${p.unidad || "mm"}</td>
          <td>${s?.codigo || "-"} · ${s?.label || ""}</td>
          ${[0,1,2,3,4].map(i => `
            <td>
              <input class="reading-input" data-key="${key}" data-idx="${i}" inputmode="decimal">
            </td>
          `).join("")}
          <td data-media="${key}">0.000</td>
          <td data-s="${key}">0.000</td>
        </tr>
      `;
    }

    html += `</tbody></table></div>`;
  }

  $("#readingsBox").innerHTML = html;

  $$("#readingsBox input").forEach(input => {
    input.addEventListener("input", () => input.value = input.value.replace(",", "."));

    input.addEventListener("change", () => {
      const key = input.dataset.key;
      const idx = Number(input.dataset.idx);

      if (!state.readings[key]) state.readings[key] = [null, null, null, null, null];

      state.readings[key][idx] = parseNum(input.value, NaN);

      const vals = state.readings[key].filter(Number.isFinite);

      $(`[data-media="${key}"]`).textContent = roundTo(mean(vals), 6).toFixed(3);
      $(`[data-s="${key}"]`).textContent = roundTo(sampleStd(vals), 6).toFixed(3);
    });
  });
}

async function calcularResultadosMT15() {
  const results = [];

  for (const f of state.pauta.funciones || []) {
    for (const p of f.puntos || []) {
      const key = pointKey(f.id, p.id);
      const readings = (state.readings[key] || []).filter(Number.isFinite);
      const sel = state.selections[key];

      if (readings.length < (p.repeticiones || 5)) {
        alert(`Faltan lecturas en ${p.etiqueta || p.id}`);
        return;
      }

      const media = mean(readings);
      const s = sampleStd(readings);
      const valorReferencia = parseNum(p.valor_referencia_esperado ?? p.nominal);

      const patronResolved = await resolvePatternCorrectionAtPoint({
        supabase,
        selectedPattern: sel,
        nominal: valorReferencia,
        unidad: p.unidad || "mm"
      });

      if (!patronResolved.ok || patronResolved.incertidumbre === null || patronResolved.incertidumbre === undefined || patronResolved.incertidumbre <= 0) {
        const decision = {
          status: "NO_EVALUABLE",
          decision: "NO_EVALUABLE",
          resultado_auditoria: "NO_EVALUABLE",
          decision_auditoria: "NO_EVALUABLE",
          resultado_operativo: "NO_EVALUABLE",
          decision_operativa: "NO_EVALUABLE",
          conforme: false,
          conforme_operativo: false,
          motivo: patronResolved.message || "Patrón sin incertidumbre certificada válida.",
          motivo_operativo: patronResolved.message || "Resultado operativo TMP no evaluable: patrón sin incertidumbre certificada válida.",
          reason: patronResolved.error || "PATRON_SIN_INCERTIDUMBRE_VALIDA",
          regla_decision: "TMP_PATRON_DATOS_OBLIGATORIOS",
          regla_operativa: "TMP_BINARIO_GUARD_BAND",
          nominal: valorReferencia,
          valor_medido: media,
          error: media - valorReferencia,
          U: null
        };

        results.push({
          key,
          funcion: f.id,
          punto: p,
          seleccion: sel,
          readings,
          media,
          mediaCorregida: media,
          s,
          valorReferencia,
          error: media - valorReferencia,
          uncertainty: null,
          patronResolved,
          trazabilidad_patron: null,
          decision
        });

        continue;
      }

      const mediaCorregida = media + (patronResolved.correccion || 0);

      const uncertainty = calculateUncertainty({
        family: state.familyResolved.family,
        familia: state.familyResolved.family,
        nominal: valorReferencia,
        lecturas: readings,
        resolucion: state.instrumento.resolucion_equipo || state.instrumento.resolucion || 0,
        unidad: p.unidad || "mm",
        patron: {
          incertidumbre: patronResolved.incertidumbre,
          incertidumbre_unidad: p.unidad || "mm",
          k: patronResolved.k || sel?.raw?.factor_k || 2
        }
      });

      const decisionInput = {
        id: p.id,
        etiqueta: p.etiqueta,
        nominal: valorReferencia,
        valor_medido: mediaCorregida,
        media_corregida: mediaCorregida,
        error: mediaCorregida - valorReferencia,
        U: uncertainty.U,
        regla_decision: "ILAC_G8_GUARD_BAND"
      };

      const li = getPointMeta(p, "limite_inferior", null);
      const ls = getPointMeta(p, "limite_superior", null);
      const toleranciaAbs = getPointMeta(p, "tolerancia_abs", null);

      if (li !== null && li !== undefined) {
        decisionInput.limite_inferior = li;
      }

      if (ls !== null && ls !== undefined) {
        decisionInput.limite_superior = ls;
      }

      if (
        decisionInput.limite_inferior === undefined ||
        decisionInput.limite_superior === undefined
      ) {
        decisionInput.tolerancia_abs = toleranciaAbs;
        decisionInput.regla_decision = "ERROR_ABSOLUTO_ILAC_G8";
      }

      const decision = decidePoint(decisionInput);

      const trazabilidadPatron = {
        patron_id: patronResolved.patron_id,
        codigo: sel?.codigo || sel?.raw?.codigo || null,
        certificado: patronResolved.punto_certificado?.numero_certificado ||
          patronResolved.lower?.numero_certificado ||
          patronResolved.upper?.numero_certificado ||
          null,
        source: patronResolved.source,
        source_rule: patronResolved.source_rule || null,
        modo_resolucion: patronResolved.mode || null,
        nominal_usado: patronResolved.nominal_usado,
        nominal_certificado: patronResolved.punto_certificado_nominal || null,
        punto_certificado_nominal: patronResolved.punto_certificado_nominal || null,
        correccion_patron: patronResolved.correccion,
        correccion_certificado_interpolada: patronResolved.correccion_certificado_interpolada ?? null,
        incertidumbre_patron: patronResolved.incertidumbre,
        incertidumbre_us: patronResolved.incertidumbre_us ?? null,
        formula_incertidumbre: patronResolved.formula_incertidumbre || null,
        criterio_correccion: patronResolved.criterio_correccion || null
      };

      results.push({
        key,
        funcion: f.id,
        punto: p,
        seleccion: sel,
        readings,
        media,
        mediaCorregida,
        s,
        valorReferencia,
        error: mediaCorregida - valorReferencia,
        uncertainty,
        patronResolved,
        trazabilidad_patron: trazabilidadPatron,
        decision
      });
    }
  }

  let global = decideGlobal({
    family: state.familyResolved.family,
    familia: state.familyResolved.family,
    regla_global: state.pauta.regla_global,
    decisions: results.map(r => ({
      id: r.punto.id,
      status: getDecisionAudit(r.decision),
      decision: getDecisionAudit(r.decision),
      resultado_auditoria: getDecisionAudit(r.decision),
      decision_auditoria: getDecisionAudit(r.decision),
      resultado_operativo: getDecisionOperational(r.decision),
      decision_operativa: getDecisionOperational(r.decision),
      motivo: r.decision.motivo,
      motivo_operativo: r.decision.motivo_operativo
    }))
  });

  const globalOperativo = buildOperationalGlobalFromPoints(results);

  global = {
    ...global,
    ...globalOperativo,
    resultado_auditoria: global.resultado_auditoria || global.status,
    decision_auditoria: global.decision_auditoria || global.resultado_auditoria || global.status
  };

  state.results = {
    puntos: results,
    global,
    resultado_auditoria: global.resultado_auditoria || global.status,
    resultado_operativo: global.resultado_operativo
  };

  renderResults();
  renderAudit();
  $("#goStep7").disabled = false;
  setStep(6);
}

function renderResults() {
  const r = state.results;
  const operativoGlobal = safeStatus(r.global?.resultado_operativo || r.resultado_operativo || r.global?.status);
  const auditoriaGlobal = safeStatus(r.global?.resultado_auditoria || r.resultado_auditoria || r.global?.status);
  const motivoOperativo = r.global?.motivo_operativo || "";
  const motivoAuditoria = r.global?.motivo || "";

  let html = `
    <div class="banner ${bannerClass(operativoGlobal)}">
      <strong>Resultado operativo TMP:</strong> ${operativoGlobal}
      <br>
      <span class="mini">
        Regla operativa: TMP_BINARIO_GUARD_BAND.
        ${motivoOperativo ? `<br>${motivoOperativo}` : ""}
      </span>
    </div>

    <div class="banner ${bannerClass(auditoriaGlobal)} mt">
      <strong>Resultado auditoría:</strong> ${auditoriaGlobal}
      <br>
      <span class="mini">
        Regla técnica: ILAC-G8 / ISO 14253 según aplique.
        ${motivoAuditoria ? `<br>${motivoAuditoria}` : ""}
      </span>
    </div>
  `;

  html += `
    <div class="table-box mt">
      <table>
        <thead>
          <tr>
            <th>Función</th>
            <th>Punto</th>
            <th>Referencia</th>
            <th>Media corregida</th>
            <th>Error</th>
            <th>U</th>
            <th>LI</th>
            <th>LS</th>
            <th>Intervalo U</th>
            <th>Patrón</th>
            <th>Operativo TMP</th>
            <th>Auditoría</th>
            <th>Motivo</th>
          </tr>
        </thead>
        <tbody>
  `;

  for (const p of r.puntos) {
    const Utxt = p.uncertainty?.U !== undefined && p.uncertainty?.U !== null
      ? `${roundTo(p.uncertainty.U * 1000, 3)} µm`
      : "-";

    const li = p.decision?.limites?.li ?? "-";
    const ls = p.decision?.limites?.ls ?? "-";

    const intervalo = p.decision?.intervalo_expandido
      ? `${fmt(p.decision.intervalo_expandido.inferior, 6)} / ${fmt(p.decision.intervalo_expandido.superior, 6)}`
      : "-";

    const patronTxt = p.seleccion
      ? `${p.seleccion.codigo || ""}`
      : "-";

    const operativo = getDecisionOperational(p.decision);
    const auditoria = getDecisionAudit(p.decision);

    html += `
      <tr>
        <td>${p.funcion}</td>
        <td>${p.punto.etiqueta || p.punto.id}</td>
        <td>${fmt(p.valorReferencia, 6)}</td>
        <td>${fmt(p.mediaCorregida ?? p.media, 6)}</td>
        <td>${fmtUm(p.error, 3)}</td>
        <td>${Utxt}</td>
        <td>${li}</td>
        <td>${ls}</td>
        <td>${intervalo}</td>
        <td>${patronTxt}</td>
        <td><span class="pill ${statusClass(operativo)}">${operativo}</span></td>
        <td><span class="pill ${statusClass(auditoria)}">${auditoria}</span></td>
        <td class="mini">
          <strong>Operativo:</strong> ${p.decision.motivo_operativo || "-"}
          <br>
          <strong>Auditoría:</strong> ${p.decision.motivo || p.decision.reason || ""}
          <br>
          <strong>Regla auditoría:</strong> ${p.decision.regla_decision || "-"}
          <br>
          <strong>Regla operativa:</strong> ${p.decision.regla_operativa || "TMP_BINARIO_GUARD_BAND"}
        </td>
      </tr>
    `;
  }

  html += `</tbody></table></div>`;

  html += `
    <div class="card mt" style="background:#071426">
      <h3>Resumen de decisiones</h3>
      <div class="table-box mt">
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Resultado</th>
              <th>APTO</th>
              <th>NO APTO</th>
              <th>INDETERMINADO</th>
              <th>NO EVALUABLE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Operativo TMP</strong></td>
              <td><span class="pill ${statusClass(operativoGlobal)}">${operativoGlobal}</span></td>
              <td>${r.global?.puntos_operativos_aptos ?? r.puntos.filter(p => getDecisionOperational(p.decision) === "APTO").length}</td>
              <td>${r.global?.puntos_operativos_no_aptos ?? r.puntos.filter(p => getDecisionOperational(p.decision) === "NO_APTO").length}</td>
              <td>0</td>
              <td>${r.global?.puntos_operativos_no_evaluables ?? r.puntos.filter(p => getDecisionOperational(p.decision) === "NO_EVALUABLE").length}</td>
            </tr>
            <tr>
              <td><strong>Auditoría</strong></td>
              <td><span class="pill ${statusClass(auditoriaGlobal)}">${auditoriaGlobal}</span></td>
              <td>${r.global?.puntos_aptos ?? r.puntos.filter(p => getDecisionAudit(p.decision) === "APTO").length}</td>
              <td>${r.global?.puntos_no_aptos ?? r.puntos.filter(p => getDecisionAudit(p.decision) === "NO_APTO").length}</td>
              <td>${r.global?.puntos_indeterminados ?? r.puntos.filter(p => getDecisionAudit(p.decision) === "INDETERMINADO").length}</td>
              <td>${r.global?.puntos_no_evaluables ?? r.puntos.filter(p => getDecisionAudit(p.decision) === "NO_EVALUABLE").length}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  html += `
    <div class="card mt" style="background:#071426">
      <h3>Auditoría técnica del cálculo</h3>
      <div class="table-box mt">
        <table>
          <thead>
            <tr>
              <th>Punto</th>
              <th>Patrón</th>
              <th>Certificado</th>
              <th>Modo</th>
              <th>Nominal certificado</th>
              <th>Corrección patrón</th>
              <th>U patrón</th>
              <th>Fórmula / criterio</th>
            </tr>
          </thead>
          <tbody>
            ${r.puntos.map(p => {
              const t = p.trazabilidad_patron || {};
              return `
                <tr>
                  <td>${p.punto.etiqueta || p.punto.id}</td>
                  <td>${t.codigo || p.seleccion?.codigo || "-"}</td>
                  <td>${t.certificado || "-"}</td>
                  <td>${t.modo_resolucion || "-"}</td>
                  <td>${t.nominal_certificado ?? "-"}</td>
                  <td>${fmtUm(t.correccion_patron, 3)}</td>
                  <td>${fmtUm(t.incertidumbre_patron, 3)}</td>
                  <td class="mini">
                    ${t.formula_incertidumbre || "-"}
                    <br>
                    ${t.criterio_correccion || ""}
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  $("#resultsBox").innerHTML = html;
}

function renderAudit() {
  const family = state.familyResolved.family;
  const normativa = getNormativeTraceForFamily(family);
  const req = getAuditRequirements(family);

  state.audit = {
    family,
    normativa,
    requisitos: req,
    results: state.results
  };

  $("#auditBox").innerHTML = `
    <div class="banner ok">
      <strong>Informe auditoría generado</strong>
      <br>
      <span class="mini">Familia: ${family} · Procedimiento: ${req.procedimiento_tmp || "-"}</span>
    </div>

    <div class="card mt" style="background:#071426">
      <h3>Normativa general</h3>
      <p class="mini">${(normativa.referencias_generales || []).map(n => `${n.codigo}: ${n.uso}`).join("<br>")}</p>
    </div>

    <div class="card mt" style="background:#071426">
      <h3>Normativa específica</h3>
      <p class="mini">${(normativa.referencias_familia || []).map(n => `${n.codigo}: ${n.uso}`).join("<br>") || "No informada"}</p>
    </div>

    <div class="card mt" style="background:#071426">
      <h3>Debe quedar documentado</h3>
      <p class="mini">${(req.debe_documentar || []).map(x => `• ${x}`).join("<br>") || "No definido"}</p>
    </div>
  `;
}

function buildFinalJSON() {
  let dates = null;

  try {
    dates = getAutomaticCalibrationDates();
  } catch {
    dates = null;
  }

  return {
    version: "TMP_CALIBRACIONES_MT15_GUIDED_V4_SUPABASE_SAVE_AUTO_DATES",
    fecha: new Date().toISOString(),
    fecha_calibracion: dates?.fecha_calibracion || todayISO(),
    fecha_proxima_calibracion: dates?.fecha_proxima_calibracion || $("#firmanteProxima")?.value || "",
    proxima_calibracion: dates?.fecha_proxima_calibracion || $("#firmanteProxima")?.value || "",
    frecuencia_calibracion_meses: dates?.frecuencia_calibracion_meses || state.instrumento?.frecuencia_calibracion_meses || 12,
    instrumento: state.instrumento,
    family_resolved: state.familyResolved,
    answers: state.answers,
    pauta: state.pauta,
    pattern_selections: state.selections,
    readings: state.readings,
    results: state.results,
    audit: state.audit,
    firma: {
      nombre: getFirmanteNombre(),
      proxima_calibracion: dates?.fecha_proxima_calibracion || $("#firmanteProxima")?.value || "",
      frecuencia_calibracion_meses: dates?.frecuencia_calibracion_meses || 12,
      fecha_automatica: true
    }
  };
}

async function guardarSupabase() {
  try {
    await ensureSupabase();

    if (!supabase) {
      alert("No hay conexión con Supabase.");
      return;
    }

    if (!state.instrumento) {
      alert("No hay instrumento cargado.");
      return;
    }

    const disponibilidad = validateInstrumentAvailableForCalibration(state.instrumento);

    if (!disponibilidad.ok) {
      alert("No se puede guardar calibración: " + disponibilidad.reason);
      return;
    }

    if (!state.results?.puntos?.length) {
      alert("Primero calcula los resultados antes de guardar.");
      return;
    }

    const dates = syncAutomaticNextCalibrationDate();
    const payload = buildSupabasePayloadMT15();

    payload.calibracion = {
      ...payload.calibracion,
      certificado_url: null,
      estado_guardado: "GUARDADO_TMP_MT15_INFORME_PENDIENTE",
      datos_motor: {
        ...(payload.calibracion.datos_motor || {}),
        informe_pdf_estado: "PENDIENTE_GENERACION",
        informe_pdf_motivo: "Generación de informe desacoplada temporalmente para no bloquear calibración."
      }
    };

    console.log("TMP MT15 payload Supabase =", payload);

    const saved = await saveCalibrationExecutionPayload(supabase, payload);

    console.log("TMP MT15 guardado Supabase =", saved);

    if (!saved?.ok) {
      alert("No se pudo guardar la calibración. Revisa consola.");
      return;
    }

    const instActualizado =
      saved.instrumento_actualizado?.instrumento_actualizado ||
      saved.instrumento_actualizado?.data ||
      null;

    state.instrumento = {
      ...state.instrumento,
      ...(instActualizado || {}),
      fecha_calibracion: dates?.fecha_calibracion || payload.calibracion.fecha_ultima,
      fecha_proxima_calibracion: dates?.fecha_proxima_calibracion || payload.calibracion.fecha_proxima,
      proxima_calibracion: dates?.fecha_proxima_calibracion || payload.calibracion.fecha_proxima
    };

    $("#goStep2").disabled = true;

    alert(
      "Calibración guardada correctamente en Supabase." +
      "\n\nFecha calibración: " + (dates?.fecha_calibracion || payload.calibracion.fecha_ultima) +
      "\nPróxima calibración: " + (dates?.fecha_proxima_calibracion || payload.calibracion.fecha_proxima) +
      "\n\nEl informe PDF queda pendiente de generación en una fase separada."
    );
  } catch (err) {
    console.error("TMP error guardando calibración:", err);
    alert("Error guardando calibración en Supabase: " + (err?.message || err));
  }
}

$("#btnCargarInstrumento").addEventListener("click", cargarInstrumento);
$("#goStep2").addEventListener("click", () => { renderQuestions(); setStep(2); });
$("#btnGenerarPauta").addEventListener("click", generarPauta);
$("#goStep4").addEventListener("click", prepararOpcionesPatron);
$("#goStep5").addEventListener("click", () => { renderReadings(); setStep(5); });
$("#btnCalcularResultados").addEventListener("click", calcularResultadosMT15);
$("#goStep7").addEventListener("click", () => { setStep(7); syncAutomaticNextCalibrationDate(); });
$("#btnGuardarSupabase").addEventListener("click", guardarSupabase);

const btnInforme = $("#btnVerJSON");
btnInforme.replaceWith(btnInforme.cloneNode(true));

$("#btnVerJSON").addEventListener("click", () => {
  const pre = $("#jsonPreview");

  if (pre) {
    pre.classList.add("hidden");
    pre.textContent = "";
  }

  const data = buildFinalJSON();
  console.log("TMP certificado data =", data);

  openTMPReportPreview(data);
});

$$("[data-prev]").forEach(btn => btn.addEventListener("click", () => setStep(Number(btn.dataset.prev))));

$("#btnVolverVieja").addEventListener("click", () => {
  window.location.href = "./TMP_Calibraciones_Lab.html";
});

setBadge(false);
setStep(1);
ensureInstrumentSelectorUI();

try {
  const url = new URL(location.href);
  const c = url.searchParams.get("codigo");

  if (c) {
    $("#insCodigo").value = c;
    setTimeout(cargarInstrumento, 150);
  }
} catch {}