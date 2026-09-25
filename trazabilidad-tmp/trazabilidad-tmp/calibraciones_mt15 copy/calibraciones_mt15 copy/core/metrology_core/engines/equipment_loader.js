/* MC-02 Equipment Loader - TMP
   Carga equipo desde Supabase y devuelve un objeto normalizado.
   Motor común preparado para MT17 y futuros motores.
*/

import { ensureSupabase } from '../supabase_client.js';

function text(v) { return String(v ?? '').trim(); }
function lower(v) { return text(v).toLowerCase(); }

export function normalizeEquipment(raw = {}) {
  const codigo = raw.codigo || raw.codigo_interno || raw.referencia || raw.id || '';
  const descripcion = raw.descripcion || raw.nombre || raw.tipo || raw.familia || '';
  const rango = raw.rango || raw.designacion || raw.rango_designacion || raw.capacidad || '';
  const resolucion = raw.resolucion || raw.resolution || raw.precision || raw.division_escala || '';
  const fabricante = raw.fabricante || raw.marca || '';
  const modelo = raw.modelo || '';
  const ubicacion = raw.ubicacion_actual || raw.ubicacion || raw.localizacion || 'Laboratorio';

  return {
    raw,
    codigo: text(codigo),
    descripcion: text(descripcion),
    rango: text(rango),
    resolucion: text(resolucion),
    fabricante: text(fabricante),
    modelo: text(modelo),
    ubicacion: text(ubicacion),
    familia: text(raw.familia || raw.familia_resuelta || raw.tipo_instrumento || ''),
    estado: text(raw.estado || raw.estado_calibracion || ''),
    fechaUltima: raw.fecha_ultima_calibracion || raw.ultima_calibracion || raw.fecha_calibracion || null,
    fechaProxima: raw.fecha_proxima_calibracion || raw.proxima_calibracion || raw.fecha_proxima || null
  };
}

export function detectFamily(equipment = {}) {
  const n = normalizeEquipment(equipment);
  const hay = `${n.descripcion} ${n.familia} ${n.rango}`.toLowerCase();

  if (hay.includes('pie de rey') || hay.includes('calibre') || hay.includes('vernier')) {
    return { family: 'PIE_DE_REY', confidence: 0.9, reason: 'descripcion/familia' };
  }
  if (hay.includes('tampon') && hay.includes('rosca')) return { family: 'TAMPON_ROSCADO_PNP', confidence: 0.9, reason: 'descripcion/familia' };
  if (hay.includes('tampon') || hay.includes('liso')) return { family: 'TAMPON_LISO_PNP', confidence: 0.75, reason: 'descripcion/familia' };

  return { family: n.familia || 'DESCONOCIDA', confidence: n.familia ? 0.5 : 0, reason: 'sin clasificacion clara' };
}

export async function loadEquipmentByCode(code, options = {}) {
  const sb = options.supabase || await ensureSupabase(options.setBadge);
  const clean = text(code);
  if (!clean) return { ok: false, error: 'Introduce un código de equipo.', equipment: null };
  if (!sb) return { ok: false, error: 'Supabase no disponible.', equipment: null };

  const attempts = [
    { field: 'codigo', op: 'eq', value: clean },
    { field: 'codigo_interno', op: 'eq', value: clean },
    { field: 'referencia', op: 'eq', value: clean },
    { field: 'codigo', op: 'ilike', value: `%${clean}%` }
  ];

  for (const a of attempts) {
    try {
      let q = sb.from('instrumentos').select('*').limit(5);
      q = a.op === 'eq' ? q.eq(a.field, a.value) : q.ilike(a.field, a.value);
      const { data, error } = await q;
      if (error) continue;
      if (Array.isArray(data) && data.length) {
        const equipment = normalizeEquipment(data[0]);
        const family = detectFamily(data[0]);
        return { ok: true, equipment, family, raw: data[0], source: `instrumentos.${a.field}.${a.op}` };
      }
    } catch (e) {
      // sigue con el siguiente intento
    }
  }

  return { ok: false, error: `No se encontró el equipo ${clean}.`, equipment: null };
}

export default { loadEquipmentByCode, normalizeEquipment, detectFamily };
