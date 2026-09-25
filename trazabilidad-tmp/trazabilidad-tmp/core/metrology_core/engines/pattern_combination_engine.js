// MC-01 v7 · Generador de combinaciones físicas de patrones discretos.
// Cada elemento físico solo puede utilizarse una vez por combinación.

function num(value) {
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

function combinationMetrics(items) {
  const nominal = items.reduce((sum, item) => sum + item.nominal, 0);
  const correction = items.reduce((sum, item) => sum + (item.correction || 0), 0);
  const value = items.reduce((sum, item) => sum + item.value, 0);
  const uncertainties = items.map(item => item.uncertainty).filter(Number.isFinite);
  return {
    nominal,
    value,
    correction,
    uncertainty: uncertainties.length === items.length ? rss(uncertainties) : null,
    elementCount: items.length
  };
}

function rankCombination(a, b) {
  if (a.elementCount !== b.elementCount) return a.elementCount - b.elementCount;
  const au = Number.isFinite(a.uncertainty) ? a.uncertainty : Number.POSITIVE_INFINITY;
  const bu = Number.isFinite(b.uncertainty) ? b.uncertainty : Number.POSITIVE_INFINITY;
  if (au !== bu) return au - bu;
  const ac = Math.abs(a.correction || 0);
  const bc = Math.abs(b.correction || 0);
  if (ac !== bc) return ac - bc;
  return a.key.localeCompare(b.key);
}

function normalizeComponent(component) {
  const nominal = num(component.nominal);
  if (!(nominal > 0)) return null;
  const correction = num(component.correccion) ?? 0;
  const value = num(component.valor_real) ?? nominal + correction;
  return {
    id: component.id,
    code: component.codigo_componente || component.codigo || component.id,
    description: component.descripcion || '',
    nominal,
    value,
    correction,
    uncertainty: num(component.incertidumbre),
    factorK: num(component.factor_k) ?? 2,
    certificateId: component.certificado_id || null
  };
}

export async function fetchAvailablePatternElements(sb, {
  patronId,
  usageDate = new Date()
} = {}) {
  if (!sb) throw new Error('Cliente Supabase no disponible.');
  if (!patronId) throw new Error('Falta patronId.');

  const targetDate = dateOnly(usageDate) || new Date();
  const { data, error } = await sb
    .from('mc_patron_componentes')
    .select('*')
    .eq('patron_id', patronId)
    .eq('estado', 'ACTIVO')
    .order('nominal', { ascending: true });
  if (error) throw error;

  return (data || [])
    .filter(row => {
      const expiry = dateOnly(row.fecha_proxima_calibracion);
      return !expiry || expiry >= targetDate;
    })
    .map(normalizeComponent)
    .filter(Boolean);
}

function keepBest(list, candidate, maxAlternatives) {
  const duplicate = list.some(existing => existing.key === candidate.key);
  if (!duplicate) list.push(candidate);
  list.sort(rankCombination);
  if (list.length > maxAlternatives) list.length = maxAlternatives;
}

export function generateCombinationCatalog({
  elements = [],
  minNominal = 0,
  maxNominal = 200,
  maxElements = 6,
  maxAlternativesPerNominal = 5,
  resolution = 0.001
} = {}) {
  const minValue = Math.max(0, num(minNominal) ?? 0);
  const maxValue = num(maxNominal);
  if (!(maxValue > 0)) throw new Error('El nominal máximo debe ser mayor que cero.');
  if (!(resolution > 0)) throw new Error('La resolución debe ser mayor que cero.');

  const scale = Math.round(1 / resolution);
  const maxKey = Math.round(maxValue * scale);
  const source = elements
    .map(normalizeComponent)
    .filter(Boolean)
    .sort((a, b) => a.nominal - b.nominal);

  // Map<nominalEntero, mejores combinaciones>. Se actualiza elemento a elemento,
  // por lo que un elemento físico nunca puede repetirse en la misma combinación.
  const states = new Map();
  states.set(0, [{ items: [], key: '', ...combinationMetrics([]) }]);

  for (const element of source) {
    const elementKey = Math.round(element.nominal * scale);
    const snapshot = [...states.entries()].sort((a, b) => b[0] - a[0]);

    for (const [sumKey, combinations] of snapshot) {
      const newKey = sumKey + elementKey;
      if (newKey > maxKey) continue;

      for (const combination of combinations) {
        if (combination.elementCount >= maxElements) continue;
        const items = [...combination.items, element];
        const metrics = combinationMetrics(items);
        const candidate = {
          items,
          ...metrics,
          key: items.map(item => item.id).sort().join('|')
        };
        const bucket = states.get(newKey) || [];
        keepBest(bucket, candidate, maxAlternativesPerNominal);
        states.set(newKey, bucket);
      }
    }
  }

  const catalog = [];
  for (const [sumKey, combinations] of states.entries()) {
    if (sumKey === 0) continue;
    const nominal = sumKey / scale;
    if (nominal < minValue - resolution / 2 || nominal > maxValue + resolution / 2) continue;
    const sorted = [...combinations].sort(rankCombination);
    catalog.push({
      nominal,
      best: sorted[0],
      alternatives: sorted,
      alternativeCount: sorted.length
    });
  }

  catalog.sort((a, b) => a.nominal - b.nominal);
  return {
    generatedAt: new Date().toISOString(),
    resolution,
    minNominal: minValue,
    maxNominal: maxValue,
    maxElements,
    maxAlternativesPerNominal,
    elementCount: source.length,
    nominalCount: catalog.length,
    catalog
  };
}

export function findBestCombinationForTarget(elements, target, {
  tolerance = 0.0005,
  maxElements = 6,
  maxAlternatives = 5
} = {}) {
  const nominal = num(target);
  if (!(nominal > 0)) return null;
  const resolution = Math.min(0.001, Math.max(tolerance, 0.000001));
  const result = generateCombinationCatalog({
    elements,
    minNominal: Math.max(0, nominal - tolerance),
    maxNominal: nominal + tolerance,
    maxElements,
    maxAlternativesPerNominal: maxAlternatives,
    resolution
  });
  return result.catalog
    .sort((a, b) => Math.abs(a.nominal - nominal) - Math.abs(b.nominal - nominal))[0] || null;
}

export async function saveCombinationCatalog(sb, {
  patronId,
  certificateId = null,
  modelId = null,
  catalogResult,
  replaceExisting = true
} = {}) {
  if (!catalogResult?.catalog) throw new Error('Catálogo de combinaciones no válido.');
  if (replaceExisting) {
    let query = sb.from('mc_patron_combinaciones').delete().eq('patron_id', patronId);
    if (certificateId) query = query.eq('certificado_id', certificateId);
    const { error } = await query;
    if (error) throw error;
  }

  const rows = [];
  for (const nominalEntry of catalogResult.catalog) {
    nominalEntry.alternatives.forEach((combination, index) => {
      rows.push({
        patron_id: patronId,
        certificado_id: certificateId,
        modelo_id: modelId,
        nominal_objetivo: nominalEntry.nominal,
        valor_certificado_total: combination.value,
        correccion_total: combination.correction,
        incertidumbre_expandida: combination.uncertainty,
        factor_k: combination.items[0]?.factorK || 2,
        numero_elementos: combination.elementCount,
        elementos: combination.items,
        ranking: index + 1,
        estado: 'ACTIVO'
      });
    });
  }

  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    const { error } = await sb.from('mc_patron_combinaciones').insert(rows.slice(i, i + batchSize));
    if (error) throw error;
  }
  return rows.length;
}
