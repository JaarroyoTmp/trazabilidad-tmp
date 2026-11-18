import {listLocalVerifications} from './mt16_local.js';

function displayDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date.split('-').reverse().join('/') : '';
}

export async function showLocalMT16(container, instrumentId) {
  if (!container || !instrumentId) return;
  let records;
  try {
    records = await listLocalVerifications(instrumentId);
  } catch {
    return;
  }

  const dateOf = record => record.datos?.formulario?.fecha || '';
  const latest = records
    .filter(record => ['OK', 'NOK'].includes(record.resultado) && displayDate(dateOf(record)))
    .sort((a, b) => dateOf(b).localeCompare(dateOf(a)))[0];
  if (!latest || !container.isConnected) return;

  const label = document.createElement('div');
  label.className = 'label detail-label';
  label.textContent = 'Verificación MT16 · este navegador';

  const value = document.createElement('div');
  value.className = 'value detail-value';
  const result = latest.resultado === 'OK' ? 'APTO' : 'NO APTO';
  value.textContent = `${displayDate(dateOf(latest))} · ${result}`;

  const plan = latest.datos?.control_fechas;
  const nextDate = displayDate(plan?.proxima_fecha);
  if (latest.resultado === 'OK' && plan?.accion === 'RENOVAR' && nextDate) {
    const next = document.createElement('div');
    next.textContent = `Próximo control orientativo: ${nextDate}`;
    value.append(next);
  }
  const note = document.createElement('div');
  note.textContent = 'La vigencia de la ficha se consulta en Supabase.';
  value.append(note);
  container.replaceChildren(label, value);
  container.hidden = false;
}
