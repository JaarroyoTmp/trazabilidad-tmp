// MC-01 v6 · Resolución metrológica por patrón y nominal.
// No selecciona el patrón: resuelve corrección/U para un patrón ya elegido.

const DAY_MS = 86400000;

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function dateOnly(value) {
  if (!value) return null;
  const d = new Date(String(value).slice(0, 10) + 'T00:00:00');
  return Number.isNaN(d.getTime()) ? null : d;
}

function rss(values) {
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
}

function currentCertificate(certificates, usageDate = new Date()) {
  const target = new Date(usageDate);
  target.setHours(0, 0, 0, 0);
  return [...certificates]
    .filter(c => c.vigente !== false)
    .filter(c => {
      const start = dateOnly(c.fecha_calibracion);
      const end = dateOnly(c.fecha_proxima_calibracion);
      return (!start || start <= target) && (!end || end >= target);
    })
    .sort((a, b) => String(b.fecha_calibracion || '').localeCompare(String(a.fecha_calibracion || '')))[0] || null;
}

function okBase({ patron, certificate, model, nominal, unit }) {
  return {
    status: 'OK',
    patronId: patron.id,
    patronCodigo: patron.codigo,
    patronDescripcion: patron.descripcion,
    certificadoId: certificate?.id || null,
    certificadoNumero: certificate?.numero_certificado || null,
    modeloId: model.id,
    modeloCodigo: model.codigo_modelo,
    nominalSolicitado: nominal,
    unidad: unit || model.unidad || patron.unidad || 'mm',
    advertencias: []
  };
}

async function resolveDiscreteExact(sb, context) {
  const { patron, certificate, model, nominal } = context;
  const tolerance = numberOrNull(model.tolerancia_busqueda) ?? 0.0005;
  const { data, error } = await sb
    .from('mc_patron_componentes')
    .select('*')
    .eq('patron_id', patron.id)
    .eq('estado', 'ACTIVO')
    .gte('nominal', nominal - tolerance)
    .lte('nominal', nominal + tolerance)
    .order('incertidumbre', { ascending: true })
    .limit(10);
  if (error) throw error;
  if (!data?.length) return null;

  const component = data.sort((a, b) => Math.abs(Number(a.nominal) - nominal) - Math.abs(Number(b.nominal) - nominal))[0];
  const correction = numberOrNull(component.correccion) ?? 0;
  const value = numberOrNull(component.valor_real) ?? nominal + correction;
  const uncertainty = numberOrNull(component.incertidumbre);

  return {
    ...okBase({ patron, certificate, model, nominal }),
    metodoResolucion: 'COINCIDENCIA_EXACTA',
    nominalResuelto: numberOrNull(component.nominal),
    valorPatron: value,
    correccion: correction,
    incertidumbreExpandida: uncertainty,
    factorK: numberOrNull(component.factor_k) ?? numberOrNull(model.factor_k) ?? 2,
    fuenteDatos: 'mc_patron_componentes',
    elementos: [{
      id: component.id,
      codigo: component.codigo_componente,
      nominal: numberOrNull(component.nominal),
      valorReal: value,
      correccion: correction,
      incertidumbre: uncertainty
    }]
  };
}

async function fetchDiscreteComponents(sb, patronId) {
  const { data, error } = await sb
    .from('mc_patron_componentes')
    .select('*')
    .eq('patron_id', patronId)
    .eq('estado', 'ACTIVO')
    .order('nominal', { ascending: false });
  if (error) throw error;
  return (data || []).filter(c => numberOrNull(c.nominal) !== null);
}

function findCombination(components, target, tolerance, maxElements = 8) {
  const items = components
    .map(c => ({ component: c, nominal: numberOrNull(c.nominal) }))
    .filter(x => x.nominal > 0 && x.nominal <= target + tolerance)
    .sort((a, b) => b.nominal - a.nominal);

  let best = null;
  const visit = (index, selected, sum) => {
    const delta = Math.abs(sum - target);
    if (delta <= tolerance) {
      if (!best || selected.length < best.length) best = [...selected];
      return;
    }
    if (sum > target + tolerance || selected.length >= maxElements || index >= items.length) return;
    if (best && selected.length >= best.length) return;

    for (let i = index; i < items.length; i += 1) {
      selected.push(items[i]);
      visit(i + 1, selected, sum + items[i].nominal);
      selected.pop();
    }
  };

  visit(0, [], 0);
  return best;
}

async function resolveDiscreteCombination(sb, context) {
  const exact = await resolveDiscreteExact(sb, context);
  if (exact) return exact;

  const { patron, certificate, model, nominal } = context;
  if (!model.permite_combinacion) return null;
  const tolerance = numberOrNull(model.tolerancia_busqueda) ?? 0.0005;
  const components = await fetchDiscreteComponents(sb, patron.id);
  const combination = findCombination(components, nominal, tolerance);
  if (!combination) return null;

  const elements = combination.map(({ component, nominal: componentNominal }) => {
    const correction = numberOrNull(component.correccion) ?? 0;
    const uncertainty = numberOrNull(component.incertidumbre);
    return {
      id: component.id,
      codigo: component.codigo_componente,
      nominal: componentNominal,
      valorReal: numberOrNull(component.valor_real) ?? componentNominal + correction,
      correccion: correction,
      incertidumbre: uncertainty
    };
  });

  const correction = elements.reduce((sum, e) => sum + (e.correccion || 0), 0);
  const value = elements.reduce((sum, e) => sum + (e.valorReal || e.nominal), 0);
  const uncertainties = elements.map(e => e.incertidumbre).filter(Number.isFinite);

  return {
    ...okBase({ patron, certificate, model, nominal }),
    metodoResolucion: 'COMBINACION_ELEMENTOS',
    nominalResuelto: elements.reduce((sum, e) => sum + e.nominal, 0),
    valorPatron: value,
    correccion: correction,
    incertidumbreExpandida: uncertainties.length === elements.length ? rss(uncertainties) : null,
    factorK: numberOrNull(model.factor_k) ?? 2,
    fuenteDatos: 'mc_patron_componentes',
    elementos,
    advertencias: uncertainties.length === elements.length ? [] : ['Algún elemento no tiene incertidumbre certificada.']
  };
}

async function resolveRanges(sb, context) {
  const { patron, certificate, model, nominal } = context;
  const { data, error } = await sb
    .from('mc_patron_tramos')
    .select('*')
    .eq('modelo_id', model.id)
    .lte('desde', nominal)
    .gte('hasta', nominal)
    .order('orden', { ascending: true })
    .limit(5);
  if (error) throw error;
  const range = data?.[0];
  if (!range) return null;

  return {
    ...okBase({ patron, certificate, model, nominal }),
    metodoResolucion: 'TRAMO_CERTIFICADO',
    nominalResuelto: nominal,
    valorPatron: nominal + (numberOrNull(range.correccion) ?? 0),
    correccion: numberOrNull(range.correccion) ?? 0,
    incertidumbreExpandida: numberOrNull(range.incertidumbre),
    factorK: numberOrNull(range.factor_k) ?? numberOrNull(model.factor_k) ?? 2,
    fuenteDatos: 'mc_patron_tramos',
    tramo: { desde: numberOrNull(range.desde), hasta: numberOrNull(range.hasta) },
    elementos: []
  };
}

async function resolveCertificatePoints(sb, context) {
  const { patron, certificate, model, nominal, orientation, test } = context;
  let query = sb
    .from('mc_patron_resultados_certificado')
    .select('*')
    .eq('patron_id', patron.id)
    .eq('certificado_id', certificate.id);
  if (test || model.ensayo) query = query.eq('ensayo', test || model.ensayo);
  if (orientation || model.orientacion) query = query.eq('posicion', orientation || model.orientacion);
  const { data, error } = await query.limit(1000);
  if (error) throw error;
  const rows = (data || []).filter(r => numberOrNull(r.nominal) !== null);
  if (!rows.length) return null;

  if (model.regla_punto === 'SIN_RESOLUCION_AUTOMATICA' || model.tipo_modelo === 'REVISION_TECNICA') {
    return {
      status: 'REVISION_TECNICA',
      patronId: patron.id,
      patronCodigo: patron.codigo,
      modeloId: model.id,
      modeloCodigo: model.codigo_modelo,
      nominalSolicitado: nominal,
      unidad: model.unidad || patron.unidad || 'mm',
      certificadoId: certificate.id,
      certificadoNumero: certificate.numero_certificado,
      metodoResolucion: 'NO_AUTORIZADO',
      fuenteDatos: 'mc_patron_resultados_certificado',
      advertencias: ['Los resultados del certificado existen, pero la regla de aplicación al uso todavía no está aprobada.']
    };
  }

  const nearest = [...rows].sort((a, b) => Math.abs(Number(a.nominal) - nominal) - Math.abs(Number(b.nominal) - nominal))[0];
  const correction = numberOrNull(nearest.desviacion) ?? 0;
  const uncertaintyUm = numberOrNull(nearest.incertidumbre_um);

  return {
    ...okBase({ patron, certificate, model, nominal }),
    metodoResolucion: model.regla_punto || 'MAS_CERCANO',
    nominalResuelto: numberOrNull(nearest.nominal),
    valorPatron: nominal + correction,
    correccion: correction,
    incertidumbreExpandida: uncertaintyUm === null ? null : uncertaintyUm / 1000,
    factorK: numberOrNull(model.factor_k) ?? 2,
    fuenteDatos: 'mc_patron_resultados_certificado',
    resultadoCertificadoId: nearest.id,
    posicion: nearest.posicion,
    ensayo: nearest.ensayo,
    elementos: [],
    advertencias: Math.abs(Number(nearest.nominal) - nominal) > 0.001 ? ['Se ha usado un punto certificado no coincidente exactamente con el nominal solicitado.'] : []
  };
}

export async function resolvePatternMetrology(sb, options = {}) {
  if (!sb) throw new Error('Cliente Supabase no disponible.');
  const patronId = options.patronId;
  const nominal = numberOrNull(options.nominal);
  if (!patronId) return { status: 'BLOQUEADO', message: 'Falta patronId.' };
  if (nominal === null) return { status: 'BLOQUEADO', message: 'Nominal no válido.' };

  const usageDate = options.fechaUso ? new Date(options.fechaUso) : new Date();
  const { data: patron, error: patronError } = await sb.from('mc_patrones').select('*').eq('id', patronId).single();
  if (patronError || !patron) return { status: 'BLOQUEADO', message: patronError?.message || 'Patrón no encontrado.' };
  if (!patron.activo || patron.estado === 'BAJA') return { status: 'BLOQUEADO', message: 'Patrón dado de baja.' };
  const expiry = dateOnly(patron.fecha_proxima_calibracion);
  if (expiry && expiry < new Date(usageDate.getFullYear(), usageDate.getMonth(), usageDate.getDate())) {
    return { status: 'BLOQUEADO', message: 'Patrón caducado para la fecha de uso.' };
  }

  const { data: certificates, error: certificateError } = await sb
    .from('mc_patron_certificados')
    .select('*')
    .eq('patron_id', patron.id);
  if (certificateError) return { status: 'BLOQUEADO', message: certificateError.message };
  const certificate = currentCertificate(certificates || [], usageDate);
  if (!certificate) return { status: 'BLOQUEADO', message: 'No existe certificado vigente para la fecha de uso.' };

  let modelQuery = sb
    .from('mc_patron_modelos_resolucion')
    .select('*')
    .eq('patron_id', patron.id)
    .eq('estado', 'ACTIVO')
    .order('prioridad', { ascending: true });
  if (options.modeloId) modelQuery = modelQuery.eq('id', options.modeloId);
  const { data: models, error: modelError } = await modelQuery;
  if (modelError) return { status: 'BLOQUEADO', message: modelError.message };
  const eligible = (models || []).filter(m => {
    const min = numberOrNull(m.rango_min);
    const max = numberOrNull(m.rango_max);
    if (min !== null && nominal < min) return false;
    if (max !== null && nominal > max) return false;
    if (options.funcion && m.funcion_medicion && m.funcion_medicion !== options.funcion) return false;
    return true;
  });
  if (!eligible.length) return { status: 'BLOQUEADO', message: 'No existe modelo metrológico autorizado que cubra el nominal.' };

  for (const model of eligible) {
    const context = {
      patron,
      certificate,
      model,
      nominal,
      orientation: options.orientacion,
      test: options.ensayo
    };
    let result = null;
    if (model.tipo_modelo === 'DISCRETO_EXACTO') result = await resolveDiscreteExact(sb, context);
    else if (model.tipo_modelo === 'DISCRETO_COMBINACION') result = await resolveDiscreteCombination(sb, context);
    else if (model.tipo_modelo === 'TRAMOS') result = await resolveRanges(sb, context);
    else if (model.tipo_modelo === 'PUNTOS_CERTIFICADOS' || model.tipo_modelo === 'REVISION_TECNICA') result = await resolveCertificatePoints(sb, context);

    if (result) return result;
  }

  return { status: 'BLOQUEADO', message: 'El patrón no puede resolver este nominal con los datos disponibles.' };
}

export async function savePatternResolution(sb, resolution, context = {}) {
  if (!resolution || resolution.status !== 'OK') throw new Error('Solo se guardan resoluciones metrológicas OK.');
  const payload = {
    patron_id: resolution.patronId,
    certificado_id: resolution.certificadoId,
    modelo_id: resolution.modeloId,
    calibracion_id: context.calibracionId || null,
    modulo: context.modulo || null,
    punto_codigo: context.puntoCodigo || null,
    nominal_solicitado: resolution.nominalSolicitado,
    nominal_resuelto: resolution.nominalResuelto,
    valor_patron: resolution.valorPatron,
    correccion: resolution.correccion,
    incertidumbre_expandida: resolution.incertidumbreExpandida,
    factor_k: resolution.factorK,
    unidad: resolution.unidad,
    metodo_resolucion: resolution.metodoResolucion,
    fuente_datos: resolution.fuenteDatos,
    elementos: resolution.elementos || [],
    advertencias: resolution.advertencias || [],
    operador: context.operador || null
  };
  const { data, error } = await sb.from('mc_patron_resoluciones_uso').insert(payload).select().single();
  if (error) throw error;
  return data;
}
