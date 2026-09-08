// MC-01 v5 - Pattern Selector Engine
// Consulta MC-01 y devuelve patrones/componentes vigentes para los motores MT15/MT16/MT17.

export function normalizeText(v){
  return String(v ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

export function isExpired(dateValue, today = new Date()){
  if(!dateValue) return false;
  const d = new Date(dateValue);
  if(Number.isNaN(d.getTime())) return false;
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return d < t;
}

export function patternIsUsable(p){
  if(!p) return false;
  const estado = normalizeText(p.estado || p.componente_estado || '');
  if(estado.includes('baja') || estado.includes('caduc') || estado.includes('fuera') || estado.includes('nok')) return false;
  if(p.activo === false) return false;
  if(isExpired(p.fecha_proxima_calibracion || p.componente_fecha_proxima_calibracion || p.certificado_fecha_proxima)) return false;
  return true;
}

export function componentValueReal(component){
  const nominal = Number(component?.nominal);
  const valor = Number(component?.valor_real);
  const corr = Number(component?.correccion);
  if(Number.isFinite(valor)) return valor;
  if(Number.isFinite(nominal) && Number.isFinite(corr)) return nominal + corr;
  return Number.isFinite(nominal) ? nominal : null;
}

export function combineComponents(components = []){
  const valid = components.filter(Boolean);
  const nominal = valid.reduce((a,c)=>a + (Number(c.nominal) || 0), 0);
  const valor_real = valid.reduce((a,c)=>a + (componentValueReal(c) || 0), 0);
  const correccion = valor_real - nominal;
  const u2 = valid.reduce((a,c)=>{
    const u = Number(c.incertidumbre ?? c.incertidumbre_um / 1000);
    return a + (Number.isFinite(u) ? u*u : 0);
  }, 0);
  return {
    nominal,
    valor_real,
    correccion,
    incertidumbre: Math.sqrt(u2),
    componentes: valid
  };
}

export async function fetchMc01Patterns(supabase){
  const { data, error } = await supabase
    .from('mc_patrones')
    .select('*')
    .order('codigo', { ascending: true });
  if(error) throw error;
  return data || [];
}

export async function fetchPatternComponents(supabase, patronId){
  const { data, error } = await supabase
    .from('mc_patron_componentes')
    .select('*')
    .eq('patron_id', patronId)
    .order('nominal', { ascending: true });
  if(error) throw error;
  return data || [];
}

export async function findCompatiblePatterns(supabase, { familiaInstrumento, funcionMedicion, nominal } = {}){
  let q = supabase
    .from('mc_patron_metodos')
    .select('*, mc_patrones(*)')
    .eq('estado','ACTIVO')
    .order('prioridad', { ascending: true });

  if(familiaInstrumento) q = q.ilike('familia_instrumento', `%${familiaInstrumento}%`);
  if(funcionMedicion) q = q.ilike('funcion_medicion', `%${funcionMedicion}%`);

  const { data, error } = await q;
  if(error) throw error;

  return (data || [])
    .filter(m => {
      const n = Number(nominal);
      if(Number.isFinite(n)){
        const min = Number(m.rango_min);
        const max = Number(m.rango_max);
        if(Number.isFinite(min) && n < min) return false;
        if(Number.isFinite(max) && n > max) return false;
      }
      return patternIsUsable(m.mc_patrones);
    });
}
