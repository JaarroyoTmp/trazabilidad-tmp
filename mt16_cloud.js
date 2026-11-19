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

export async function publishMT16(local) {
  if (!await mt16Access()) {
    window.dispatchEvent(new Event('mt16-request-login'));
    throw Error('Accede con tu correo de Calidad. La verificación sigue guardada en este navegador.');
  }
  const previous = await loadCloudMT16(local.id);
  if (previous) {
    if (previous.instrumento_id !== local.instrumento_id || previous.resultado !== local.resultado ||
        previous.datos?.emitido_en !== local.datos?.emitido_en) throw Error('La referencia del informe ya está en uso.');
    return previous;
  }
  const client = window.supabase;
  const {data: equipment, error: equipmentError} = await client.from('instrumentos')
    .select('id,codigo,frecuencia_calibracion_meses,fecha_calibracion,fecha_ultima_verificacion')
    .eq('id', local.instrumento_id).single();
  if (equipmentError) throw equipmentError;
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
  const {data, error} = await client.from('verificaciones_mt16').insert(record).select('id,datos').single();
  if (error) {
    const recovered = await loadCloudMT16(record.id);
    if (recovered?.datos?.emitido_en === record.datos.emitido_en &&
        recovered?.instrumento_id === record.instrumento_id && recovered?.resultado === record.resultado) return recovered;
    throw error;
  }
  return data;
}
