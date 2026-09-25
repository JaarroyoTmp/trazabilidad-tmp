// TMP P1.2 - Resolver real de Pie de Rey desde Supabase.
// No modifica MT15 ni MT16. Se usa para validar el flujo futuro:
// codigo -> instrumento -> familia -> caracteristicas -> pauta automatica.

import { ensureSupabase } from '../../supabase_client.js';

const norm = (value) => String(value ?? '').trim();
const upper = (value) => norm(value).toUpperCase();

function numberFromText(value, fallback = null) {
  const text = norm(value).replace(',', '.');
  const matches = text.match(/\d+(?:\.\d+)?/g);
  if (!matches || !matches.length) return fallback;
  const nums = matches.map(Number).filter(Number.isFinite);
  if (!nums.length) return fallback;
  return Math.max(...nums);
}

function resolutionFromInstrument(inst = {}) {
  const candidates = [
    inst.resolucion,
    inst.resolucion_equipo,
    inst.precision,
    inst.apreciacion,
    inst.division_escala,
    inst.rango,
    inst.descripcion,
    inst.modelo
  ];
  for (const c of candidates) {
    const text = norm(c).replace(',', '.');
    const m = text.match(/0\.0?1|0\.02|0\.05|0\.1/);
    if (m) return Number(m[0]);
  }
  return null;
}

function rangeFromInstrument(inst = {}) {
  const candidates = [inst.rango, inst.designacion, inst.descripcion, inst.modelo, inst.observaciones];
  for (const c of candidates) {
    const value = numberFromText(c, null);
    if (value && value >= 50) return value;
  }
  return null;
}

function typeFromInstrument(inst = {}) {
  const text = upper(`${inst.descripcion || ''} ${inst.modelo || ''} ${inst.tipo || ''} ${inst.rango || ''}`);
  if (text.includes('DIGITAL') || text.includes('ELECTRON')) return 'DIGITAL';
  if (text.includes('RELOJ') || text.includes('DIAL')) return 'RELOJ';
  if (text.includes('ANALOG') || text.includes('NONIO') || text.includes('VERNIER')) return 'ANALOGICO';
  return null;
}

export function isPieDeReyInstrument(inst = {}) {
  const text = upper(`${inst.descripcion || ''} ${inst.nombre || ''} ${inst.tipo || ''} ${inst.familia || ''} ${inst.rango || ''}`);
  return (
    text.includes('PIE DE REY') ||
    text.includes('CALIBRE') ||
    text.includes('VERNIER') ||
    text.includes('DIGITAL CALIPER') ||
    text.includes('CALIPER')
  );
}

export function resolvePieDeReyCharacteristics(inst = {}) {
  const rangoMax = rangeFromInstrument(inst);
  const resolucion = resolutionFromInstrument(inst);
  const tipo = typeFromInstrument(inst);
  const text = upper(`${inst.descripcion || ''} ${inst.modelo || ''} ${inst.rango || ''} ${inst.observaciones || ''}`);

  const profundidad = !text.includes('SIN SONDA') && !text.includes('SIN PROFUNDIDAD') && rangoMax !== null && rangoMax <= 300;
  const interiores = !text.includes('SIN INTERIORES');

  const missing = [];
  if (!rangoMax) missing.push('rangoMax');
  if (!resolucion) missing.push('resolucion');
  if (!tipo) missing.push('tipo');

  return {
    codigo: inst.codigo || '',
    descripcion: inst.descripcion || inst.nombre || '',
    rangoOriginal: inst.rango || inst.designacion || '',
    rangoMax,
    resolucion,
    tipo,
    exteriores: true,
    interiores,
    profundidad,
    escalon: false,
    lecturasPorPunto: 5,
    missing,
    source: 'SUPABASE_INSTRUMENTOS',
    confidence: missing.length ? 0.65 : 0.9
  };
}

export async function loadPieDeReyFromSupabase(codigo, setBadge) {
  const clean = norm(codigo);
  if (!clean) return { ok: false, error: 'Introduce un codigo de equipo.' };

  const sb = await ensureSupabase(setBadge);
  if (!sb) return { ok: false, error: 'Supabase no esta conectado.' };

  const { data, error } = await sb
    .from('instrumentos')
    .select('*')
    .eq('codigo', clean)
    .maybeSingle();

  if (error) return { ok: false, error: error.message || String(error) };
  if (!data) return { ok: false, error: `No se encontro el equipo ${clean}.` };

  const isPie = isPieDeReyInstrument(data);
  const characteristics = resolvePieDeReyCharacteristics(data);

  return {
    ok: true,
    instrumento: data,
    family: isPie ? 'PIE_DE_REY' : 'NO_PIE_DE_REY',
    allowed: isPie,
    characteristics,
    warnings: isPie ? characteristics.missing : ['El equipo no parece Pie de Rey segun descripcion/familia.']
  };
}

export default {
  isPieDeReyInstrument,
  resolvePieDeReyCharacteristics,
  loadPieDeReyFromSupabase
};
