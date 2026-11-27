import {downloadMT17, listCloudMT17, loadCloudMT17, mt17ReportNumber} from './mt17_reports.js?v=ensayo';
import {loadCloudMT16, mt16Access} from './mt16_cloud.js';

const el = id => document.getElementById(id);
const fields = ['search','type','result','year'];
const body = el('records');
const controls = Object.fromEntries(fields.map(id => [id,el(id)]));
const status = el('status');
const tipo = {CALIBRACION:'Calibración',CALIBRACION_MT17:'Calibración MT17',VERIFICACION:'Verificación MT16'};
const resultClass = {APTO:'ok','NO APTO':'nok',INDETERMINADO:'pending',PENDIENTE:'pending'};
const query = new URLSearchParams(location.search);
controls.search.value = query.get('codigo')?.trim() || '';
let registros = [];
let consultado = false;
let solicitud = 0;
let avisoConsulta = '';
const esCalibracion = r => r.tipo === 'CALIBRACION' || r.tipo === 'CALIBRACION_MT17';

function canon(value) {
  return String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu,'').trim().toLowerCase();
}

function resultado(value) {
  const key = canon(value).replace(/[_-]/g,' ');
  if (['apto','ok','conforme'].includes(key)) return 'APTO';
  if (['no apto','nok','no conforme'].includes(key)) return 'NO APTO';
  if (['indeterminado','indeterminada','pendiente','dudoso'].includes(key)) return 'INDETERMINADO';
  return value?.trim() || 'SIN DECISIÓN';
}

function fecha(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return '—';
  return value.split('-').reverse().join('/');
}

function filtered() {
  const term = canon(controls.search.value);
  return registros.filter(r => (!term || canon([r.equipo,r.descripcion,r.documento,r.operario].join(' ')).includes(term))
    && (!controls.type.value || (controls.type.value === 'CALIBRACION' ? esCalibracion(r) : r.tipo === controls.type.value))
    && (!controls.result.value || r.resultado === controls.result.value)
    && (!controls.year.value || r.fecha?.startsWith(controls.year.value+'-')));
}

function element(tag,text,className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function enlace(label,href) {
  const node = element('a',label,'btn');
  node.href = href;
  return node;
}

function button(label,handler,className='') {
  const node = element('button',label,className);
  node.type = 'button';
  node.addEventListener('click',handler);
  return node;
}

function download(name,value,type) {
  const url = URL.createObjectURL(new Blob([value],{type}));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function showDetail(row) {
  const details = el('detail-fields');
  details.replaceChildren();
  for (const [key,value] of [
    ['Tipo',tipo[row.tipo]],['Equipo',[row.equipo,row.descripcion].filter(Boolean).join(' · ')],
    ['Fecha',fecha(row.fecha)],['Resultado',row.resultado],['Informe',row.documento],
    ['Criterio',row.criterio],['Operario',row.operario],['Laboratorio',row.laboratorio]
  ]) {
    details.append(element('dt',key),element('dd',value || '—'));
  }
  el('detail').showModal();
}

function pdfURL(value) {
  if (!value) return null;
  try {
    const url = new URL(value,location.href);
    return url.protocol === 'https:' ? url.href : null;
  } catch { return null; }
}

function rowFor(r) {
  const row = element('tr');
  const equipo = element('td');
  if (r.equipo) {
    equipo.append(enlace(r.equipo,'./qr/qr.info_instrumentos.html?codigo='+encodeURIComponent(r.equipo)));
  } else equipo.textContent='—';
  if (r.descripcion) equipo.append(element('span',r.descripcion,'sub'));
  const kind = element('td');
  kind.append(element('span',r.tipo === 'CALIBRACION_MT17' && r.resultado === 'PENDIENTE' ? 'Ensayo MT17' : (tipo[r.tipo] || r.tipo),'badge'+(r.tipo==='VERIFICACION'?' quality':'')));
  const decision = element('td');
  decision.append(element('span',r.resultado,'badge '+(resultClass[r.resultado] || '')));
  const documento = element('td',r.documento || (r.tiene_documento ? 'Documento disponible' : 'Sin documento'));
  const actions = element('td');
  const group = element('div',null,'actions');
  group.append(button('Detalle',()=>showDetail(r)));
  const ensayo = r.tipo === 'CALIBRACION_MT17' && r.resultado === 'PENDIENTE';
  if (ensayo) group.append(enlace('Recuperar ensayo','./mt17.html?ensayo='+encodeURIComponent(r.id)));
  if (['VERIFICACION','CALIBRACION_MT17'].includes(r.tipo) && r.tiene_documento) {
    group.append(button(ensayo ? 'Descargar registro' : 'Descargar informe',async event=>{
      const control = event.currentTarget;
      control.disabled = true;
      try {
        if (r.tipo === 'CALIBRACION_MT17') {
          const record = await loadCloudMT17(r.id);
          if (!record) throw Error('Sin informe disponible');
          downloadMT17(record);
        } else {
          const record = await loadCloudMT16(r.id);
          if (!record?.informe_html) throw Error('Sin informe disponible');
          download(r.documento.replace(/[^\w.-]/g,'_')+'.html',record.informe_html,'text/html;charset=utf-8');
        }
      } catch {
        status.textContent='No se pudo descargar el informe. Comprueba el acceso de Calidad.';
      } finally { control.disabled=false; }
    },'primary'));
  }
  if (r.tipo === 'CALIBRACION' && r.documento) {
    group.append(enlace('Ver certificado','./certificados.ver.html?id='+encodeURIComponent(r.documento)));
  }
  const pdf = pdfURL(r.pdf);
  if (pdf) {
    const a = enlace('Abrir PDF',pdf);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    group.append(a);
  }
  actions.append(group);
  row.append(element('td',fecha(r.fecha)),equipo,kind,decision,documento,actions);
  return row;
}

function render() {
  if (!consultado) return;
  const visibles = filtered();
  el('csv').disabled = !visibles.length;
  status.textContent = visibles.length+' de '+registros.length+' registros'+avisoConsulta;
  body.replaceChildren(...visibles.map(rowFor));
  if (!visibles.length) {
    const cell = element('td',registros.length ? 'Ningún registro coincide con los filtros.' : 'No hay registros oficiales disponibles para esta cuenta.','empty');
    cell.colSpan = 6;
    body.append(element('tr'));
    body.firstChild.append(cell);
  }
}

async function loadLegacy() {
  const rows = [];
  for (let offset=0; ;offset+=200) {
    const {data,error} = await window.supabase.from('registro_documental_tmp').select('*')
      .order('fecha',{ascending:false,nullsFirst:false}).order('tipo').order('id').range(offset,offset+199);
    if (error) throw error;
    rows.push(...data);
    if (data.length<200) return rows;
  }
}

async function load() {
  const ticket = ++solicitud;
  consultado=false;
  registros=[];
  body.replaceChildren();
  el('csv').disabled=true;
  for (const id of ['total-cal','total-mt16','total-apto','total-no-apto']) el(id).textContent='—';
  status.textContent='Consultando registro…';
  try {
    if (!await mt16Access()) {
      if(ticket===solicitud) status.textContent='Autoriza el acceso de Calidad para consultar el registro oficial.';
      return;
    }
    const [legacy, mt17] = await Promise.allSettled([loadLegacy(), listCloudMT17()]);
    if (ticket !== solicitud) return;
    if (legacy.status === 'rejected' && mt17.status === 'rejected') throw legacy.reason;
    avisoConsulta = legacy.status === 'rejected' ? ' · No se pudieron consultar los certificados y las verificaciones MT16.'
      : mt17.status === 'rejected' ? ' · No se pudieron consultar las calibraciones MT17.' : '';
    const mt17Rows = (mt17.value ?? []).map(r => ({
      id:r.id, fecha:r.fecha, equipo:r.equipo_snapshot.codigo, descripcion:r.equipo_snapshot.descripcion,
      tipo:'CALIBRACION_MT17', resultado:r.resultado, documento:mt17ReportNumber(r),
      operario:r.operario, criterio:r.criterio, laboratorio:'TMP', tiene_documento:true
    }));
    registros = [...(legacy.value ?? []), ...mt17Rows]
      .map(r => r.tipo === 'CALIBRACION_MT17' && r.resultado === 'PENDIENTE' ? r : {...r, resultado:resultado(r.resultado)})
      .sort((a,b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''));
    const previousYear=controls.year.value;
    const years=[...new Set(registros.map(r=>r.fecha?.slice(0,4)).filter(y=>/^\d{4}$/.test(y)))].sort().reverse();
    controls.year.replaceChildren(new Option('Todos',''),...years.map(y=>new Option(y,y)));
    if(years.includes(previousYear)) controls.year.value=previousYear;
    el('total-cal').textContent=registros.filter(r=>esCalibracion(r) && r.resultado!=='PENDIENTE').length;
    el('total-mt16').textContent=registros.filter(r=>r.tipo==='VERIFICACION').length;
    el('total-apto').textContent=registros.filter(r=>r.resultado==='APTO').length;
    el('total-no-apto').textContent=registros.filter(r=>r.resultado==='NO APTO').length;
    consultado=true;
    render();
  } catch {
    if(ticket===solicitud) status.textContent='No se pudo consultar el registro. Pulsa Actualizar para volver a intentarlo.';
  }
}

for (const id of fields) controls[id].addEventListener(id==='search'?'input':'change',render);
el('refresh').addEventListener('click',load);
el('reset').addEventListener('click',()=>{
  for (const id of fields) controls[id].value='';
  render();
});
el('csv').addEventListener('click',()=>{
  const quote = v => {
    let value = String(v ?? '');
    if (/^\s*[=+@-]/.test(value)) value = "'"+value;
    return '"'+value.replaceAll('"','""')+'"';
  };
  const rows=[['Fecha','Equipo','Descripción','Tipo','Resultado','Informe','Operario','Criterio'],
    ...filtered().map(r=>[r.fecha,r.equipo,r.descripcion,tipo[r.tipo],r.resultado,r.documento,r.operario,r.criterio])];
  download('registro_documental_TMP.csv','\uFEFF'+rows.map(row=>row.map(quote).join(';')).join('\r\n'),'text/csv;charset=utf-8');
});
window.addEventListener('mt16-cloud-session',load);
load();
