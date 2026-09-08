/* TMP APP MT15 GUIDED V1 */
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
          conforme: false,
          motivo: patronResolved.message || "Patrón sin incertidumbre certificada válida.",
          reason: patronResolved.error || "PATRON_SIN_INCERTIDUMBRE_VALIDA",
          regla_decision: "TMP_PATRON_DATOS_OBLIGATORIOS",
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

  const global = decideGlobal({
    family: state.familyResolved.family,
    familia: state.familyResolved.family,
    regla_global: state.pauta.regla_global,
    decisions: results.map(r => ({
      id: r.punto.id,
      status: r.decision.status,
      decision: r.decision.decision,
      resultado_auditoria: r.decision.resultado_auditoria || r.decision.status,
      resultado_operativo: r.decision.resultado_operativo || r.decision.status,
      motivo: r.decision.motivo
    }))
  });

  state.results = {
    puntos: results,
    global,
    resultado_auditoria: global.resultado_auditoria || global.status,
    resultado_operativo: global.resultado_operativo || global.status
  };

  renderResults();
  renderAudit();
  $("#goStep7").disabled = false;
  setStep(6);
}

function renderResults() {
  const r = state.results;

  let html = `
    <div class="banner ${r.global.status === "APTO" ? "ok" : r.global.status === "NO_APTO" ? "bad" : "warn"}">
      <strong>Decisión global:</strong> ${r.global.status}
      <br>
      <span class="mini">${r.global.motivo || ""}</span>
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
            <th>Decisión</th>
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
        <td>
          <span class="pill ${
            p.decision.status === "APTO" ? "success" :
            p.decision.status === "NO_APTO" ? "danger" :
            "warn"
          }">${p.decision.status}</span>
        </td>
        <td class="mini">
          ${p.decision.motivo || p.decision.reason || ""}
          <br>
          <strong>Regla:</strong> ${p.decision.regla_decision || "-"}
        </td>
      </tr>
    `;
  }

  html += `</tbody></table></div>`;

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
  return {
    version: "TMP_CALIBRACIONES_MT15_GUIDED_V1",
    fecha: new Date().toISOString(),
    instrumento: state.instrumento,
    family_resolved: state.familyResolved,
    answers: state.answers,
    pauta: state.pauta,
    pattern_selections: state.selections,
    readings: state.readings,
    results: state.results,
    audit: state.audit,
    firma: {
      nombre: $("#firmanteNombre").value || "",
      proxima_calibracion: $("#firmanteProxima").value || ""
    }
  };
}

async function guardarSupabase() {
  alert("Guardado Supabase pendiente de conectar en V2. Primero validaremos flujo y JSON.");
}

$("#btnCargarInstrumento").addEventListener("click", cargarInstrumento);
$("#goStep2").addEventListener("click", () => { renderQuestions(); setStep(2); });
$("#btnGenerarPauta").addEventListener("click", generarPauta);
$("#goStep4").addEventListener("click", prepararOpcionesPatron);
$("#goStep5").addEventListener("click", () => { renderReadings(); setStep(5); });
$("#btnCalcularResultados").addEventListener("click", calcularResultadosMT15);
$("#goStep7").addEventListener("click", () => setStep(7));
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
  window.location.href = "./TMP_Calibraciones_lab.html";
});

setBadge(false);
setStep(1);

try {
  const url = new URL(location.href);
  const c = url.searchParams.get("codigo");

  if (c) {
    $("#insCodigo").value = c;
    setTimeout(cargarInstrumento, 150);
  }
} catch {}