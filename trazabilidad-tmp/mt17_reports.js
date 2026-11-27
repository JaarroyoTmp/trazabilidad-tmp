import './config.mjs';

const table = () => window.supabase.from('calibraciones_mt17');

export function mt17ReportNumber({id, fecha}) {
  return 'MT17-' + fecha.replaceAll('-', '') + '-' + id.slice(0, 8).toUpperCase();
}

export async function loadCloudMT17(id) {
  const {data, error} = await table().select('id,instrumento_id,fecha,resultado,equipo_snapshot,datos').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function publishMT17(record) {
  const {error} = await table().insert(record);
  if (!error) return;
  // A request can reach Supabase even when its response is lost.
  const stored = await loadCloudMT17(record.id);
  if (!stored) throw error;
}

export async function listCloudMT17() {
  const records = [];
  for (let offset = 0; ; offset += 200) {
    const {data, error} = await table()
      .select('id,fecha,resultado,equipo_snapshot,operario:datos->>operario,criterio:datos->criterio->>document')
      .order('fecha', {ascending:false}).order('id').range(offset, offset + 199);
    if (error) throw error;
    records.push(...data);
    if (data.length < 200) return records;
  }
}

function escape(value) {
  return String(value ?? '—').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[char]);
}

const format = new Intl.NumberFormat('es-ES', {maximumFractionDigits: 9});
const mm = value => Number.isFinite(value) ? format.format(value) : '—';
const status = accepted => accepted ? 'APTO' : 'NO APTO';

function reportTable(title, headers, rows) {
  return `<h3>${title}</h3><table><thead><tr>${headers.map(h => `<th scope="col">${escape(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map(value => `<td>${escape(value)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function buildCalibratorReport(record) {
  const {equipo_snapshot: equipo, datos} = record;
  const {operario, ambiente, patron, criterio, evaluacion, lecturas} = datos;
  const fmtDate = date => date.split('-').reverse().join('/');
  const reportNumber = mt17ReportNumber(record);
  const result = flag => flag ? 'Cumple' : 'No cumple';
  const measurements = evaluacion.points.map((point, i) => [
    mm(point.nominalMm), ...lecturas[i].map(mm), mm(point.meanMm), mm(point.deviationMm)
  ]);
  const decisions = evaluacion.points.map(point => [
    mm(point.nominalMm), mm(point.referenceCorrectionMm), mm(point.bankExpandedMm), mm(point.bankK),
    mm(point.correctionMm), mm(point.expandedMm), result(point.correctionAccepted), result(point.uncertaintyAccepted)
  ]);
  return `<!doctype html>
<html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(reportNumber)} · Calibración de reloj comparador</title>
<style>
body{max-width:1020px;margin:auto;padding:24px;font:14px/1.45 system-ui,sans-serif;color:#10243c} h2,h3{break-after:avoid}
table{width:100%;border-collapse:collapse}td,th{padding:6px;text-align:right;border-bottom:1px solid #aebdce}th{background:#edf4ff}
tr{break-inside:avoid}thead{display:table-header-group}@media print{body{padding:0;font-size:10pt}td,th{padding:4px}}
</style>
<header><p>Talleres Mecánicos Paramio · Trazabilidad Metrológica</p>
<h1>Informe de calibración de reloj comparador</h1>
<p>${escape(reportNumber)} · ${escape(fmtDate(record.fecha))} · MT17</p></header>
<h2>Resultado · ${escape(record.resultado)}</h2>
<p>Equipo ${escape(equipo.codigo)} · ${escape(equipo.descripcion)} · ${escape(equipo.fabricante)}.
Rango de la ficha 0–${mm(datos.equipo.alcanceMm)} mm · División de escala ${mm(criterio.divisionMm)} mm · Operario ${escape(operario)}.</p>
<p>Alcance del informe: ${criterio.points.map(mm).join(' / ')} mm. El dictamen corresponde a estos tres puntos.</p>
<p>Mayor |corrección| ${mm(evaluacion.maxCorrectionMm)} mm · Mayor U ${mm(evaluacion.maxExpandedMm)} mm.</p>
<h2>Método y trazabilidad</h2>
<p>${escape(criterio.document)}. Patrón ${escape(patron.nombre)} · ${escape(patron.codigo)} ·
Certificado ${escape(patron.certificado)}, válido hasta ${escape(fmtDate(patron.hasta))}. Se utiliza la envolvente Us para corrección global nula.</p>
<p>Montaje y puesta a cero comprobados · Inicio ${mm(ambiente.temperatura[0])} °C y ${mm(ambiente.humedad[0])} % HR ·
Cierre ${mm(ambiente.temperatura[1])} °C y ${mm(ambiente.humedad[1])} % HR.</p>
${reportTable('Lecturas del reloj (mm)', ['Nominal','L1','L2','L3','L4','L5','Media','s'], measurements)}
${reportTable('Corrección, incertidumbre y decisión', ['Nominal (mm)','C patrón (mm)','Us patrón (mm)','k patrón','Corrección (mm)','U (mm)','Corrección','Incertidumbre'], decisions)}
<h2>Cálculo y límites</h2>
<p>Corrección = media − (nominal + corrección del patrón).
U = k × √[(Us patrón / k patrón)² + s²/5 + D²/3].
s es la desviación típica muestral y D el valor de división de escala registrado. Factor de cobertura k = ${mm(evaluacion.k)} para cinco lecturas.</p>
<p>APTO si en los tres puntos |corrección| ≤ ${mm(criterio.limitMm)} mm y U ≤ ${mm(criterio.maxExpandedMm)} mm.
Cada límite se comprueba por separado según la pauta Calibrator.</p>
</html>`;
}

export function buildMT17Report(record) {
  if (record.datos.version === 4) return buildCalibratorReport(record);
  const {equipo_snapshot: equipment, datos} = record;
  const {operario, ambiente, patron, criterio, evaluacion, recorrido, repetibilidad, equipo} = datos;
  const number = mt17ReportNumber(record);
  const automatic = datos.version >= 2;
  const pending = record.resultado === 'PENDIENTE';
  const title = pending ? 'Registro de ensayo de reloj comparador' : 'Informe de calibración de reloj comparador';
  const budget = datos.presupuesto;
  const detailed = datos.version >= 3;
  const partial = pending && !budget;
  const sections = recorrido.map((group, direction) => reportTable(direction === 0 ? 'Subida' : 'Bajada',
    ['Punto', 'Banco', 'Reloj', 'Corrección', ...(detailed ? ['u banco', 'u térmica', 'u alineación', 'u combinada'] : ['U del banco (k=2)']),
      partial ? 'U parcial' : 'U', ...(automatic ? ['k'] : []), '|Corrección| + U', 'Decisión'],
    group.map((row, index) => {
      const point = evaluacion?.points?.[direction]?.[index];
      return [row.target, row.bank, row.indicator, point?.correctionMm,
        ...(detailed ? [point?.bankStandardMm, point?.thermalStandardMm, point?.alignmentStandardMm,
          point?.combinedStandardMm] : [row.bankExpandedMm]),
        partial ? point?.calculatedExpandedMm : point?.expandedMm,
        ...(automatic ? [point?.k] : []), pending ? null : point?.guardedErrorMm]
        .map(mm).concat(pending ? '—' : status(point.accepted));
    })));
  const repeats = repetibilidad.map((group, index) => reportTable(index === 0 ? 'Punto superior' : 'Punto inferior',
    ['Toma', 'Banco', 'Reloj', 'Reloj − banco'],
    group.map((row, i) => [i + 1, mm(row.bank), mm(row.indicator), mm(row.deviationMm)])));

  return `<!doctype html>
<html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(number)} · ${title}</title>
<style>
body{max-width:1020px;margin:auto;padding:24px;font:14px/1.45 system-ui,sans-serif;color:#10243c}
h1,h2,h3{line-height:1.2}h2,h3{break-after:avoid}table{width:100%;border-collapse:collapse;margin-bottom:18px}td,th{padding:6px;text-align:right;border-bottom:1px solid #aebdce}th{background:#edf4ff}tr{break-inside:avoid}thead{display:table-header-group}
.summary{padding:10px 14px;border:1px solid #aebdce}
@media print{body{padding:0;font-size:10pt}td,th{padding:4px}}
</style>
<header><p>Talleres Mecánicos Paramio · Trazabilidad Metrológica</p><h1>${title}</h1>
<p>${escape(number)} · MT17 · ${escape(record.fecha.split('-').reverse().join('/'))}</p></header>
<section class="summary"><h2>Resultado · ${escape(record.resultado)}</h2>
<p>Equipo ${escape(equipment.codigo)} · ${escape(equipment.descripcion)} · ${escape(equipment.fabricante)}<br>
Rango 0–${mm(equipo.alcanceMm)} mm · División de escala ${mm(equipo.divisionMm)} mm · Operario ${escape(operario)}</p>
${pending ? `<p>Ensayo pendiente de dictamen de conformidad.</p><ul>${(datos.pendientes ?? []).map(reason => `<li>${escape(reason)}</li>`).join('')}</ul>`
  : `<p>Mayor |corrección| + U: ${mm(evaluacion.maxGuardedMm)} mm · Mayor U: ${mm(evaluacion.maxExpandedMm)} mm</p>`}
${evaluacion?.comparablePoints ? `<p>Diferencia máxima subida/bajada: ${mm(evaluacion.maxHysteresisMm)} mm en ${evaluacion.comparablePoints} posiciones coincidentes.</p>` : ''}
${datos.ensayo_origen ? `<p>Identificador del ensayo de origen: ${escape(datos.ensayo_origen)}.</p>` : ''}</section>
<h2>Método y trazabilidad</h2>
<p>Procedimiento ${escape(datos.metodo)} (§5.7, §5.8, §6.1 y tabla 13, anexo 8.4). Patrón ${escape(patron.nombre)} · ${escape(patron.codigo)} · Certificado ${escape(patron.certificado)}.</p>
<p>Adaptador fijo, alineación del palpador y puesta a cero confirmados. Inicio ${mm(ambiente.temperatura[0])} °C y ${mm(ambiente.humedad[0])} % HR. Cierre ${mm(ambiente.temperatura[1])} °C y ${mm(ambiente.humedad[1])} % HR.</p>
<h2>Criterio e incertidumbre</h2>
${criterio ? `<p>Referencia documentada: ${escape(criterio.document)}. Límite simétrico ±${mm(criterio.limitMm)} mm.
${criterio.maxExpandedMm === null ? '' : `Incertidumbre máxima admitida ${mm(criterio.maxExpandedMm)} mm.`}</p>` : ''}
<p>Regla binaria con banda de guarda (ILAC G8:09/2019). APTO si todos los puntos de subida y bajada cumplen
|corrección| + U ≤ límite y, cuando aplica, U ≤ incertidumbre máxima.</p>
<p>Corrección = desviación inicial − (indicación del reloj − indicación del banco).</p>
${automatic ? `<p>Presupuesto de incertidumbre: ${escape(budget?.document ?? 'pendiente')}.
U = k × √[(U banco/2)² + u escala² + u repetibilidad² + u térmica² + u alineación² + u deriva²].
${partial ? 'La U parcial usa los términos disponibles y se indica sin redondeo a la división de escala.'
  : 'La U de la tabla se redondea por exceso a la división de escala.'}
${evaluacion ? `Mayor U calculada antes de redondear ${mm(evaluacion.maxCalculatedExpandedMm)} mm.` : 'Cálculo pendiente de revisión de las condiciones del ensayo.'}</p>
<p>u escala = ${mm(evaluacion?.scaleStandardMm)} mm · s<sub>R</sub> = ${mm(evaluacion?.repeatabilityMm)} mm ·
u repetibilidad = ${mm(evaluacion?.repeatStandardMm)} mm · u deriva = ${mm(evaluacion?.driftStandardMm)} mm ·
Ángulo máximo del montaje ${mm(budget?.alignmentMaxDegrees)}°.</p>`
  : `<p>U = k × √[(U banco/2)² + u escala² + u repetibilidad² + u adicional²].
k = ${mm(criterio.k)} · u escala = ${mm(evaluacion?.scaleStandardMm)} mm · s<sub>R</sub> = ${mm(evaluacion?.repeatabilityMm)} mm · u repetibilidad = ${mm(evaluacion?.repeatStandardMm)} mm · u adicional = ${mm(criterio.otherStandardMm)} mm.</p>`}
<h2>Recorrido de la escala (mm)</h2>${sections.join('')}
<h2>Tomas de repetibilidad (mm)</h2>${repeats.join('')}
</html>`;
}

export function downloadMT17(record) {
  const url = URL.createObjectURL(new Blob([buildMT17Report(record)], {type:'text/html;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = mt17ReportNumber(record) + '.html';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
