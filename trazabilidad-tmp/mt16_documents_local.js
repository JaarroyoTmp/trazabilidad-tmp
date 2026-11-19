import {listLocalVerifications} from './mt16_local.js';
import {listCloudMT16,loadCloudMT16,publishMT16} from './mt16_cloud.js';
import {buildFormalMT16Report} from './mt16_report.js';

const box = document.getElementById('mt16-register');
box.innerHTML = `
  <div class="head">
    <div><h2>Verificaciones MT16</h2>
    <p>Informes guardados en Supabase y verificaciones de este navegador pendientes de publicar.</p></div>
    <button id="mt16-reload" class="btn" type="button">Actualizar</button>
  </div>
  <div class="filters">
    <label>Equipo u operario <input id="mt16-filter" type="search"></label>
    <label>Resultado <select id="mt16-result">
      <option value="">Todos</option><option value="OK">APTO</option><option value="NOK">NO APTO</option>
    </select></label>
  </div>
  <p id="mt16-status" role="status"></p>
  <div style="overflow:auto"><table>
    <thead><tr><th>Fecha</th><th>Equipo</th><th>Operario</th><th>Resultado</th><th>Origen</th><th>Informe</th></tr></thead>
    <tbody id="mt16-body"></tbody>
  </table></div>
`;

const el = id => document.getElementById(id);
const status = el('mt16-status');
const body = el('mt16-body');
const filter = el('mt16-filter');
const result = el('mt16-result');
const reload = el('mt16-reload');
let records = [];
let generation = 0;
let publishedMessage = '';
const params = new URLSearchParams(location.search);
const initialCode = params.get('codigo')?.trim() || '';
const equipmentInput = document.getElementById(box.dataset.equipmentInput || '');
filter.value = initialCode;
if (equipmentInput) {
  equipmentInput.addEventListener('change', () => {
    filter.value = equipmentInput.value.trim();
    render();
  });
}

function downloadReport(record) {
  const html = record.informe_html || buildFormalMT16Report(record);
  const url = URL.createObjectURL(new Blob([html], {type: 'text/html;charset=utf-8'}));
  const link = document.createElement('a');
  const code = String(record.equipo_snapshot?.codigo || 'equipo').replace(/[^a-z0-9_-]/gi, '_');
  link.href = url;
  link.download = `MT16_${code}_${record.datos.formulario.fecha}.html`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function render() {
  const query = filter.value.trim().toLocaleLowerCase('es');
  const filtered = records.filter(record => {
    const equipment = record.equipo_snapshot || {};
    const operator = record.datos?.formulario?.operario;
    const matches = [equipment.codigo, equipment.descripcion, operator]
      .some(value => String(value || '').toLocaleLowerCase('es').includes(query));
    return matches && (!result.value || record.resultado === result.value);
  });
  body.replaceChildren();
  for (const record of filtered) {
    const row = body.insertRow();
    const values = [
      record.datos?.formulario?.fecha?.split('-').reverse().join('/'),
      record.equipo_snapshot?.codigo,
      record.datos?.formulario?.operario,
      record.resultado === 'OK' ? 'APTO' : 'NO APTO',
      record.shared ? 'Supabase' : 'Pendiente de publicar'
    ];
    for (const value of values) row.insertCell().textContent = value || '—';
    const button = document.createElement('button');
    button.className = 'btn';
    button.type = 'button';
    button.textContent = 'Descargar informe';
    const actions = row.insertCell();
    button.onclick = async () => {
      try {
        const full = record.shared ? await loadCloudMT16(record.id) : record;
        if (!full) throw Error('No se encontró el informe compartido.');
        downloadReport(full);
      } catch (error) { status.textContent = error.message; }
    };
    actions.append(button);
    if (!record.shared && document.getElementById('mt16-cloud-access')) {
      const publish = document.createElement('button');
      publish.type = 'button';
      publish.className = 'btn';
      publish.textContent = 'Publicar en Supabase';
      publish.onclick = async () => {
        publish.disabled = true;
        try {
          await publishMT16(record);
          publishedMessage = 'Verificación publicada en Supabase. ';
          await load();
        } catch (error) {
          status.textContent = error.message;
          publish.disabled = false;
        }
      };
      actions.append(' ', publish);
    }
  }

  if (!filtered.length) {
    status.textContent = records.length
      ? 'Ninguna verificación coincide con el filtro. Borra el filtro para ver todos los informes guardados aquí.'
      : 'No hay verificaciones guardadas aquí. Abre la misma dirección y usa el navegador donde pulsaste «Guardar en este navegador».';
    return;
  }
  status.textContent = `${filtered.length} de ${records.length} verificaciones disponibles.`;
}

async function load() {
  const request = ++generation;
  reload.disabled = filter.disabled = result.disabled = true;
  body.replaceChildren();
  status.textContent = 'Consultando el historial…';
  const [local, cloud] = await Promise.allSettled([listLocalVerifications(),listCloudMT16()]);
  if (request !== generation) return;
  const merged = new Map((local.value || []).map(record => [record.id,record]));
  for (const record of cloud.value || []) merged.set(record.id,{...record,shared:true});
  records = [...merged.values()].sort((a,b) => {
    const left = a.datos?.formulario?.fecha || '';
    const right = b.datos?.formulario?.fecha || '';
    return right.localeCompare(left) || String(b.fecha).localeCompare(String(a.fecha));
  });
  render();
  const accessHint = document.getElementById('mt16-cloud-access')
    ? ' Accede con tu correo de Calidad para consultar Supabase.'
    : ' Abre Informes MT16 para acceder con tu correo de Calidad.';
  if (cloud.status === 'rejected') status.textContent += ' Supabase no disponible.';
  else if (cloud.value === null) status.textContent += accessHint;
  if (local.status === 'rejected') status.textContent += ' No se pudo leer el historial del navegador.';
  if (publishedMessage) {
    status.textContent = publishedMessage + status.textContent;
    publishedMessage = '';
  }
  reload.disabled = filter.disabled = result.disabled = false;
}
window.addEventListener('mt16-cloud-session',load);
reload.onclick = load;
filter.oninput = render;
result.onchange = render;
window.addEventListener('pageshow', event => { if (event.persisted && !reload.disabled) load(); });
load();
