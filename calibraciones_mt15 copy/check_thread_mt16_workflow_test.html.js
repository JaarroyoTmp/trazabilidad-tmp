
import { resolveMT16Core } from "./core/mt16_master_engine.js";
import { loadEquipmentByCode } from "../calibration/calibration_equipment_loader.js";
import { resolveFamily, TMP_FAMILY_KEYS } from "../family_resolver.js";


function showToast(msg, type="ok", ms=3200){
  const el = document.getElementById("mt16Toast");
  if(!el) return;
  el.textContent = msg;
  el.className = `mt16-toast ${type} show`;
  clearTimeout(window.__mt16ToastTimer);
  window.__mt16ToastTimer = setTimeout(()=>{ el.className = `mt16-toast ${type}`; }, ms);
}
function downloadMT16Json(){
  try{
    const data = { generated_at:new Date().toISOString(), equipment: loadedEquipment || null, core: core || null, pass: passVals || [], no_pass: noPassVals || [] };
    const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
    const a = document.createElement("a");
    const code = (loadedEquipment?.codigo || "equipo").replace(/[^A-Za-z0-9_-]+/g,"_");
    a.href = URL.createObjectURL(blob);
    a.download = `MT16_${code}_${new Date().toISOString().slice(0,19).replace(/[:T]/g,"-")}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
    showToast("Respaldo JSON generado correctamente.", "ok");
  }catch(e){ showToast("No se pudo generar el respaldo JSON.", "bad"); }
}
function openPrintableCertificate(kind="CERTIFICADO"){
  try{
    if(!core){ showToast("Primero calcula el resultado.", "warn"); return; }
    const w = window.open("", "_blank");
    if(!w){ showToast("El navegador bloqueó la ventana del certificado.", "bad"); return; }
    const v = core.values || {}; const th = core.thread || {}; const sum = core.summary || {};
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>MT16 ${kind}</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#0d2340}h1{margin:0 0 10px}.box{border:1px solid #dbe7f2;border-radius:12px;padding:14px;margin:12px 0}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.k{font-size:11px;color:#60758f;text-transform:uppercase;font-weight:bold}.v{font-size:16px;font-weight:bold}button{padding:10px 14px;border-radius:10px;border:0;background:#2563eb;color:white;font-weight:bold}@media print{button{display:none}}</style></head><body><h1>${kind === "NOK" ? "INFORME NOK MT16" : "CERTIFICADO / PRECERTIFICADO MT16"}</h1><p>Talleres Mecánicos Paramio · generado desde MT16 V91</p><div class="box grid"><div><div class="k">Equipo</div><div class="v">${loadedEquipment?.codigo || ""}</div></div><div><div class="k">Rosca</div><div class="v">${th.designation || ""}</div></div><div><div class="k">Decisión</div><div class="v">${sum.global_decision || "Pendiente"}</div></div></div><div class="box grid"><div><div class="k">Objetivo PASA</div><div class="v">${v.passTarget || "Pendiente"}</div></div><div><div class="k">Objetivo NO PASA</div><div class="v">${v.noPassTarget || "Pendiente"}</div></div><div><div class="k">Rodillo</div><div class="v">${v.rodillo ? "Ø "+v.rodillo+" mm" : "Pendiente"}</div></div></div><div class="box"><h3>Avisos</h3><p>${(core.warnings||[]).join(" | ") || "Sin avisos"}</p></div><button onclick="window.print()">Imprimir / guardar como PDF</button></body></html>`;
    w.document.open(); w.document.write(html); w.document.close();
    showToast(kind === "NOK" ? "Informe NOK abierto." : "Vista imprimible abierta.", "ok");
  }catch(e){ showToast("No se pudo abrir la vista imprimible.", "bad"); }
}

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = v => String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
const fmt = v => v === null || v === undefined || v === "" ? "Pendiente" : (Number.isFinite(Number(v)) ? `${Number(v)} mm` : String(v));
const readNums = arr => arr.map(v => Number(String(v).replace(",", "."))).filter(Number.isFinite);

let supabase = null;
let core = null;
let loadedEquipment = null;
let resolvedFamily = null;
let lastSearchCode = null;
let step = 0;
let passVals = [];
let noPassVals = [];

async function loadSupabase(){
  if(supabase) return supabase;

  // MT16 puede estar dentro de calibraciones_mt15 copy/core/metrology_core/thread/.
  // En ese caso ../supabase_client.js existe, pero en tu ZIP venia sin claves.
  // Por eso NO devolvemos null al primer intento: probamos varias rutas hasta encontrar cliente real.
  const paths = [
    "../supabase_client.js",
    "../../supabase_client.js",
    "../../../supabase_client.js",
    "../../../../calibraciones_mt15/core/supabase_client.js",
    "../../../../../calibraciones_mt15/core/supabase_client.js",
    "./supabase_client.js"
  ];

  const attempts = [];

  for(const p of paths){
    try{
      const mod = await import(p);

      if(mod.ensureSupabase){
        const client = await mod.ensureSupabase();
        attempts.push({path:p, method:"ensureSupabase", ok:!!client});
        if(client){
          supabase = client;
          window.MT16_SUPABASE_SOURCE = { path:p, method:"ensureSupabase", attempts };
          return supabase;
        }
      }

      if(mod.getSupabaseClient){
        const res = await mod.getSupabaseClient();
        attempts.push({path:p, method:"getSupabaseClient", ok:!!res?.client, source:res?.source, error:res?.error});
        if(res?.client){
          supabase = res.client;
          window.MT16_SUPABASE_SOURCE = { path:p, method:"getSupabaseClient", attempts };
          return supabase;
        }
      }
    }catch(e){
      attempts.push({path:p, ok:false, error:e?.message || String(e)});
    }
  }

  window.MT16_SUPABASE_SOURCE = { path:null, attempts };
  console.warn("MT16 no ha encontrado cliente Supabase util", attempts);
  return null;
}

function equipment(){
  return loadedEquipment || { codigo:$("#codigo").value, descripcion:$("#descripcion").value, rango:$("#rango").value };
}

function clearResolvedState(){
  core = null;
  loadedEquipment = null;
  resolvedFamily = null;
  passVals = [];
  noPassVals = [];
  setTxt("stripRodillo", "Pendiente");
  setTxt("stripPass", "Pendiente");
  setTxt("stripNoPass", "Pendiente");
  setTxt("message", "Equipo pendiente de resolver desde Supabase.");
  renderLists();
}

function fillEquipmentFields(eq = {}){
  $("#codigo").value = eq.codigo || "";
  $("#descripcion").value = eq.descripcion || "";
  $("#rango").value = eq.rango || eq.designation || eq.range || "";
  setTxt("stripEquipo", eq.codigo || "-");
}

async function loadRealEquipmentFromSupabase(){
  const sb = await loadSupabase();
  const code = String($("#codigo").value || $("#equipmentSearch").value || "").trim();
  lastSearchCode = code;

  if(!sb){
    throw new Error("MT16 no encuentra cliente Supabase real. Revisa que el HTML este dentro de la carpeta del proyecto y que cargue el supabase_client.js configurado. Mira consola: window.MT16_SUPABASE_SOURCE");
  }

  clearResolvedState();

  const loaded = await loadEquipmentByCode(sb, code);
  if(!loaded.ok){
    throw new Error(`${loaded.error}: ${loaded.message || "No se pudo cargar el equipo."}`);
  }

  loadedEquipment = loaded.instrumento;
  fillEquipmentFields(loadedEquipment);

  resolvedFamily = await resolveFamily(sb, loadedEquipment, { loadFromSupabase:false });

  if(resolvedFamily.family !== TMP_FAMILY_KEYS.TAMPON_ROSCADO_PNP && resolvedFamily.family !== TMP_FAMILY_KEYS.ANILLO_ROSCADO){
    core = {
      ok:false,
      status:"MT16_BLOCKED_WRONG_FAMILY",
      equipment: loadedEquipment,
      resolvedFamily,
      warnings:[`El equipo ${loadedEquipment.codigo} se ha resuelto como ${resolvedFamily.family}. No debe abrir MT16.`],
      summary:{ designation: loadedEquipment.rango || "", global_decision:null },
      traceability:{}
    };
    sync();
    throw new Error(`Equipo ${loadedEquipment.codigo} no pertenece a MT16. Familia resuelta: ${resolvedFamily.family}.`);
  }

  return { equipment: loadedEquipment, family: resolvedFamily };
}

function itemSummary(item){
  if(!item) return "No registrado";
  return `${item.codigo || "-"} · ${item.descripcion || "-"} · Cert: ${item.certificado || "-"} · Score ${item.score ?? "-"} · Vigente: ${item.vigente ? "SI" : "NO"}`;
}
function itemMain(item, fallback="No registrado"){
  if(!item) return fallback;
  return `${item.codigo || "-"} · ${item.descripcion || "-"}`;
}
function setCardState(cardId,statusId,item,extraOk=false,info=false){
  const card=$("#"+cardId), st=$("#"+statusId);
  const ok=!!item || extraOk;
  if(card) card.className="trace-card "+(ok?"ok":(info?"info":"warn"));
  if(st) st.textContent=ok?"Trazable":(info?"Requisito":"Pendiente");
}
function itemMeta(item, fallback){
  if(!item) return fallback || "<div><b>Estado:</b> pendiente de seleccionar desde Supabase.</div>";
  return `<div><b>Certificado:</b> ${esc(item.certificado || "-")}</div><div><b>Score:</b> ${esc(item.score ?? "-")}</div><div><b>Vigente:</b> ${item.vigente ? "SI" : "NO"}</div>`;
}
function traceRequirementHtml(title, action){
  return `<div><b>Estado:</b> no registrado en Supabase</div><div class="trace-action">${esc(action || title || "Registrar trazabilidad antes de certificar.")}</div>`;
}
function nums(arr){ return (arr||[]).map(x=>Number(String(x).replace(",","."))).filter(Number.isFinite); }
function mean(arr){ const a=nums(arr); return a.length?a.reduce((s,x)=>s+x,0)/a.length:null; }
function std(arr){ const a=nums(arr); if(a.length<2) return null; const m=mean(a); return Math.sqrt(a.reduce((s,x)=>s+(x-m)*(x-m),0)/(a.length-1)); }
function signedMm(v,digits=6){ if(v===null||v===undefined||Number.isNaN(Number(v))) return "Pendiente"; const n=Number(v); return `${n>=0?"+":""}${n.toFixed(digits).replace(/0+$/,"").replace(/\.$/,"")} mm`; }

function setTxt(id,v){ const el = $("#"+id); if(el) el.textContent = v ?? "Pendiente"; }

function valFirst(...vals){
  for(const v of vals){
    if(v !== null && v !== undefined && v !== "" && !Number.isNaN(v)) return v;
  }
  return null;
}
function mm(v, digits=6){
  if(v === null || v === undefined || v === "" || Number.isNaN(Number(v))) return "Pendiente";
  return `${Number(v).toFixed(digits).replace(/0+$/," ").replace(/\. $/,"").trim()} mm`;
}
function mt16Values(){
  const s = core?.summary || {};
  const passPoint = core?.trimos?.plan?.points?.find?.(p => p.id === "PASA") || core?.trimos?.plan?.points?.[0] || {};
  const noPassPoint = core?.trimos?.plan?.points?.find?.(p => p.id === "NO_PASA") || core?.trimos?.plan?.points?.[1] || {};
  return {
    rodillo: valFirst(s.rodillo_mm, core?.trimos?.wire?.selected_wire_mm),
    d2Basic: valFirst(s.D2_basic_mm, core?.iso724?.internal_thread_basic_mm?.pitch_diameter_D2),
    d2Pass: valFirst(core?.iso1502?.summary?.pass_d2_nominal_mm, passPoint.d2_nominal_mm),
    d2NoPass: valFirst(core?.iso1502?.summary?.no_pass_d2_nominal_mm, noPassPoint.d2_nominal_mm),
    passTarget: valFirst(s.pass_target_trimos_mm, passPoint.target_trimos_mm),
    noPassTarget: valFirst(s.no_pass_target_trimos_mm, noPassPoint.target_trimos_mm),
    correction: valFirst(s.trimos_correction_mm, core?.trimos?.correction?.correction_mm)
  };
}

function normativeLabels(){
  const s = core?.summary || {};
  return {
    familyLabel: s.normative_standard || (core?.parsed?.thread_system === "BSPP_ISO228" ? "ISO 228-1 / ISO 228-2" : core?.parsed?.thread_system === "BSPT_ISO7" ? "ISO 7-1 / ISO 7-2" : "ISO 724 / ISO 965 / ISO 1502"),
    basic: s.diameter_basic_label || (core?.parsed?.thread_system === "BSPP_ISO228" ? "Diámetro de paso básico ISO 228-1" : core?.parsed?.thread_system === "BSPT_ISO7" ? "Diámetro de paso en plano de calibre ISO 7-1" : "Diámetro básico normativo"),
    pass: s.pass_limit_label || (core?.parsed?.thread_system === "BSPP_ISO228" ? "Límite PASA ISO 228-2" : core?.parsed?.thread_system === "BSPT_ISO7" ? "Calibre cónico ISO 7-2" : "Límite PASA normativo"),
    noPass: s.no_pass_limit_label || (core?.parsed?.thread_system === "BSPP_ISO228" ? "Límite NO PASA ISO 228-2" : core?.parsed?.thread_system === "BSPT_ISO7" ? "Escalón +/- ISO 7-2" : "Límite NO PASA normativo")
  };
}


function listText(arr){ return Array.isArray(arr) && arr.length ? arr.join(" · ") : "Pendiente"; }
function procedureObject(){ return core?.procedure || core?.audit?.procedure || null; }
function renderProcedurePanel(){
  const p = procedureObject();
  if(!p){
    setTxt("procTitle","Procedimiento pendiente");
    setTxt("procSummary","Busca y resuelve un instrumento para cargar el procedimiento experto.");
    setTxt("procState","Pendiente");
    setTxt("procCert","Certificado pendiente");
    setTxt("procStandards","Pendiente"); setTxt("procMethod","Pendiente"); setTxt("procEquipment","Pendiente"); setTxt("procAccessories","Pendiente"); setTxt("procTraceability","Pendiente"); setTxt("procUncertainty","Pendiente"); setTxt("procDecision","Pendiente");
    setTxt("procBlockReason","Pendiente de resolver.");
    const ch = $("#operatorChecklist"); if(ch) ch.innerHTML = "";
    const st = $("#procSteps"); if(st) st.innerHTML = "";
    return;
  }
  const cert = p.certificate || {};
  const caps = p.capabilities || {};
  const meas = p.measurement || {};
  const env = p.environment || {};
  const op = p.operator || {};
  const tr = p.traceability || {};
  setTxt("procTitle", op.title || p.id || "Procedimiento MT16");
  setTxt("procSummary", op.summary || "Procedimiento experto cargado.");
  setTxt("procState", p.state || "Pendiente");
  setTxt("procCert", cert.can_emit ? "Certificable" : "Certificado bloqueado");
  const stateEl = $("#procState"); if(stateEl) stateEl.className = "proc-badge " + (p.state === "CERTIFICABLE" ? "green" : (p.state ? "orange" : ""));
  const certEl = $("#procCert"); if(certEl) certEl.className = "proc-badge " + (cert.can_emit ? "green" : "orange");
  setTxt("procStandards", listText(p.standards));
  setTxt("procMethod", `${meas.method || "Pendiente"} · ${meas.repetitions || 5} lecturas por punto`);
  setTxt("procEquipment", listText(meas.equipment));
  setTxt("procAccessories", listText(meas.accessories));
  setTxt("procTraceability", listText(tr.required));
  setTxt("procUncertainty", `${p.uncertainty?.model || "Pendiente"} · k=${p.uncertainty?.k || 2}`);
  setTxt("procDecision", `${p.decision?.rule || "ILAC-G8 / ISO 14253"} · operario decide: NO`);
  const block = cert.can_emit ? "Procedimiento certificable: permite lecturas, evaluación y certificado si la trazabilidad está vigente." : (cert.blocked_reason || p.certificate_blocked_reason || "Certificado bloqueado hasta completar límites normativos oficiales.");
  setTxt("procBlockReason", block);
  const br = $("#procBlockReason"); if(br) br.className = "status-line " + (cert.can_emit ? "ok" : "warn");
  const checklist = [
    {txt:"Instrumento localizado en Supabase", ok:!!loadedEquipment},
    {txt:"Familia resuelta como tampón/anillo roscado", ok:!!resolvedFamily},
    {txt:`Banco Trimos seleccionado: ${itemSummary(core?.traceability?.selected_bank)}`, ok:!!core?.traceability?.selected_bank},
    {txt:`Rodillo calculado: ${mt16Values().rodillo ? "Ø " + mt16Values().rodillo + " mm" : "pendiente"}`, ok:!!mt16Values().rodillo},
    {txt:"Temperatura 20 ±1 °C y estabilización confirmadas", ok:true},
    {txt: cert.can_emit ? "Certificado permitido por procedimiento" : "Certificado bloqueado: modo validación/norma pendiente", ok:cert.can_emit, warn:!cert.can_emit}
  ];
  const ch = $("#operatorChecklist");
  if(ch) ch.innerHTML = checklist.map(x=>`<div class="checkitem ${x.ok ? "" : (x.warn ? "warn" : "block")}">${esc(x.txt)}</div>`).join("");
  const st = $("#procSteps");
  if(st) st.innerHTML = (op.steps || []).map(x=>`<li>${esc(x)}</li>`).join("") || "<li>Procedimiento pendiente.</li>";
}

function sync(){
  const v = mt16Values();
  const s = core?.summary || {};
  const t = core?.traceability || {};
  const labels = normativeLabels();
  setTxt("stripEquipo", $("#codigo").value || "-");
  setTxt("stripRodillo", v.rodillo ? `Ø ${v.rodillo} mm` : "Pendiente");
  setTxt("stripPass", mm(v.passTarget));
  setTxt("stripNoPass", mm(v.noPassTarget));

  setTxt("rodillo", v.rodillo ? `Ø ${v.rodillo} mm` : "Pendiente");
  setTxt("passTarget", mm(v.passTarget));
  setTxt("noPassTarget", mm(v.noPassTarget));
  setTxt("rosca", s.designation || (s.nominal_mm && s.pitch_mm ? `${s.nominal_label || "M"+s.nominal_mm} x ${s.pitch_mm}` : "Pendiente"));
  setTxt("clase", s.class || "Pendiente");
  setTxt("correction", mm(v.correction, 9));
  setTxt("d2BasicLabel", labels.basic);
  setTxt("d2PassLabel", labels.pass);
  setTxt("d2NoPassLabel", labels.noPass);
  setTxt("d2Basic", mm(v.d2Basic, 6));
  setTxt("d2Pass", mm(v.d2Pass, 6));
  setTxt("d2NoPass", mm(v.d2NoPass, 6));
  setTxt("objectiveHelp", (v.passTarget && v.noPassTarget) ? "Objetivos Trimos disponibles. Ya se pueden tomar lecturas." : "Objetivos Trimos no disponibles para certificado: la familia esta en modo geometria/procedimiento seguro o falta completar tabla normativa oficial.");

  const masterNotRequired = core?.procedure?.traceability?.master_required === false;
  setTxt("bank", itemMain(t.selected_bank, "Banco Trimos no seleccionado"));
  setTxt("rollers", itemMain(t.selected_rollers, v.rodillo ? `Rodillos requeridos Ø ${v.rodillo} mm` : "Rodillos pendientes"));
  setTxt("master", itemMain(t.selected_master, masterNotRequired ? "No requerido por procedimiento" : "Patrón maestro pendiente"));
  const bankMeta=$("#bankMeta"), rollersMeta=$("#rollersMeta"), masterMeta=$("#masterMeta");
  if(bankMeta) bankMeta.innerHTML = itemMeta(t.selected_bank, traceRequirementHtml("Banco", "Seleccionar banco Trimos certificado y vigente."));
  if(rollersMeta) rollersMeta.innerHTML = itemMeta(t.selected_rollers, `<div><b>Diámetro requerido:</b> ${esc(v.rodillo ? "Ø "+v.rodillo+" mm" : "Pendiente")}</div><div class="trace-action">Registrar juego de rodillos/hilos con certificado y vigencia en Supabase.</div>`);
  if(masterMeta) masterMeta.innerHTML = itemMeta(t.selected_master, masterNotRequired ? `<div><b>Estado:</b> no requerido por este procedimiento</div><div class="trace-action">El certificado puede continuar si el banco y rodillos están trazados.</div>` : `<div><b>Estado:</b> patrón rosca no registrado</div><div class="trace-action">Asignar patrón maestro de rosca si el procedimiento lo exige.</div>`);
  setCardState("bankCard","bankStatus",t.selected_bank);
  setCardState("rollersCard","rollersStatus",t.selected_rollers,false,!!v.rodillo);
  setCardState("masterCard","masterStatus",t.selected_master, masterNotRequired, !masterNotRequired);
  const tracePercent = t.score?.percent ?? 0;
  const traceState = tracePercent >= 75 ? "Trazabilidad suficiente para evaluación técnica." : "Trazabilidad incompleta: se permite evaluación técnica, pero el certificado completo queda bloqueado hasta registrar rodillos/patrón si aplica.";
  setTxt("traceHelp", `Score trazabilidad: ${t.score?.total ?? 0}/${t.score?.max ?? 400} (${tracePercent}%). ${traceState}`);

  setTxt("prepRodillo", v.rodillo ? `Ø ${v.rodillo} mm` : "Pendiente");
  setTxt("prepPass", mm(v.passTarget));
  setTxt("prepNoPass", mm(v.noPassTarget));
  setTxt("passNominal", mm(v.passTarget));
  setTxt("noPassNominal", mm(v.noPassTarget));
  setTxt("passD2Reading", mm(v.d2Pass));
  setTxt("noPassD2Reading", mm(v.d2NoPass));

  const pMean=mean(passVals), npMean=mean(noPassVals), pStd=std(passVals), npStd=std(noPassVals);
  setTxt("resEquipo", loadedEquipment?.codigo || $("#codigo").value || "Pendiente");
  setTxt("resRosca", s.designation || "Pendiente");
  setTxt("resClase", s.class || "Pendiente");
  setTxt("resRodillo", v.rodillo ? `Ø ${v.rodillo} mm` : "Pendiente");
  setTxt("resBanco", t.selected_bank?.codigo || "Pendiente");
  setTxt("resNorma", labels.familyLabel || "Pendiente");
  setTxt("resCertState", core?.can_emit_full_certificate ? "CERTIFICABLE" : "NO CERTIFICABLE");
  setTxt("resDecisionRule", core?.procedure?.decision?.rule || "ILAC-G8 / ISO 14253");
  setTxt("resPassTarget", mm(v.passTarget)); setTxt("resNoPassTarget", mm(v.noPassTarget));
  setTxt("resPassMean", mm(pMean)); setTxt("resNoPassMean", mm(npMean));
  setTxt("resPassError", signedMm(pMean!==null && v.passTarget!==null ? pMean-Number(v.passTarget) : null));
  setTxt("resNoPassError", signedMm(npMean!==null && v.noPassTarget!==null ? npMean-Number(v.noPassTarget) : null));
  setTxt("resPassStd", mm(pStd)); setTxt("resNoPassStd", mm(npStd));
  setTxt("resUncertainty", core?.summary?.U_mm ? mm(core.summary.U_mm) : "Pendiente");
  setTxt("decisionText", s.global_decision || "Pendiente");
  setTxt("technicalText", core?.can_emit_technical_result ? "SI" : "NO");
  setTxt("certificateText", core?.can_emit_full_certificate ? "SI" : "NO");
  const warnText=(core?.warnings || []).join("\n") || "Sin avisos";
  setTxt("warningsText", warnText);
  const band=$("#decisionBand");
  if(band){
    const dec=s.global_decision || "Pendiente";
    band.className="decision-band "+(dec==="OK"?"ok":dec==="NOK"?"bad":"warn");
    band.textContent = dec==="OK" ? "Evaluación conforme. El sistema decide APTO si las lecturas, incertidumbre y regla de decisión son válidas." : dec==="NOK" ? "Evaluación no conforme. Revisar lecturas y emitir informe NOK." : "Evaluación pendiente o incompleta. El certificado queda bloqueado hasta completar condiciones técnicas.";
  }
  const saveBtn=$("#saveCalibrationBtn"), pdfBtn=$("#pdfCertificateBtn"), nokBtn=$("#nokReportBtn"), note=$("#finalActionNote");
  const decision=s.global_decision || "Pendiente";
  const technicalAllowed=!!core?.can_emit_technical_result && decision !== "Pendiente";
  const certAllowed=!!core?.can_emit_full_certificate && decision === "OK";
  if(saveBtn) saveBtn.disabled = !technicalAllowed;
  if(pdfBtn) pdfBtn.disabled = !certAllowed;
  if(nokBtn) nokBtn.disabled = decision !== "NOK";
  if(note){
    note.textContent = certAllowed ? "Calibración evaluada y certificable. Puedes guardar y generar certificado PDF." : technicalAllowed ? "Resultado técnico disponible. El certificado completo queda condicionado a la trazabilidad/norma indicada en avisos." : "Introduce lecturas y ejecuta la evaluación para habilitar acciones.";
  }

  renderProcedurePanel();
  renderTech();
  renderLists();
}

function renderReadingInputs(containerId, values, side){
  const cls = side === "PASA" ? "pass-reading" : "nopass-reading";
  const aria = side === "PASA" ? "Lectura PASA" : "Lectura NO PASA";
  const html = [0,1,2,3,4].map(i=>{
    const val = values[i] ?? "";
    const filled = String(val).trim() ? " filled" : "";
    return `<div class="rbox input-rbox"><label for="${cls}-${i}">L${i+1}</label><input id="${cls}-${i}" class="reading-cell ${cls}${filled}" data-index="${i}" inputmode="decimal" autocomplete="off" placeholder="0.000" aria-label="${aria} ${i+1}" value="${esc(val)}"></div>`;
  }).join("");
  $(containerId).innerHTML = html;
}
function readGridValues(selector){
  const arr = [];
  $$(selector).forEach(inp=>{
    const idx = Number(inp.dataset.index);
    const val = inp.value.trim().replace(",",".");
    if(val) arr[idx] = val;
  });
  return arr;
}
function countFilled(values){ return values.filter(v=>String(v||"").trim()).length; }
function attachReadingHandlers(){
  $$(".pass-reading").forEach(inp=>{
    inp.addEventListener("input",()=>{ passVals = readGridValues(".pass-reading"); inp.classList.toggle("filled", !!inp.value.trim()); renderReadingHelp(); });
    inp.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); const next=$("#pass-reading-"+(Number(inp.dataset.index)+1)); if(next) next.focus(); else saveReading(); } });
  });
  $$(".nopass-reading").forEach(inp=>{
    inp.addEventListener("input",()=>{ noPassVals = readGridValues(".nopass-reading"); inp.classList.toggle("filled", !!inp.value.trim()); renderReadingHelp(); });
    inp.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); const next=$("#nopass-reading-"+(Number(inp.dataset.index)+1)); if(next) next.focus(); else saveReading(); } });
  });
}
function renderReadingHelp(){
  const v = mt16Values();
  const pc = countFilled(passVals);
  const nc = countFilled(noPassVals);
  setTxt("passHelp", pc < 5 ? `Rellena las 5 casillas PASA. Completadas ${pc}/5. Objetivo Trimos: ${mm(v.passTarget)} · D2 PASA: ${mm(v.d2Pass)}` : "PASA completo. Pulsa Confirmar lecturas para continuar.");
  setTxt("noPassHelp", nc < 5 ? `Rellena las 5 casillas NO PASA. Completadas ${nc}/5. Objetivo Trimos: ${mm(v.noPassTarget)} · D2 NO PASA: ${mm(v.d2NoPass)}` : "NO PASA completo. Pulsa Confirmar lecturas para calcular.");
}
function renderLists(){
  renderReadingInputs("#passList", passVals, "PASA");
  renderReadingInputs("#noPassList", noPassVals, "NO_PASA");
  attachReadingHandlers();
  renderReadingHelp();
}

function setStep(n){
  step = Math.max(0,Math.min(6,n));
  $$(".stage").forEach(el=>el.classList.toggle("active", Number(el.dataset.stage) === step));
  $$(".step").forEach((el,i)=>{ el.classList.toggle("done", i < step); el.classList.toggle("active", i === step); });
  const states=[
    ["Equipo","Confirma el instrumento.","Pulsa Resolver Core V91.","Resolver Core V91","Pendiente"],
    ["Rodillo y objetivos","Valores calculados por Core V91.","Monta el rodillo indicado y usa los objetivos Trimos.", "Continuar a trazabilidad","Core OK"],
    ["Trazabilidad","Clasificador de patrones V60.","Revisa banco, rodillos patrón y patrón de rosca.","Continuar a preparación","Trazabilidad"],
    ["Preparación","Prepara banco, rodillos y tampón.","Deja todo preparado antes de tomar lecturas.","Continuar a PASA","Montaje"],
    ["Lecturas PASA","Introduce 5 lecturas.","Objetivo PASA visible.","","PASA"],
    ["Lecturas NO PASA","Introduce 5 lecturas.","Objetivo NO PASA visible.","","NO PASA"],
    ["Resultado","Evaluación técnica con lecturas.","Genera evaluación metrológica con Core V91.","Generar evaluación","Decisión"]
  ];
  setTxt("title", states[step][0]);
  setTxt("subtitle", states[step][1]);
  setTxt("message", states[step][2]);
  $("#primaryBtn").textContent = states[step][3];
  $("#primaryBtn").style.display = (step === 4 || step === 5) ? "none" : "";
  $("#saveReadingBtn").style.display = (step === 4 || step === 5) ? "" : "none";
  $("#saveReadingBtn").textContent = step === 4 ? "Confirmar PASA" : step === 5 ? "Confirmar NO PASA" : "Confirmar lecturas";
  $("#chip").textContent = states[step][4];
  $("#chip").className = "chip " + (step > 0 ? "ok" : "");
  sync();
}

async function resolve(withReadings=false){
  const sb = await loadSupabase();

  if(!loadedEquipment || loadedEquipment.codigo !== String($("#codigo").value || "").trim()){
    await loadRealEquipmentFromSupabase();
  }

  const readingsByPoint = withReadings ? { PASA:readNums(passVals), NO_PASA:readNums(noPassVals) } : null;
  core = await resolveMT16Core({ equipment:loadedEquipment, supabase:sb, readingsByPoint });
  core.resolvedFamily = resolvedFamily;
  core.searchAudit = { searched_code:lastSearchCode, resolved_code:loadedEquipment?.codigo, same:String(lastSearchCode)===String(loadedEquipment?.codigo), source:"Supabase instrumentos.codigo exact/flexible" };
  sync();
  return core;
}

function saveReading(){
  const vobj = mt16Values();
  if(step===4 && !vobj.passTarget){ showToast("No hay objetivo PASA Trimos calculado. Revisa Modo Auditor antes de tomar lecturas.", "warn"); return; }
  if(step===5 && !vobj.noPassTarget){ showToast("No hay objetivo NO PASA Trimos calculado. Revisa Modo Auditor antes de tomar lecturas.", "warn"); return; }
  if(step===4){
    passVals = readGridValues(".pass-reading");
    if(countFilled(passVals) < 5){ showToast("Rellena las 5 lecturas PASA directamente en sus casillas L1 a L5.", "warn"); return; }
    renderLists();
    setStep(5);
    setTimeout(()=>{ const first=$("#nopass-reading-0"); if(first) first.focus(); },100);
  } else if(step===5){
    noPassVals = readGridValues(".nopass-reading");
    if(countFilled(noPassVals) < 5){ showToast("Rellena las 5 lecturas NO PASA directamente en sus casillas L1 a L5.", "warn"); return; }
    renderLists();
    setStep(6);
  }
}

function auditStatus(ok){ return ok ? "OK" : "REVISAR"; }
function renderTech(){
  if(!core) return;
  const s = core.summary || {}, t = core.traceability || {};
  const v = mt16Values();
  const audit = core.audit || {};
  const chain = audit.chain || [];
  const labels = normativeLabels();
  const firstRealIssue = chain.find(x=>!x.ok && !["TRAZABILIDAD"].includes(x.step));
  const rows = [
    ["Código buscado / resuelto", `${core.searchAudit?.searched_code || "-"} / ${core.searchAudit?.resolved_code || core.equipment?.codigo || "-"}`, core.searchAudit?.same ? "ok" : "bad"],
    ["Familia resuelta", core.resolvedFamily?.family || resolvedFamily?.family || "-", (core.resolvedFamily?.family || resolvedFamily?.family) === "TAMPON_ROSCADO_PNP" || (core.resolvedFamily?.family || resolvedFamily?.family) === "ANILLO_ROSCADO" ? "ok" : "warn"],
    ["Estado Core", core.status, core.ok ? "ok" : "warn"],
    ["Procedimiento activo", core.procedure?.id || core.audit?.procedure?.id || "Pendiente", core.procedure ? "ok" : "warn"],
    ["Estado procedimiento", core.procedure?.state || "Pendiente", core.procedure?.state === "CERTIFICABLE" ? "ok" : "warn"],
    ["Certificado", core.procedure?.certificate?.can_emit ? "Permitido" : (core.procedure?.certificate?.blocked_reason || "Bloqueado / pendiente"), core.procedure?.certificate?.can_emit ? "ok" : "warn"],
    ["Motor maestro", core.version || core.source || "-", ""],
    ["Designación original", core.equipment?.rango || core.equipment?.designation || "-", ""],
    ["Designación normalizada", s.designation || core.parsed?.normalized || "-", core.parsed?.ok ? "ok" : "warn"],
    ["Sistema / Familia", `${s.thread_system ?? core.parsed?.thread_system ?? "-"} / ${s.family ?? core.parsed?.family ?? "-"} · ${labels.familyLabel}`, core.parsed?.ok ? "ok" : "warn"],
    ["Nominal / Paso / TPI / Clase", `${s.nominal_label ?? s.nominal_mm ?? "-"} / ${s.pitch_mm ?? "-"} / ${s.tpi ?? "-"} / ${s.class ?? "-"}`, ""],
    [labels.basic, `${auditStatus(core.iso724?.ok)} · ${mm(v.d2Basic)}`, core.iso724?.ok ? "ok" : "warn"],
    [core.parsed?.thread_system === "METRIC_ISO" ? "ISO 965" : "Motor tolerancias", `${auditStatus(core.iso965?.ok)} · clave ${core.iso965?.key || "-"} · TD2 ${mm(core.iso965?.summary?.TD2_mm, 9)}`, core.iso965?.ok ? "ok" : "warn"],
    [core.parsed?.thread_system === "METRIC_ISO" ? "ISO 1502" : (core.parsed?.thread_system === "BSPP_ISO228" ? "ISO 228-2" : "Motor verificación"), `${auditStatus(core.iso1502?.ok)} · clave ${core.iso1502?.key || "-"} · ${core.iso1502?.status || core.iso1502?.error || "-"}`, core.iso1502?.ok ? "ok" : "warn"],
    [core.parsed?.thread_system === "METRIC_ISO" ? "Tabla ISO1502 usada" : "Tabla normativa usada", core.iso1502?.table?.row?.id || core.iso1502?.detail?.table?.row?.id || core.iso1502?.key || "No aplicada / no encontrada", core.iso1502?.ok ? "ok" : "warn"],
    [labels.pass, mm(v.d2Pass), v.d2Pass ? "ok" : "warn"],
    [labels.noPass, mm(v.d2NoPass), v.d2NoPass ? "ok" : "warn"],
    ["Rodillo TMP", v.rodillo ? `Ø ${v.rodillo} mm` : "Pendiente", v.rodillo ? "ok" : "warn"],
    ["Corrección Trimos", mm(v.correction,9), v.correction ? "ok" : "warn"],
    ["Objetivo PASA Trimos", mm(v.passTarget), v.passTarget ? "ok" : "warn"],
    ["Objetivo NO PASA Trimos", mm(v.noPassTarget), v.noPassTarget ? "ok" : "warn"],
    ["Primer punto a revisar", (firstRealIssue?.step || "Sin fallo en cadena normativa"), firstRealIssue ? "warn" : "ok"],
    ["Avisos", (core.warnings || []).join("\n") || "Sin avisos", (core.warnings || []).length ? "warn" : "ok"]
  ];
  $("#rows").innerHTML = rows.map(r=>`<tr><th>${esc(r[0])}</th><td class="${r[2]}">${esc(r[1])}</td></tr>`).join("");

  const chainRows = chain.map(c => [
    c.step,
    `${auditStatus(c.ok)}${c.version ? " · " + c.version : ""}${c.error ? " · " + c.error : ""}`,
    c.ok ? "ok" : "warn"
  ]);
  const extraRows = [
    ["Banco", itemSummary(t.selected_bank), t.selected_bank ? "ok" : "warn"],
    ["Rodillos patrón", itemSummary(t.selected_rollers), t.selected_rollers?.compatible ? "ok" : "warn"],
    ["Patrón rosca", itemSummary(t.selected_master), t.selected_master?.compatible ? "ok" : "warn"],
    ["Score trazabilidad", `${t.score?.total ?? 0}/${t.score?.max ?? 400} (${t.score?.percent ?? 0}%)`, (t.score?.total ?? 0) >= 300 ? "ok" : "warn"]
  ];
  $("#diagRows").innerHTML = [...chainRows, ...extraRows].map(r=>`<tr><th>${esc(r[0])}</th><td class="${r[2]||""}">${esc(r[1])}</td></tr>`).join("");
  $("#json").textContent = JSON.stringify(core,null,2);
}


$("#primaryBtn").addEventListener("click", async ()=>{
  if(step===0){ await resolve(false); setStep(1); }
  else if(step===1){ setStep(2); }
  else if(step===2){ setStep(3); }
  else if(step===3){ setStep(4); setTimeout(()=>{ const first=$("#pass-reading-0"); if(first) first.focus(); },100); }
  else if(step===6){
    await resolve(true);
    const dec = core?.summary?.global_decision || "Pendiente";
    const fb=$("#finalBox");
    if(fb){
      fb.className = "result-hero " + (dec === "NOK" ? "bad" : dec === "OK" ? "" : "warn");
      fb.innerHTML = `<div class="result-symbol">${dec==="NOK"?"✕":dec==="OK"?"✓":"○"}</div><div><div class="result-title">${esc(dec)}</div><div class="result-sub">${dec==="OK"?"El equipo es APTO según Core V91. Revisa trazabilidad y genera certificado si está permitido.":dec==="NOK"?"El equipo es NO APTO según Core V91. Genera informe NOK.":"Resultado pendiente o incompleto."}</div></div>`;
    }
    $("#chip").textContent = dec;
    $("#chip").className = "chip " + (dec==="OK"?"ok":dec==="NOK"?"bad":"");
  }
});
$("#backBtn").addEventListener("click",()=>setStep(step-1));
$("#saveReadingBtn").addEventListener("click",saveReading);
$("#techBtn").addEventListener("click",()=>document.body.classList.toggle("show-tech"));
["saveCalibrationBtn","pdfCertificateBtn","nokReportBtn"].forEach(id=>{
  const btn=$("#"+id);
  if(btn) btn.addEventListener("click",()=>{
    if(btn.id === "saveCalibrationBtn") downloadMT16Json();
    else if(btn.id === "certificateBtn") openPrintableCertificate("CERTIFICADO");
    else if(btn.id === "nokReportBtn") openPrintableCertificate("NOK");
    else showToast("Acción preparada.", "ok");
  });
});
async function runEquipmentSearch(){
  $("#codigo").value=$("#equipmentSearch").value.trim();
  try{
    await loadRealEquipmentFromSupabase();
    await resolve(false);
    setStep(1);
  }catch(err){
    setStep(0);
    setTxt("message", err.message || String(err));
    console.error(err);
  }
}
$("#equipmentSearch").addEventListener("keydown",async e=>{ if(e.key==="Enter") runEquipmentSearch(); });
$("#equipmentSearchBtn").addEventListener("click",runEquipmentSearch);
document.addEventListener("keydown",ev=>{if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==="k"){ev.preventDefault();$("#equipmentSearch").focus();}});
setStep(0);
setTxt("message", "Busca un código real de Supabase. MT16 no calcula hasta resolver equipo y familia.");
$("#equipmentSearch").focus();
