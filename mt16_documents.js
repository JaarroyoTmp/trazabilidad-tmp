import './config.mjs';
const box=document.getElementById('mt16-register');
if(box){
 const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 box.innerHTML=`<div class="head"><div><h2>Verificaciones internas MT16</h2><p>Informes emitidos, lecturas originales y resultado del control en servicio.</p></div><button class="btn" id="mt16-reload">Actualizar</button></div><div class="lookup"><input id="mt16-filter" placeholder="Buscar por equipo u operario"><select id="mt16-result"><option value="">Todos los resultados</option><option value="OK">APTO</option><option value="NOK">NO APTO</option></select></div><p id="mt16-status" role="status"></p><div style="overflow:auto"><table><thead><tr><th>Fecha</th><th>Equipo</th><th>Descripción</th><th>Operario</th><th>Resultado</th><th>Documento</th></tr></thead><tbody id="mt16-body"></tbody></table></div><button class="btn" id="mt16-more" hidden>Cargar anteriores</button>`;
 const $=id=>document.getElementById(id);let reloadPending=false,generation=0,data=[],offset=0,loading=false,finished=false,filterTimer;
 const label=r=>r==='OK'?'APTO':r==='NOK'?'NO APTO':'PENDIENTE';
 function render(){const q=$('mt16-filter').value.trim().toLocaleLowerCase('es'),result=$('mt16-result').value;
  const rows=data.filter(r=>(!result||r.resultado===result)&&(!q||[r.equipo_snapshot?.codigo,r.equipo_snapshot?.descripcion,r.datos?.formulario?.operario].some(v=>String(v||'').toLocaleLowerCase('es').includes(q))));
  $('mt16-body').innerHTML=rows.length?rows.map(r=>`<tr><td>${esc(r.datos?.formulario?.fecha||'')}<br><small>Registrado: ${esc(new Date(r.fecha).toLocaleString('es-ES'))}</small></td><td>${esc(r.equipo_snapshot?.codigo)}</td><td>${esc(r.equipo_snapshot?.descripcion)}</td><td>${esc(r.datos?.formulario?.operario)}</td><td>${label(r.resultado)}</td><td><a class="btn" href="mt16_informe.html?id=${encodeURIComponent(r.id)}" target="_blank" rel="noopener">Abrir informe</a></td></tr>`).join(''):'<tr><td colspan="6">No hay verificaciones coincidentes en los registros cargados.</td></tr>';
  $('mt16-status').textContent=`${rows.length} coincidencias · ${data.length} registros cargados${finished?'':' · puedes cargar los anteriores para ampliar la búsqueda'}.`;
 }
 async function load(reset=false){if(loading){if(reset)reloadPending=true;return;}const request=generation;loading=true;$('mt16-reload').disabled=true;$('mt16-more').disabled=true;if(reset){data=[];offset=0;finished=false;$('mt16-body').textContent='';} $('mt16-status').textContent='Consultando verificaciones…';
  try{if(!window.supabase)throw Error('Conexión no disponible');const {data:rows,error}=await window.supabase.from('verificaciones_mt16').select('id,fecha,resultado,equipo_snapshot,datos').order('fecha',{ascending:false}).order('id',{ascending:false}).range(offset,offset+99);if(request!==generation)return;if(error)throw error;data.push(...(rows||[]));offset+=(rows||[]).length;finished=(rows||[]).length<100;render();$('mt16-more').hidden=finished;
  }catch(e){$('mt16-status').textContent='No se pudo consultar MT16: '+(e.message||String(e));}finally{loading=false;$('mt16-reload').disabled=false;$('mt16-more').disabled=false;if(reloadPending){reloadPending=false;load(true);}}
 }
 window.addEventListener('mt16-auth-changed',event=>{generation++;data=[];offset=0;$('mt16-body').textContent='';if(event.detail.signedIn)load(true);else{$('mt16-status').textContent='Inicia sesión para consultar tus informes.';$('mt16-more').hidden=true;}});
 $('mt16-reload').onclick=()=>load(true);$('mt16-more').onclick=()=>load();$('mt16-filter').oninput=()=>{clearTimeout(filterTimer);filterTimer=setTimeout(render,150);};$('mt16-result').onchange=render;load(true);
}
