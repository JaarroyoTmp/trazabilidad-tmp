import './config.mjs';
import {planMT16Control} from './mt16_control.js';
import {buildFormalMT16Report} from './mt16_report.js';

export async function mt16Access() {
  const client = window.supabase;
  const {data, error} = await client.auth.getSession();
  if (error) throw error;
  return data.session?.user || null;
}

export async function listCloudMT16(instrumentId) {
  if (!await mt16Access()) return null;
  let query = window.supabase.from('verificaciones_mt16')
    .select('id,instrumento_id,fecha,resultado,equipo_snapshot,datos')
    .order('fecha', {ascending:false}).order('id', {ascending:false});
  if (instrumentId) query = query.eq('instrumento_id', instrumentId);
  const records = [];
  for (let offset = 0; ; offset += 200) {
    const {data, error} = await query.range(offset, offset + 199);
    if (error) throw error;
    records.push(...data);
    if (data.length < 200) return records;
  }
}

export async function loadCloudMT16(id) {
  const {data, error} = await window.supabase.from('verificaciones_mt16')
    .select('id,instrumento_id,fecha,resultado,equipo_snapshot,datos,informe_html').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

async function readEquipment(id) {
  const {data, error} = await window.supabase.from('instrumentos')
    .select('id,codigo,estado,frecuencia_calibracion_meses,fecha_calibracion,fecha_ultima_verificacion,fecha_proxima_verificacion,fecha_proxima_calibracion')
    .eq('id', id).single();
  if (error) throw error;
  return data;
}

function sameVerification(stored, local) {
  return stored?.instrumento_id === local.instrumento_id &&
    stored?.resultado === local.resultado &&
    stored?.datos?.emitido_en === local.datos?.emitido_en;
}

async function confirmPublication(local) {
  const verification = await loadCloudMT16(local.id);
  if (!sameVerification(verification, local) || !verification.informe_html) {
    throw Error('Aún no se pudo confirmar la lectura del informe en Supabase. Vuelve a verificar el estado desde el historial.');
  }
  try {
    return {...verification, agenda: await readEquipment(local.instrumento_id)};
  } catch {
    return {...verification, agenda:null};
  }
}

export async function publishMT16(local) {
  if (!await mt16Access()) {
    window.dispatchEvent(new Event('mt16-request-login'));
    throw Error('Autoriza este navegador en Acceso de Calidad. La verificación sigue guardada en este navegador.');
  }
  const previous = await loadCloudMT16(local.id);
  if (previous) return confirmPublication(local);
  const client = window.supabase;
  const equipment = await readEquipment(local.instrumento_id);
  if (String(equipment.codigo) !== String(local.equipo_snapshot?.codigo)) throw Error('El código actual del equipo no coincide con el informe.');
  const plan = planMT16Control(equipment, local.datos.formulario.fecha, local.resultado);
  if (plan.accion === 'FRECUENCIA_PENDIENTE') throw Error('Configura la frecuencia en la ficha antes de publicar el APTO.');
  if (plan.accion === 'PENDIENTE') throw Error('Solo se publican verificaciones finalizadas.');
  const record = {
    id: local.id, instrumento_id: local.instrumento_id, resultado: local.resultado,
    tipo: local.tipo, certificado_inicial: local.certificado_inicial,
    equipo_snapshot: local.equipo_snapshot,
    datos: {...local.datos, modo_guardado:'SUPABASE', control_fechas:plan}
  };
  record.informe_html = buildFormalMT16Report(record);
  const {error} = await client.from('verificaciones_mt16').insert(record);
  if (error) {
    const recovered = await loadCloudMT16(record.id);
    if (!sameVerification(recovered, record)) throw error;
  }
  return confirmPublication(local);
}
