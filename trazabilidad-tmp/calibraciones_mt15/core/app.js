
import { ensureSupabase as conectarSupabase } from "./supabase_client.js";
/* ========= CONFIG SUPABASE ========= */
/* ========= ESTADO ========= */
const state = {
  online: false,
  instrumento: null,
  patrones: [],
  patronesSeleccionados: [],
  puntosPage: { patronId:null, from:0, size:1000, cache:[] },
  plan: [],
  mediciones: {},
  resultados: {}
};

/* ========= UTILIDADES ========= */
const $ = q => document.querySelector(q);
const $$ = q => Array.from(document.querySelectorAll(q));
const fmt = (n,d=3) => Number(n).toFixed(d);
const parseNum = (v) => {
  if (typeof v === 'number') return v;
  if (v===null || v===undefined) return 0;
  const n = Number(String(v).trim().replace(',','.'));
  return Number.isFinite(n)? n : 0;
};
const uid = () => Math.random().toString(36).slice(2,9);
const fechaISO = s => { if(!s) return null; const d=new Date(s); return Number.isNaN(+d)? null : d; };
const setBadge = ok => {
  const b = $("#onlineBadge");
  b.textContent = ok ? "Online (Supabase)" : "Offline";
  b.classList.toggle("online", ok);
  b.classList.toggle("offline", !ok);
  state.online = ok;
};

/* ========= MODO LOCAL ========= */
if (location.protocol === "file:") $("#localBanner").classList.add("show");

/* ========= SUPABASE ========= */
let supabase = null;

async function ensureSupabase() {
  supabase = await conectarSupabase(setBadge);
  return supabase;
}

/**
 * Actualiza en la tabla instrumentos:
 *  - fecha_calibracion
 *  - fecha_proxima_calibracion
 *  - estado (opcional)
 */
async function actualizarFechasEnSupabase(instrumentoId, fechaCal, proxCal) {
  const client = await ensureSupabase();
  if (!client) return false;

  if (!instrumentoId) {
    console.error("No se recibió instrumentoId para actualizar fechas");
    return false;
  }

  const { data, error } = await client
    .from("instrumentos")
    .update({
      fecha_calibracion: fechaCal,
      fecha_proxima_calibracion: proxCal
    })
    .eq("id", instrumentoId)
    .select("id");

  if (error) {
    console.error("Error Supabase actualizando fechas:", error);
    return false;
  }

  if (!data || data.length === 0) {
    console.warn("No se actualizó ninguna fila en instrumentos");
    return false;
  }

  console.log("Fechas actualizadas en instrumento:", data[0].id);
  return true;
}

/* ========= CARGA INSTRUMENTO ========= */
async function cargarInstrumento(){
  const codigo = $("#insCodigo").value.trim();
  if (!codigo) {
    alert("Teclea un código de instrumento.");
    return;
  }
  await ensureSupabase();

  let inst=null;
  if (supabase){
    const { data, error } = await supabase
      .from("instrumentos")
      .select("*")
      .eq("codigo", codigo)
      .maybeSingle();
    if (error) console.warn(error);
    inst=data;
  } else {
    // Modo demo/offline
    inst={
      codigo,
      descripcion:"Tampón liso P/NP",
      fabricante_tipo:"N/A",
      rango:"Ø8 H7",
      unidad_base:"mm",
      fecha_calibracion:"2024-11-03",
      fecha_proxima_calibracion:"2025-11-03"
    };
  }

  if (!inst){
    alert("Instrumento no encontrado en Supabase.");
    return;
  }

  state.instrumento = {
    ...inst,
    id: inst.id ?? inst.instrumento_id ?? inst.uuid ?? null
  };

  if (!state.instrumento.id) {
    alert("Instrumento cargado sin ID válido. Revisa Supabase.");
    return;
  }

  pintarInstrumento();

  await cargarPatrones();

  state.plan=[]; state.mediciones={}; state.resultados={};
  $("#planBloques").innerHTML=""; $("#medicionBloques").innerHTML=""; $("#resultadosBox").innerHTML="";
  $("#resumenInstrumento").textContent = "(Pendiente de cálculo de resultados)";
  $("#resumenGlobalBox").textContent = "(Pendiente de cálculo de resultados)";
  $("#trazabilidadBox").textContent = "(Pendiente de cálculo de resultados)";
  $("#patronesSelChips").innerHTML=""; state.patronesSeleccionados=[];
  alert("Instrumento cargado correctamente.");
}

function pintarInstrumento(){
  const ins=state.instrumento||{};
  $("#insDescripcion").value = ins.descripcion||"";
  $("#insFabTipo").value = ins.fabricante_tipo||"";
  $("#insRango").value = ins.rango||"";
  $("#unidadBase").value = ins.unidad_base||"mm";

  const fechaCal = ins.fecha_calibracion ?? ins.fecha_ultima_cal ?? null;
  const proxCal = ins.fecha_proxima_calibracion ?? null;

  $("#insUltima").value = fechaCal || "—";
  $("#insProx").value = proxCal || "—";

  const est = $("#insEstado");
  let cl="ok", txt="OK";
  const prox = fechaISO(proxCal);
  const hoy = new Date();
  if (prox && hoy>prox){ cl="bad"; txt="FUERA"; }
  else if (prox && (+prox - +hoy) < 1000*60*60*24*30){ cl="warn"; txt="PRÓXIMA"; }
  est.className="status "+cl; est.textContent=txt;
}

/* ========= CATALOGO DE PATRONES ========= */
async function cargarPatrones(){
  await ensureSupabase();
  if (supabase){
    const { data, error } = await supabase
      .from("patrones")
      .select("*")
      .order("descripcion",{ascending:true});
    if (error) console.warn(error);
    state.patrones = data||[];
  } else {
    state.patrones = [
      {id:"1288", codigo:"1288", descripcion:"Banco TRIMOS TELMA 500 — Máquina de una coordenada horizontal", u_k2:0.002, nota:"—"},
      {id:"180456", codigo:"180456", descripcion:"Juego de bloques patrón 0–100 mm", u_k2:0.001, nota:"—"}
    ];
  }
}

/* ========= DIALOGO PATRONES (MULTI) ========= */
$("#btnSelPatrones").addEventListener("click", async ()=>{
  if (!state.patrones.length) await cargarPatrones();
  const dlg=$("#dlgPatrones"), rows=$("#patronRows"), filter=$("#patronFilter");
  const draw=()=>{
    const f=(filter.value||"").toLowerCase();
    rows.innerHTML = state.patrones
      .filter(p=> !f || (p.descripcion||"").toLowerCase().includes(f) || (p.codigo||"").toLowerCase().includes(f))
      .map(p=>`
        <tr class="sel-row">
          <td><input type="checkbox" value="${p.id}"></td>
          <td>${p.codigo||p.id}</td>
          <td>${p.descripcion||"—"}</td>
          <td>${fmt(p.u_k2??0.002)}</td>
          <td>${p.nota||"—"}</td>
        </tr>`).join('');
  };
  draw(); filter.oninput=draw;
  dlg.showModal();

  $("#cancelPatrones").onclick=()=>dlg.close();
  $("#okPatrones").onclick=()=>{
    const ids = Array.from(rows.querySelectorAll('input[type="checkbox"]:checked')).map(x=>x.value);
    if (!ids.length) {
      alert("Selecciona al menos un patrón.");
      return;
    }
    state.patronesSeleccionados = state.patrones.filter(p=> ids.includes(String(p.id)));
    $("#patronesSelChips").innerHTML = state.patronesSeleccionados
      .map(p=>`<span class="chip">${p.codigo||p.id} · ${p.descripcion}</span>`).join('');
    dlg.close();
  };
});

/* ========= ELECCIÓN PATRÓN CUANDO HAY VARIOS ========= */
async function elegirUnoDeSeleccionados(){
  return await new Promise(res=>{
    const options = state.patronesSeleccionados
      .map((p,i)=>`${i+1}. ${p.codigo||p.id} · ${p.descripcion}`).join('\n');
    const ans = prompt(`Hay varios patrones seleccionados. Indica el número:\n${options}\n\n`, "1");
    const idx = parseInt(ans,10)-1;
    if (Number.isFinite(idx) && idx>=0 && idx<state.patronesSeleccionados.length) res(state.patronesSeleccionados[idx]);
    else res(null);
  });
}

/* ========= SELECTOR DE PUNTOS ========= */
function mapPoint(p){
  return {
    id: p.id || p.uuid || p.pk || uid(),
    valor_nominal: parseNum(p.valor_nominal ?? p.nominal_mm ?? p.nominal ?? 0),
    u_k2: parseNum(p.u_k2 ?? p.u_patron ?? 0),
    correccion_patron: parseNum(p.correccion_patron ?? p.correccion ?? 0),
    caracteristica: p.caracteristica || p.tipo_medicion || ""
  };
}

async function dialogSelectPuntosExactos(patronId){
  await ensureSupabase();
  const dlg=$("#dlgPuntos"),
        rows=$("#puntosRows"),
        input=$("#puntoSearchExacto"),
        btnBuscar=$("#btnBuscarPunto"),
        btnMas=$("#btnCargarMas");

  state.puntosPage = { patronId, from:0, size:1000, cache:[] };

  const draw = () => {
    const puntos = state.puntosPage.cache;
    rows.innerHTML = puntos.map((p,i)=>`
      <tr>
        <td><input type="checkbox" value="${p.id}"></td>
        <td>${i+1}</td>
        <td>${fmt(p.valor_nominal)}</td>
        <td>${fmt(p.u_k2)}</td>
        <td>${fmt(p.correccion_patron)}</td>
        <td>${p.caracteristica||"—"}</td>
      </tr>`).join('');
  };

  async function loadPage(){
    if (!supabase){
      state.puntosPage.cache = [
        {id:patronId+"_0",valor_nominal:8.000,u_k2:0.002,correccion_patron:0,caracteristica:"Interpolado automático"}
      ];
      draw(); return;
    }
    const { from, size } = state.puntosPage;
    const { data, error } = await supabase
      .from("proc_puntos")
      .select("*")
      .eq("patron_id", patronId)
      .order("valor_nominal",{ascending:true})
      .range(from, from+size-1);
    if (error) { console.warn(error); return; }
    state.puntosPage.from += size;
    state.puntosPage.cache = (state.puntosPage.cache||[]).concat((data||[]).map(mapPoint));
    draw();
  }

  async function buscarExacto(){
    const str = input.value.trim().replace(',','.');
    if (!str) { alert("Introduce un nominal exacto (ej. 8.001)"); return; }
    const exact = Number(str);
    if (!Number.isFinite(exact)) { alert("Valor no válido."); return; }
    const { data, error } = await supabase
      .from("proc_puntos")
      .select("*")
      .eq("patron_id", patronId)
      .eq("valor_nominal", exact)
      .order("valor_nominal",{ascending:true})
      .limit(50);
    if (error) { console.warn(error); return; }
    const list = (data||[]).map(mapPoint);
    state.puntosPage.cache = list; draw();
    if (!list.length) alert("No existe ese nominal exacto para este patrón.");
  }

  dlg.showModal();
  rows.innerHTML="";
  await loadPage();
  btnMas.onclick=loadPage;
  btnBuscar.onclick=buscarExacto;

  return await new Promise(res=>{
    $("#cancelPuntos").onclick=()=>{ dlg.close(); res(null); };
    $("#okPuntos").onclick=()=>{
      const ids = Array.from(rows.querySelectorAll('input[type="checkbox"]:checked')).map(x=>x.value);
      if (!ids.length) {
        alert("Selecciona al menos un punto.");
        return;
      }
      const sel = state.puntosPage.cache.filter(p=> ids.includes(String(p.id)));
      dlg.close(); res(sel);
    };
  });
}

/* ========= PLAN: Añadir bloque ========= */
$$('button[data-addblock]').forEach(b=>{
  b.addEventListener("click", async ()=>{
    if (!state.instrumento) { alert("Carga un instrumento primero."); return; }
    if (!state.patronesSeleccionados.length) { alert("Selecciona primero 1 o varios patrones."); return; }

    const patron = (state.patronesSeleccionados.length===1)
      ? state.patronesSeleccionados[0]
      : await elegirUnoDeSeleccionados();
    if (!patron) return;

    const puntos = await dialogSelectPuntosExactos(patron.id);
    if (!puntos?.length) return;

    const bloque = {
      id: uid(),
      tipo: b.dataset.addblock,
      patron,
      puntos,
      nombrePatron: `${patron.codigo||patron.id} · ${patron.descripcion}`,
      lado: ($("#ladoMed") ? $("#ladoMed").value : "GO")
    };
    state.plan.push(bloque);
    renderPlan();
    renderMedicion();
  });
});

/* ========= RENDER PLAN ========= */
function renderPlan(){
  const box=$("#planBloques");
  if (!state.plan.length){
    box.innerHTML=`<p class="note">No hay bloques. Añade alguno con los botones superiores.</p>`;
    return;
  }
  box.innerHTML = state.plan.map(b=>`
    <div class="card" style="margin-top:10px">
      <div class="row">
        <div class="pill">${b.tipo}</div>
        <div class="chip">${b.nombrePatron}</div>
        <div class="chip">
          Lado GO/NO GO:
          <select class="lado-bloque" data-bid="${b.id}">
            <option value="GO" ${(b.lado||"GO")==="GO" ? "selected" : ""}>GO</option>
            <option value="NOGO" ${(b.lado||"GO")==="NOGO" ? "selected" : ""}>NO GO</option>
          </select>
        </div>
        <span class="right mini muted">${b.puntos.length} punto(s) seleccionados</span>
      </div>
      <div class="table-box mt-8">
        <table>
          <thead><tr><th>#</th><th>Nominal</th><th>U(k=2)</th><th>Corrección</th><th>Caract.</th></tr></thead>
          <tbody>
            ${b.puntos.map((p,i)=>`
              <tr>
                <td>${i+1}</td>
                <td>${fmt(p.valor_nominal)}</td>
                <td>${fmt(p.u_k2)}</td>
                <td>${fmt(p.correccion_patron)}</td>
                <td>${p.caracteristica||"—"}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `).join('');

  $$('#planBloques select.lado-bloque').forEach(sel => {
    sel.addEventListener('change', () => {
      const bloque = state.plan.find(b => b.id === sel.dataset.bid);
      if (bloque) bloque.lado = sel.value;
    });
  });
}

/* ========= MEDICION ========= */
function renderMedicion(){
  const box=$("#medicionBloques");
  if (!state.plan.length){
    box.innerHTML=`<p class="note">Primero define el plan (bloques y puntos).</p>`;
    return;
  }
  box.innerHTML = state.plan.map(b=>{
    const filas = b.puntos.map(p=>{
      const key=`${b.id}|${p.id}`;
      const med=state.mediciones[key]||{r:[null,null,null,null,null],media:null,s:null};
      return `
        <tr data-key="${key}">
          <td>${p.valor_nominal.toFixed(3)}</td>
          ${[0,1,2,3,4].map(i=>`
            <td>
              <input class="rep" data-idx="${i}" type="text" inputmode="decimal"
                     placeholder="—" value="${med.r[i]??""}">
            </td>`).join('')}
          <td class="media">${med.media??"0.000"}</td>
          <td class="s">${med.s??"0.000"}</td>
        </tr>`;
    }).join('');
    return `
      <div class="card" style="margin-top:12px">
        <div class="row">
          <div class="pill">${b.tipo}</div>
          <div class="chip">${b.nombrePatron}</div>
        </div>
        <div class="table-box mt-8">
          <table>
            <thead>
              <tr>
                <th>Nominal (ref. patrón exacto)</th>
                <th>R1</th><th>R2</th><th>R3</th><th>R4</th><th>R5</th>
                <th>Media</th><th>σ</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
      </div>`;
  }).join('');

  $$("#medicionBloques input.rep").forEach(inp=>{
    inp.addEventListener('input',()=>{ inp.value = inp.value.replace(',', '.'); });
    inp.addEventListener('change',()=>{
      const tr=inp.closest('tr');
      const key=tr.dataset.key;
      const idx=+inp.dataset.idx;
      const med=state.mediciones[key]||{r:[null,null,null,null,null]};
      med.r[idx]=parseNum(inp.value);
      const vals=med.r.filter(x=>typeof x==='number'&&isFinite(x));
      const n=vals.length;
      const media=n? (vals.reduce((a,b)=>a+b,0)/n) : 0;
      const s=n>1? Math.sqrt(vals.reduce((a,b)=>a+(b-media)**2,0)/(n-1)) : 0;
      med.media=fmt(media);
      med.s=fmt(s);
      state.mediciones[key]=med;
      tr.querySelector('.media').textContent=med.media;
      tr.querySelector('.s').textContent=med.s;
    });
  });
}

/* ========= GUARDAR MEDICIONES ========= */
$("#btnGuardarMed").addEventListener("click",()=>{
  const codigo=$("#insCodigo").value.trim();
  if (!codigo){
    alert("Introduce el código del instrumento para asociar las mediciones.");
    return;
  }
  localStorage.setItem(`mediciones:${codigo}`, JSON.stringify(state.mediciones));
  alert("Mediciones guardadas localmente.");
});

$("#goResultados").addEventListener("click",()=>{
  calcularResultados();
  switchTab('resultados');
});

/* ========= RESULTADOS + INFORME ========= */
function calcularResultados(){
  const ladoGlobal=$("#ladoMed").value;
  const nominalGO=parseNum($("#nominalGO").value);
  const nominalNOGO=parseNum($("#nominalNOGO").value);
  const ref=$("#refError").value;
  const tol=parseNum($("#tolGlobal").value);
  const uBase=parseNum($("#uBase").value);

  const box=$("#resultadosBox");
  if (!state.plan.length){
    box.innerHTML=`<p class="note">No hay plan definido.</p>`;
    return;
  }

  let html="";
  let maxAbsError = 0;
  let maxAbsErrorPlusU = 0;
  let totalPuntos = 0;
  let hayNoApto = false;
  let hayIndeterminado = false;

  for (const b of state.plan){
    const ladoBloque = b.lado || ladoGlobal;
    const nominalBloque = (ladoBloque === "GO" ? nominalGO : nominalNOGO);

    html += `
      <div class="card" style="margin-top:12px">
        <div class="row">
          <div class="pill">${b.tipo}</div>
          <div class="chip">${b.nombrePatron}</div>
          <span class="right mini muted">
            Nominal bloque (${ladoBloque}): ${fmt(nominalBloque)} mm
          </span>
        </div>
        <div class="table-box mt-8">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nominal patrón (mm)</th>
                <th>Corrección (µm)</th>
                <th>Media (mm)</th>
                <th>Error (µm)</th>
                <th>U_total (µm)</th>
                <th>Tolerancia (µm)</th>
                <th>Decisión</th>
              </tr>
            </thead>
            <tbody>
    `;

    b.puntos.forEach((p,i)=>{
      const key=`${b.id}|${p.id}`;
      const med=state.mediciones[key]||{};
      const media=parseNum(med.media);

      let refVal = (ref==="patron") ? p.valor_nominal : nominalBloque;

      const error = (media - refVal)*1000;     // µm
      const U = (uBase*1000);                  // µm
      const T = tol*1000;                      // µm
      const absE = Math.abs(error);
      const absEplusU = absE + U;

      if (absE > maxAbsError) maxAbsError = absE;
      if (absEplusU > maxAbsErrorPlusU) maxAbsErrorPlusU = absEplusU;
      totalPuntos++;

      const decision = (absE + U <= T)
        ? "APTO"
        : ((absE - U > T) ? "NO APTO" : "INDETERMINADO");

      if (decision==="NO APTO") hayNoApto = true;
      if (decision==="INDETERMINADO") hayIndeterminado = true;
      const badge = decision==="APTO" ? "success"
                 : decision==="NO APTO" ? "danger"
                 : "";

      html += `
        <tr>
          <td>${i+1}</td>
          <td>${fmt(p.valor_nominal)}</td>
          <td>${fmt(p.correccion_patron*1000,3)}</td>
          <td>${fmt(media)}</td>
          <td>${fmt(error,1)}</td>
          <td>${fmt(U,1)}</td>
          <td>${fmt(T,1)}</td>
          <td><span class="pill ${badge}">${decision}</span></td>
        </tr>`;
    });

    html += `
            </tbody>
          </table>
        </div>
      </div>`;
  }

  box.innerHTML=html;

  // 1. Ficha instrumento
  const ins = state.instrumento || {};
  const resumenInst = `
    <p class="mini">
      <strong>Código:</strong> ${ins.codigo || "-"} ·
      <strong>Descripción:</strong> ${ins.descripcion || "-"} ·
      <strong>Fabricante / Tipo:</strong> ${ins.fabricante_tipo || "-"}<br>
      <strong>Rango de medida:</strong> ${ins.rango || "-"} ·
      <strong>Unidad base:</strong> ${ins.unidad_base || "mm"}<br>
      <strong>Última calibración registrada:</strong> ${ins.fecha_ultima_cal || ins.fecha_calibracion || "-"} ·
      <strong>Próxima calibración registrada:</strong> ${ins.fecha_proxima_calibracion || "-"}
    </p>
  `;
  $("#resumenInstrumento").innerHTML = resumenInst;

  // 5. Resumen global
  let decisionGlobal = "APTO";
  if (hayNoApto) decisionGlobal = "NO APTO";
  else if (hayIndeterminado) decisionGlobal = "INDETERMINADO";

  const resumenGlobal = `
    <p class="mini">
      <strong>Número de bloques:</strong> ${state.plan.length} ·
      <strong>Número total de puntos evaluados:</strong> ${totalPuntos}<br>
      <strong>Máx |E| (µm):</strong> ${fmt(maxAbsError,1)} ·
      <strong>Máx (|E| + U) (µm):</strong> ${fmt(maxAbsErrorPlusU,1)} ·
      <strong>Tolerancia global (µm):</strong> ${fmt(tol*1000,1)}<br>
      <strong>Decisión global según ILAC-G8:</strong>
      <span class="pill ${decisionGlobal==="APTO"?"success":(decisionGlobal==="NO APTO"?"danger":"")}">
        ${decisionGlobal}
      </span>
    </p>
  `;
  $("#resumenGlobalBox").innerHTML = resumenGlobal;

  // 6. Trazabilidad
  const patronesTxt = (state.patronesSeleccionados||[])
    .map(p=>`${p.codigo||p.id} · ${p.descripcion||""}`)
    .join("; ");
  const traz = `
    <p class="mini">
      La trazabilidad metrológica se garantiza mediante el uso de patrones materializados cuyo estado de calibración
      se controla en el sistema de gestión de patrones del laboratorio TMP. Para esta calibración se han utilizado
      los siguientes patrones:<br>
      <strong>Patrones empleados:</strong> ${patronesTxt || "No informado"}.
    </p>
    <p class="mini">
      Los valores indicados de corrección del patrón (columna "Corrección") proceden del certificado de calibración
      o, en puntos intermedios, de la interpolación matemática aplicada por el laboratorio. La incertidumbre informada
      corresponde a la incertidumbre expandida U(k=2), con un nivel de confianza aproximado del 95 %.
    </p>
  `;
  $("#trazabilidadBox").innerHTML = traz;

  // Gráfica
  dibujarGraficaErrores();
}

/* ========= GRÁFICA DE ERRORES (primer bloque) ========= */
function dibujarGraficaErrores(){
  const canvas = document.getElementById("grafErrores");
  if (!canvas) return;
  const ctxG = canvas.getContext("2d");
  ctxG.clearRect(0,0,canvas.width,canvas.height);
  const bloque = state.plan[0];
  if (!bloque) {
    ctxG.fillStyle="#9eb9cf";
    ctxG.font="12px Inter";
    ctxG.fillText("Sin datos de bloques.", 10, 20);
    return;
  }

  const ladoGlobal=$("#ladoMed").value;
  const nominalGO=parseNum($("#nominalGO").value);
  const nominalNOGO=parseNum($("#nominalNOGO").value);
  const ref=$("#refError").value;
  const uBase=parseNum($("#uBase").value);
  const tol=parseNum($("#tolGlobal").value);
  const ladoBloque = bloque.lado || ladoGlobal;

  const puntosGraf = [];
  bloque.puntos.forEach(p=>{
    const key=`${bloque.id}|${p.id}`;
    const med=state.mediciones[key]||{};
    const media=parseNum(med.media);
    let refVal = (ref==="patron") ? p.valor_nominal
                                  : (ladoBloque==="GO" ? nominalGO : nominalNOGO);
    const error = (media - refVal)*1000;
    puntosGraf.push({x:p.valor_nominal, y:error});
  });

  if (!puntosGraf.length){
    ctxG.fillStyle="#9eb9cf";
    ctxG.font="12px Inter";
    ctxG.fillText("Sin mediciones en el primer bloque.", 10, 20);
    return;
  }

  const margin = {left:40,right:10,top:10,bottom:25};
  const xs = puntosGraf.map(p=>p.x);
  const ys = puntosGraf.map(p=>p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const maxAbsY = Math.max(...ys.map(v=>Math.abs(v)), tol*1000, uBase*1000);
  const minY = -maxAbsY;
  const maxY =  maxAbsY;

  const sx = v => margin.left +
    ((v-minX)/(maxX-minX || 1)) *
    (canvas.width - margin.left - margin.right);

  const sy = v => margin.top +
    ((maxY-v)/(maxY-minY || 1)) *
    (canvas.height - margin.top - margin.bottom);

  // marco
  ctxG.strokeStyle="#2a4f74";
  ctxG.lineWidth=1;
  ctxG.strokeRect(
    margin.left,
    margin.top,
    canvas.width-margin.left-margin.right,
    canvas.height-margin.top-margin.bottom
  );

  // eje 0
  const y0 = sy(0);
  ctxG.strokeStyle="#3f6fa3";
  ctxG.beginPath();
  ctxG.moveTo(margin.left,y0);
  ctxG.lineTo(canvas.width-margin.right,y0);
  ctxG.stroke();

  // tolerancias
  const yTolUp = sy(tol*1000);
  const yTolDown = sy(-tol*1000);
  ctxG.strokeStyle="#66501d";
  ctxG.setLineDash([4,3]);
  ctxG.beginPath();
  ctxG.moveTo(margin.left,yTolUp);
  ctxG.lineTo(canvas.width-margin.right,yTolUp);
  ctxG.stroke();
  ctxG.beginPath();
  ctxG.moveTo(margin.left,yTolDown);
  ctxG.lineTo(canvas.width-margin.right,yTolDown);
  ctxG.stroke();
  ctxG.setLineDash([]);

  ctxG.fillStyle="#9eb9cf";
  ctxG.font="10px Inter";
  ctxG.fillText("Error (µm)", margin.left+4, margin.top+10);
  ctxG.fillText("Nominal patrón (mm)", canvas.width/2-40, canvas.height-5);

  // puntos
  ctxG.fillStyle="#58a6ff";
  puntosGraf.forEach(p=>{
    const x = sx(p.x);
    const y = sy(p.y);
    ctxG.beginPath();
    ctxG.arc(x,y,3,0,Math.PI*2);
    ctxG.fill();
  });
}

/* ========= FUNCIONES AUXILIARES PARA JSON COMPLETO ========= */
function calcularDecisionILAC(errorUm, uUm, tUm) {
  const absE = Math.abs(parseNum(errorUm));
  const U = parseNum(uUm);
  const T = parseNum(tUm);

  if (absE + U <= T) return "APTO";
  if (absE - U > T) return "NO APTO";
  return "INDETERMINADO";
}

function obtenerContextoCalibracion() {
  return {
    ladoGlobal: $("#ladoMed").value,
    nominalGO: parseNum($("#nominalGO").value),
    nominalNOGO: parseNum($("#nominalNOGO").value),
    refError: $("#refError").value,
    tolGlobalMm: parseNum($("#tolGlobal").value),
    uBaseMm: parseNum($("#uBase").value)
  };
}

function construirPuntoResultado(bloque, punto, ctxCal) {
  const key = `${bloque.id}|${punto.id}`;
  const med = state.mediciones[key] || {};

  const media = med.media !== undefined && med.media !== null && med.media !== ""
    ? Number(med.media)
    : null;

  const sigma = med.s !== undefined && med.s !== null && med.s !== ""
    ? Number(med.s)
    : null;

  const ladoBloque = bloque.lado || ctxCal.ladoGlobal;
  const nominalBloque = (ladoBloque === "GO") ? ctxCal.nominalGO : ctxCal.nominalNOGO;
  const refVal = (ctxCal.refError === "patron") ? punto.valor_nominal : nominalBloque;

  let error = null;
  let U = null;
  let T = null;
  let decision = null;

  if (media !== null) {
    error = (media - refVal) * 1000;            // µm
    U = ctxCal.uBaseMm * 1000;                  // µm
    T = ctxCal.tolGlobalMm * 1000;              // µm
    decision = calcularDecisionILAC(error, U, T);
  }

  return {
    id: punto.id,
    nominal: punto.valor_nominal,
    referencia_utilizada: refVal,
    correccion_patron: punto.correccion_patron,
    caracteristica: punto.caracteristica || "",
    repeticiones: Array.isArray(med.r) ? med.r.filter(v => v !== null && v !== "" && Number.isFinite(Number(v))) : [],
    media,
    sigma,
    error,
    U,
    T,
    decision
  };
}

function resumirBloqueResultado(bloque, puntosResultado) {
  const errores = puntosResultado
    .map(pt => typeof pt.error === "number" ? Math.abs(pt.error) : null)
    .filter(v => v !== null);

  const erroresMasU = puntosResultado
    .map(pt => (typeof pt.error === "number" && typeof pt.U === "number")
      ? Math.abs(pt.error) + pt.U
      : null)
    .filter(v => v !== null);

  const tolerancias = puntosResultado
    .map(pt => typeof pt.T === "number" ? pt.T : null)
    .filter(v => v !== null);

  const decisiones = puntosResultado
    .map(pt => pt.decision)
    .filter(Boolean);

  let decisionBloque = null;
  if (decisiones.includes("NO APTO")) decisionBloque = "NO APTO";
  else if (decisiones.includes("INDETERMINADO")) decisionBloque = "INDETERMINADO";
  else if (decisiones.includes("APTO")) decisionBloque = "APTO";

  return {
    id: bloque.id,
    tipo: bloque.tipo,
    nombre: bloque.tipo,
    lado: bloque.lado,
    patron: {
      id: bloque.patron.id,
      codigo: bloque.patron.codigo,
      descripcion: bloque.patron.descripcion,
      u_k2: bloque.patron.u_k2
    },
    max_abs_error_um: errores.length ? Math.max(...errores) : null,
    max_abs_error_plus_u_um: erroresMasU.length ? Math.max(...erroresMasU) : null,
    tolerancia_um: tolerancias.length ? Math.max(...tolerancias) : null,
    decision: decisionBloque,
    puntos: puntosResultado
  };
}

function construirResumenGlobalJSON(bloquesResultado, ctxCal) {
  const maxErrores = [];
  const maxErroresMasU = [];
  const decisiones = [];
  let totalPuntos = 0;

  bloquesResultado.forEach(b => {
    if (typeof b.max_abs_error_um === "number") maxErrores.push(b.max_abs_error_um);
    if (typeof b.max_abs_error_plus_u_um === "number") maxErroresMasU.push(b.max_abs_error_plus_u_um);
    if (b.decision) decisiones.push(b.decision);
    totalPuntos += Array.isArray(b.puntos) ? b.puntos.length : 0;
  });

  let decisionGlobal = "APTO";
  if (decisiones.includes("NO APTO")) decisionGlobal = "NO APTO";
  else if (decisiones.includes("INDETERMINADO")) decisionGlobal = "INDETERMINADO";

  return {
    numero_bloques: bloquesResultado.length,
    total_puntos: totalPuntos,
    max_abs_error_um: maxErrores.length ? Math.max(...maxErrores) : null,
    max_abs_error_plus_u_um: maxErroresMasU.length ? Math.max(...maxErroresMasU) : null,
    tolerancia_um: ctxCal.tolGlobalMm * 1000,
    decision: decisionGlobal,
    bloques: bloquesResultado.map(b => ({
      nombre: b.nombre,
      lado: b.lado,
      patron_codigo: b.patron?.codigo || null,
      puntos: Array.isArray(b.puntos) ? b.puntos.length : 0,
      max_abs_error_um: b.max_abs_error_um,
      max_abs_error_plus_u_um: b.max_abs_error_plus_u_um,
      tolerancia_um: b.tolerancia_um,
      decision: b.decision
    }))
  };
}

/* ========= FUNCIÓN buildCertJSON() ========= */
function buildCertJSON() {
  // Firma manuscrita en base64
  const sigCanvas = document.getElementById("sigPad");
  const firmaBase64 = sigCanvas.toDataURL("image/png");

  // Contexto de calibración
  const ctxCal = obtenerContextoCalibracion();

  // Condiciones ambientales
  const condiciones = {
    temperatura: $("#condTemp").value || null,
    humedad: $("#condHum").value || null,
    fecha_calibracion: $("#condFechaCal").value || null,
    observaciones: $("#condObs").value || "",
    procedimiento: "Calibración por comparación con patrón materializado",
    regla_decision: "ILAC-G8",
    operario: $("#firmanteNombre").value || ""
  };

  // Patrones
  const patrones = (state.patronesSeleccionados || []).map(p => ({
    id: p.id,
    codigo: p.codigo,
    descripcion: p.descripcion,
    u_k2: p.u_k2,
    nota: p.nota || ""
  }));

  // Bloques y puntos con resultados completos
  const bloques = state.plan.map(b => {
    const puntosResultado = b.puntos.map(p => construirPuntoResultado(b, p, ctxCal));
    return resumirBloqueResultado(b, puntosResultado);
  });

  // Resumen global estructurado
  const resumenGlobal = construirResumenGlobalJSON(bloques, ctxCal);

  // Instrumento
  const instrumento = state.instrumento || {};

  // Texto de trazabilidad
  const trazabilidad = (state.patronesSeleccionados || [])
    .map(p => `${p.codigo || p.id} · ${p.descripcion || ""}`)
    .join("; ");

  return {
    certificado: {
      fecha_generacion: new Date().toISOString(),
      norma: "ISO/IEC 17025 · ILAC-G8",
      tipo_documento: "Certificado de calibración"
    },
    instrumento: {
      ...instrumento,
      codigo: instrumento.codigo || "",
      descripcion: instrumento.descripcion || "",
      fabricante_tipo: instrumento.fabricante_tipo || "",
      rango: instrumento.rango || "",
      unidad_base: instrumento.unidad_base || $("#unidadBase").value || "mm",
      fecha_calibracion: instrumento.fecha_calibracion || instrumento.fecha_ultima_cal || null,
      fecha_proxima_calibracion: instrumento.fecha_proxima_calibracion || $("#firmanteProxima").value || null
    },
    condiciones,
    patrones,
    bloques,
    resumen_global: resumenGlobal,
    trazabilidad: trazabilidad
      ? `Patrones empleados: ${trazabilidad}. La trazabilidad metrológica se garantiza mediante patrones materializados controlados por el sistema TMP.`
      : "La trazabilidad metrológica se declara mediante patrones controlados por el sistema TMP.",
    firma: {
      nombre: $("#firmanteNombre").value || "",
      proxima_calibracion: $("#firmanteProxima").value || "",
      firma_base64: firmaBase64
    },
    qr: {
      url_verificacion: null
    },
    regla_decision: "ILAC-G8",
    decision_global: resumenGlobal.decision
  };
}

/* ========= GUARDAR TODO (PDF en navegador + Supabase) ========= */
$("#btnGuardarTodo").addEventListener("click", async () => {
  if (!state.instrumento || !state.instrumento.id) {
    alert("Instrumento no cargado correctamente.");
    return;
  }

  const fechaCal = $("#condFechaCal").value;
  const proxCal = $("#firmanteProxima").value;

  if (!fechaCal || !proxCal) {
    alert("Debe indicar fecha de calibración y próxima calibración.");
    return;
  }

  await ensureSupabase();
  if (!supabase) {
    alert("Supabase no disponible.");
    return;
  }

  const ok = await actualizarFechasEnSupabase(
    state.instrumento.id,
    fechaCal,
    proxCal
  );

  if (!ok) {
    alert("No se pudieron actualizar las fechas del instrumento.");
    return;
  }

  const { data: nuevoInst } = await supabase
    .from("instrumentos")
    .select("*")
    .eq("id", state.instrumento.id)
    .maybeSingle();

  if (nuevoInst) {
    state.instrumento = {
      ...nuevoInst,
      id: nuevoInst.id ?? nuevoInst.instrumento_id ?? nuevoInst.uuid ?? null
    };
    pintarInstrumento();
  }

  alert("✔ Fechas del instrumento actualizadas correctamente.");
});

/* ========= EMITIR CERTIFICADO OFICIAL (backend real) ========= */
function limpiarParaBackend(certJSON) {
  // Copia profunda para no modificar el original
  const copia = JSON.parse(JSON.stringify(certJSON));

  // ⚠️ La firma en base64 NO debe ir dentro del JSON principal
  // (ya se envía aparte en el fetch)
  if (copia.firma && copia.firma.firma_base64) {
    delete copia.firma.firma_base64;
  }

  return copia;
}

$("#btnEmitirOficial").addEventListener("click", async () => {
  console.log("🟢 CLICK en Emitir certificado");

  try {
    console.log("🟡 Antes de buildCertJSON");

    const certJSON = buildCertJSON();
    console.log("🟢 certJSON generado", certJSON);

    if (!certJSON.instrumento?.codigo) {
      alert("Debe cargar un instrumento antes de emitir el certificado oficial.");
      return;
    }

    const ok = confirm("¿Desea emitir el certificado oficial?");
    if (!ok) return;

    console.log("🟡 Antes de limpiarParaBackend");

    const certLimpio = limpiarParaBackend(certJSON);
    console.log("🟢 certLimpio", certLimpio);

    console.log("🟡 JUSTO ANTES DEL FETCH");

    const resp = await fetch(
      "https://tmp-backend-certificados.vercel.app/api/generar-certificado-oficial",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...certLimpio,
          firma_base64: certJSON.firma?.firma_base64 || null
        })
      }
    );

    console.log("🟢 RESPUESTA FETCH", resp);

    const data = await resp.json();
    console.log("🟢 DATA BACKEND", data);

    if (!data.ok) {
      alert("Error backend: " + data.error);
      return;
    }

    alert(
      "CERTIFICADO OFICIAL GENERADO\n\n" +
      "Número: " + data.certificado.numero + "\n" +
      "PDF: " + data.certificado.pdf_url
    );

    window.open(data.certificado.pdf_url, "_blank");

  } catch (err) {
    console.error("🔴 ERROR EN CLICK EMITIR", err);
    alert("Error de red al emitir certificado");
  }
});

/* ========= TABS ========= */
function switchTab(name){
  $$('.tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===name));
  $('#tab-plan').classList.toggle('hidden', name!=='plan');
  $('#tab-medicion').classList.toggle('hidden', name!=='medicion');
  $('#tab-resultados').classList.toggle('hidden', name!=='resultados');
  const anexo = $('#tab-anexo');
  if (anexo) anexo.classList.toggle('hidden', name!=='anexo');
}
$$('.tab').forEach(t=> t.addEventListener('click',()=> switchTab(t.dataset.tab)));

/* ========= FIRMA ========= */
const sigCanvas = document.getElementById('sigPad');
const ctx = sigCanvas.getContext('2d');
ctx.strokeStyle = '#58a6ff';
ctx.lineWidth = 2.2;
ctx.lineCap='round';
let drawing=false, last=null;

function pos(ev){
  const r=sigCanvas.getBoundingClientRect();
  return {x:(ev.clientX-r.left), y:(ev.clientY-r.top)};
}
sigCanvas.addEventListener('mousedown', e=>{
  drawing=true; last=pos(e);
});
sigCanvas.addEventListener('mousemove', e=>{
  if(!drawing) return;
  const p=pos(e);
  ctx.beginPath();
  ctx.moveTo(last.x,last.y);
  ctx.lineTo(p.x,p.y);
  ctx.stroke();
  last=p;
});
sigCanvas.addEventListener('mouseup', ()=>drawing=false);
sigCanvas.addEventListener('mouseleave', ()=>drawing=false);
document.getElementById('sigClear').addEventListener('click', ()=>{
  ctx.clearRect(0,0,sigCanvas.width,sigCanvas.height);
});

/* ========= BOTONES CABECERA ========= */
$("#btnCargar").addEventListener("click", cargarInstrumento);
$("#btnLimpiar").addEventListener("click", ()=>location.reload());

/* ========= ARRANQUE ========= */
setBadge(false);
switchTab('plan');

/* ===========================================================
   ✅✅✅ AUTOLOAD DESDE QR.INFO / URL PARAM (AÑADIDO)
   NO TOCA TU FLUJO: SOLO RELLENA #insCodigo Y DISPARA CARGA
=========================================================== */
function extraerCodigoDesdeURL() {
  try {
    const url = new URL(window.location.href);
    const codigo = url.searchParams.get("codigo");
    if (codigo) return codigo.trim();

    // Si vienen rutas tipo .../11217 o .../qr/11217
    const partes = url.pathname.split("/").filter(Boolean);
    const last = partes[partes.length - 1];
    if (last && !last.includes(".html") && /^\d{2,}$/.test(last)) {
      return decodeURIComponent(last);
    }
  } catch (e) {}
  return "";
}

async function autoloadCodigoDesdeURL() {
  const codigo = extraerCodigoDesdeURL();
  if (!codigo) return;

  const input = $("#insCodigo");
  if (!input) return;

  // Rellenar campo
  input.value = codigo;

  // Espera mínima para que DOM + módulos estén estables
  setTimeout(() => {
    cargarInstrumento();
  }, 120);
}

// Ejecutar autoload al cargar la página
autoloadCodigoDesdeURL();
