import {listLocalVerifications} from './mt16_local.js';
import {buildFormalMT16Report} from './mt16_report.js';

const box = document.getElementById('mt16-register');
box.innerHTML = `
  <div class="head">
    <div><h2>Verificaciones MT16 de este navegador</h2>
    <p>Consulta los informes guardados en esta dirección.</p></div>
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
    <thead><tr><th>Fecha</th><th>Equipo</th><th>Operario</th><th>Resultado</th><th>Informe</th></tr></thead>
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
      record.resultado === 'OK' ? 'APTO' : 'NO APTO'
    ];
    for (const value of values) row.insertCell().textContent = value || '—';
    const button = document.createElement('button');
    button.className = 'btn';
    button.type = 'button';
    button.textContent = 'Descargar informe';
    button.onclick = () => downloadReport(record);
    row.insertCell().append(button);
  }

  status.textContent = records.length
    ? `${filtered.length} de ${records.length} verificaciones guardadas en este navegador.`
    : 'No hay verificaciones guardadas aquí. Abre la misma dirección y usa el navegador donde pulsaste «Guardar en este navegador».';
}

async function load() {
  reload.disabled = filter.disabled = result.disabled = true;
  status.textContent = 'Consultando el historial local…';
  try {
    records = await listLocalVerifications();
    records.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
    render();
  } catch {
    body.replaceChildren();
    status.textContent = 'No se ha podido leer el historial de este navegador.';
    reload.disabled = false;
    return;
  }
  reload.disabled = filter.disabled = result.disabled = false;
}
reload.onclick = load;
filter.oninput = render;
result.onchange = render;
window.addEventListener('pageshow', event => { if (event.persisted && !reload.disabled) load(); });
load();
