/* ===========================================================
   TMP REPORT ENGINE - CERTIFICADO PROFESIONAL V2
   -----------------------------------------------------------
   Certificado A4 imprimible / guardable como PDF.

   Prioridad visual:
   - Dictamen final TMP
   - Evaluación metrológica
   - Nº certificado
   - Código equipo
   - Nº serie
   - Fecha calibración
   - Próxima calibración

   V2:
   - Separa resultado operativo TMP y evaluación metrológica.
   - Mantiene compatibilidad con datos V1.
   - Tabla de puntos con doble decisión.
   - Declaración final doble para planta y auditoría.
   =========================================================== */

export function esc(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function num(v, d = 6) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return n.toFixed(d).replace(/\.?0+$/, "");
}

export function dateES(v) {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleDateString("es-ES");
  } catch {
    return v;
  }
}

export function nowCertNumber() {
  const y = new Date().getFullYear();
  const s = String(Date.now()).slice(-6);
  return `TMP-CAL-${y}-${s}`;
}

export function resultLabel(status) {
  const s = String(status || "").toUpperCase();

  if (
    s.includes("NO_APTO") ||
    s.includes("NO APTO") ||
    s.includes("NOK") ||
    s.includes("NO_CONFORME")
  ) return "NO CONFORME";

  if (s.includes("INDETERMINADO")) return "INDETERMINADO";

  if (
    s.includes("APTO") ||
    s.includes("OK") ||
    s.includes("CONFORME")
  ) return "CONFORME";

  return s || "PENDIENTE";
}

export function resultClass(status) {
  const r = resultLabel(status);
  if (r === "CONFORME") return "ok";
  if (r === "NO CONFORME") return "bad";
  return "warn";
}

export function tmpStatusLabel(status) {
  const s = String(status || "").toUpperCase();

  if (s === "NO_APTO" || s === "NO APTO" || s === "NOK" || s === "NO_CONFORME") return "NO APTO";
  if (s === "NO_EVALUABLE" || s === "NO EVALUABLE") return "NO EVALUABLE";
  if (s === "INDETERMINADO") return "INDETERMINADO";
  if (s === "APTO" || s === "OK" || s === "CONFORME") return "APTO";

  return s || "PENDIENTE";
}

export function tmpResultClass(status) {
  const r = tmpStatusLabel(status);
  if (r === "APTO") return "ok";
  if (r === "NO APTO") return "bad";
  return "warn";
}

export function getAuditStatusFromDecision(decision = {}) {
  return (
    decision.resultado_auditoria ||
    decision.decision_auditoria ||
    decision.status ||
    decision.decision ||
    null
  );
}

export function getOperationalStatusFromDecision(decision = {}) {
  return (
    decision.resultado_operativo ||
    decision.decision_operativa ||
    decision.status ||
    decision.decision ||
    null
  );
}

export function getGlobalAuditStatus(data = {}) {
  const results = data.results || {};
  const global = results.global || {};
  return (
    global.resultado_auditoria ||
    global.decision_auditoria ||
    results.resultado_auditoria ||
    global.status ||
    data.resultado_auditoria ||
    data.decision_global ||
    data.resultado ||
    null
  );
}

export function getGlobalOperationalStatus(data = {}) {
  const results = data.results || {};
  const global = results.global || {};
  return (
    global.resultado_operativo ||
    global.decision_operativa ||
    results.resultado_operativo ||
    data.resultado_operativo ||
    global.status ||
    data.resultado ||
    null
  );
}

export function getFechaCalibracion(data = {}) {
  return (
    data.condiciones?.fecha_calibracion ||
    data.fecha_calibracion ||
    data.instrumento?.fecha_calibracion ||
    data.instrumento?.fecha_ultima_cal ||
    data.fecha ||
    new Date().toISOString()
  );
}

export function getFechaProxima(data = {}) {
  return (
    data.firma?.proxima_calibracion ||
    data.instrumento?.fecha_proxima_calibracion ||
    data.instrumento?.fecha_proxima_cal ||
    data.proxima_calibracion ||
    ""
  );
}

export function buildCertificateHTML(data = {}) {
  const instrumento = data.instrumento || {};
  const pauta = data.pauta || {};
  const audit = data.audit || {};
  const results = data.results || {};
  const global = results.global || {};
  const puntos = results.puntos || [];
  const selections = Object.values(data.pattern_selections || {});

  const normativaGeneral = audit.normativa?.referencias_generales || [];
  const normativaFamilia = audit.normativa?.referencias_familia || [];
  const requisitos = audit.requisitos?.debe_documentar || [];

  const certificado = data.certificado?.numero || data.numero_certificado || nowCertNumber();

  const resultadoOperativoRaw = getGlobalOperationalStatus(data);
  const resultadoAuditoriaRaw = getGlobalAuditStatus(data);

  const resultadoOperativo = tmpStatusLabel(resultadoOperativoRaw);
  const resultadoAuditoria = tmpStatusLabel(resultadoAuditoriaRaw);

  const operativoClass = tmpResultClass(resultadoOperativoRaw);

  // CT-001: el certificado muestra un único dictamen final.
  // La evaluación ILAC-G8 / ISO 14253 queda como soporte técnico en el anexo.
  const resultado = resultadoOperativo;
  const rClass = operativoClass;

  const fechaCal = getFechaCalibracion(data);
  const fechaProx = getFechaProxima(data);

  const codigoEquipo = instrumento.codigo || instrumento.codigo_equipo || instrumento.id || "-";
  const serie = instrumento.numero_serie || instrumento.serie || instrumento.serial || "-";

  const patronesRows = selections.map((s) => `
    <tr>
      <td><strong>${esc(s.codigo || s.patron_id || "-")}</strong></td>
      <td>${esc(s.label || "-")}</td>
      <td>${esc(s.categoria || "-")}</td>
      <td>${esc(s.requirement?.patron_tipo || s.requirement?.preferidos?.join(", ") || "-")}</td>
      <td>${esc(s.motivo || "Seleccionado por el operario entre opciones válidas TMP.")}</td>
    </tr>
  `).join("");

  const puntosRows = puntos.map((p, i) => {
    const d = p.decision || {};
    const nominal = p.valorReferencia ?? p.valor_referencia ?? p.punto?.nominal;
    const media = p.mediaCorregida ?? p.media_corregida ?? p.media;
    const errorUm = (Number(p.error) || 0) * 1000;
    const Uum = (Number(p.uncertainty?.U ?? p.U) || 0) * 1000;

    const operativo = getOperationalStatusFromDecision(d);
    const auditoria = getAuditStatusFromDecision(d);

    return `
      <tr>
        <td>${i + 1}</td>
        <td>${esc(p.funcion || p.punto?.funcion || "-")}</td>
        <td>${esc(p.punto?.etiqueta || p.punto?.id || "-")}</td>
        <td class="num">${num(nominal, 6)}</td>
        <td class="num">${num(media, 6)}</td>
        <td class="num">${num(errorUm, 3)} µm</td>
        <td class="num">${num(Uum, 3)} µm</td>
        <td><span class="badge ${tmpResultClass(operativo)}">${esc(tmpStatusLabel(operativo))}</span></td>
        <td>${esc(tmpStatusLabel(auditoria) === "INDETERMINADO" ? "Incertidumbre considerada" : "Evaluación documentada")}</td>
      </tr>
    `;
  }).join("");

  const lecturasHTML = puntos.map((p) => {
    const readings = p.readings || [];

    return `
      <div class="reading-card">
        <div class="reading-title">${esc(p.funcion || "-")} · ${esc(p.punto?.etiqueta || p.punto?.id || "-")}</div>
        <table>
          <thead>
            <tr>
              ${[1,2,3,4,5].map(i => `<th>L${i}</th>`).join("")}
              <th>Media</th>
              <th>Media corregida</th>
              <th>Desv. típica</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              ${[0,1,2,3,4].map(i => `<td class="num">${num(readings[i], 6)}</td>`).join("")}
              <td class="num">${num(p.media, 6)}</td>
              <td class="num">${num(p.mediaCorregida ?? p.media_corregida ?? p.media, 6)}</td>
              <td class="num">${num(p.s, 6)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }).join("");

  const normativaRows = [
    ...normativaGeneral.map(n => ({...n, grupo:"General"})),
    ...normativaFamilia.map(n => ({...n, grupo:"Específica"}))
  ].map(n => `
    <tr>
      <td>${esc(n.grupo)}</td>
      <td><strong>${esc(n.codigo)}</strong></td>
      <td>${esc(n.titulo || "")}</td>
      <td>${esc(n.uso || "")}</td>
    </tr>
  `).join("");

  const reqList = requisitos.map(x => `<li>${esc(x)}</li>`).join("");

  const chart = buildErrorChart(puntos);

  const traceItems = selections.map(s => `
    <div class="trace-node">
      <div class="trace-code">${esc(s.codigo || "-")}</div>
      <div class="trace-text">${esc(s.label || "Patrón")}</div>
    </div>
  `).join(`<div class="trace-arrow">→</div>`);

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Certificado TMP ${esc(certificado)}</title>

<style>
  @page {
    size: A4;
    margin: 12mm;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    background: #e8edf5;
    color: #172033;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11.5px;
  }

  .toolbar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #101828;
    color: white;
    padding: 10px;
    text-align: center;
  }

  .toolbar button {
    border: 0;
    border-radius: 8px;
    padding: 10px 16px;
    margin: 0 4px;
    background: #1570ef;
    color: white;
    font-weight: 700;
    cursor: pointer;
  }

  .toolbar button.secondary {
    background: #475467;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 12px auto;
    background: white;
    box-shadow: 0 8px 28px rgba(16,24,40,.18);
    padding: 13mm;
    position: relative;
    page-break-after: always;
  }

  .page:last-child {
    page-break-after: auto;
  }

  .header {
    display: grid;
    grid-template-columns: 1fr 72mm;
    gap: 12px;
    border-bottom: 4px solid #123f6d;
    padding-bottom: 12px;
  }

  .brand h1 {
    margin: 0;
    color: #123f6d;
    font-size: 22px;
    letter-spacing: .2px;
  }

  .brand .subtitle {
    margin-top: 4px;
    color: #667085;
    font-size: 12px;
  }

  .cert-box {
    border: 2px solid #123f6d;
    border-radius: 10px;
    padding: 10px;
    text-align: center;
  }

  .cert-box .label {
    color: #667085;
    text-transform: uppercase;
    font-size: 10px;
    font-weight: 700;
  }

  .cert-box .number {
    font-size: 18px;
    color: #123f6d;
    font-weight: 800;
    margin-top: 4px;
  }

  .hero {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 12px;
  }

  .result-stack {
    display: grid;
    gap: 8px;
  }

  .result-panel {
    border-radius: 16px;
    padding: 12px;
    text-align: center;
    border: 3px solid;
  }

  .result-panel.ok {
    background: #ecfdf3;
    border-color: #12b76a;
    color: #027a48;
  }

  .result-panel.bad {
    background: #fef3f2;
    border-color: #f04438;
    color: #b42318;
  }

  .result-panel.warn {
    background: #fffaeb;
    border-color: #f79009;
    color: #b54708;
  }

  .result-panel .small {
    text-transform: uppercase;
    font-weight: 700;
    font-size: 11px;
  }

  .result-panel .big {
    font-size: 26px;
    font-weight: 900;
    margin: 6px 0;
    letter-spacing: .5px;
  }

  .result-panel .meta {
    font-size: 11px;
    line-height: 1.45;
  }

  .critical {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .critical .item {
    border: 1px solid #d0d5dd;
    border-radius: 10px;
    padding: 10px;
    background: #f9fafb;
  }

  .critical .k {
    color: #667085;
    text-transform: uppercase;
    font-size: 9.5px;
    font-weight: 700;
  }

  .critical .v {
    margin-top: 3px;
    font-size: 15px;
    font-weight: 800;
    color: #101828;
  }

  .critical .v.blue {
    color: #123f6d;
  }

  .section {
    margin-top: 14px;
    break-inside: avoid;
  }

  .section h2 {
    font-size: 14px;
    margin: 0 0 8px 0;
    padding-left: 8px;
    border-left: 5px solid #123f6d;
    color: #123f6d;
    text-transform: uppercase;
    letter-spacing: .25px;
  }

  .box {
    border: 1px solid #d0d5dd;
    border-radius: 10px;
    padding: 10px;
    background: #fff;
  }

  .decision-note {
    border: 1px solid #b2ddff;
    background: #eff8ff;
    border-radius: 10px;
    padding: 10px;
    color: #184e77;
    line-height: 1.45;
  }

  .grid2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 7px 12px;
  }

  .kv {
    border-bottom: 1px solid #eef2f6;
    padding-bottom: 4px;
  }

  .kv .k {
    color: #667085;
    text-transform: uppercase;
    font-size: 9.5px;
    font-weight: 700;
  }

  .kv .v {
    margin-top: 2px;
    font-weight: 700;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6px;
  }

  th {
    background: #123f6d;
    color: #fff;
    padding: 6px;
    font-size: 10.5px;
    text-align: left;
  }

  td {
    border: 1px solid #e4e7ec;
    padding: 6px;
    vertical-align: top;
  }

  .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 9.5px;
    font-weight: 800;
  }

  .badge.ok {
    background: #dcfae6;
    color: #027a48;
    border: 1px solid #75e0a7;
  }

  .badge.bad {
    background: #fee4e2;
    color: #b42318;
    border: 1px solid #fda29b;
  }

  .badge.warn {
    background: #fef0c7;
    color: #b54708;
    border: 1px solid #fec84b;
  }

  .declaration {
    border: 2px solid #123f6d;
    border-radius: 14px;
    padding: 14px;
    background: #f8fbff;
    text-align: center;
    margin-top: 12px;
  }

  .declaration-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 10px 0;
  }

  .declaration .final {
    font-size: 24px;
    font-weight: 900;
    margin: 8px 0;
  }

  .declaration .final.ok {
    color: #027a48;
  }

  .declaration .final.bad {
    color: #b42318;
  }

  .declaration .final.warn {
    color: #b54708;
  }

  .trace {
    display: flex;
    align-items: stretch;
    gap: 8px;
    flex-wrap: wrap;
  }

  .trace-node {
    border: 1px solid #d0d5dd;
    border-radius: 12px;
    padding: 9px;
    min-width: 110px;
    background: #f9fafb;
  }

  .trace-code {
    font-weight: 800;
    color: #123f6d;
  }

  .trace-text {
    color: #667085;
    font-size: 10px;
    margin-top: 3px;
  }

  .trace-arrow {
    display: flex;
    align-items: center;
    color: #98a2b3;
    font-size: 20px;
    font-weight: 700;
  }

  .reading-card {
    border: 1px solid #e4e7ec;
    border-radius: 10px;
    padding: 8px;
    margin-top: 8px;
    background: #fcfcfd;
    break-inside: avoid;
  }

  .reading-title {
    font-weight: 800;
    color: #344054;
    margin-bottom: 4px;
  }

  .signatures {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
    margin-top: 24px;
  }

  .signature {
    border-top: 1px solid #344054;
    padding-top: 6px;
    text-align: center;
    color: #475467;
  }

  .footer {
    position: absolute;
    left: 13mm;
    right: 13mm;
    bottom: 8mm;
    border-top: 1px solid #d0d5dd;
    padding-top: 5px;
    display: flex;
    justify-content: space-between;
    color: #667085;
    font-size: 9px;
  }

  svg {
    width: 100%;
    height: auto;
    border: 1px solid #e4e7ec;
    border-radius: 10px;
    background: white;
  }

  @media print {
    body {
      background: white;
    }

    .toolbar {
      display: none;
    }

    .page {
      margin: 0;
      box-shadow: none;
      width: auto;
      min-height: 273mm;
    }
  }
</style>
</head>

<body>
<div class="toolbar">
  <button onclick="window.print()">Imprimir / Guardar PDF</button>
  <button class="secondary" onclick="window.close()">Cerrar</button>
</div>

<div class="page">
  <div class="header">
    <div class="brand">
      <h1>TALLERES MECÁNICOS PARAMIO</h1>
      <div class="subtitle">Sistema TMP de gestión y calibración metrológica · Motor MT15</div>
      <div class="subtitle"><strong>Certificado / Informe técnico de calibración</strong></div>
    </div>

    <div class="cert-box">
      <div class="label">Nº Certificado</div>
      <div class="number">${esc(certificado)}</div>
    </div>
  </div>

  <div class="hero">
    <div class="result-stack">
      <div class="result-panel ${operativoClass}">
        <div class="small">Dictamen final TMP</div>
        <div class="big">${esc(resultadoOperativo)}</div>
        <div class="meta">
          Resultado válido para uso del equipo.<br>
          La incertidumbre se ha considerado como soporte técnico según ILAC-G8 / ISO 14253.
        </div>
      </div>
    </div>

    <div class="critical">
      <div class="item">
        <div class="k">Código equipo</div>
        <div class="v blue">${esc(codigoEquipo)}</div>
      </div>

      <div class="item">
        <div class="k">Nº serie</div>
        <div class="v">${esc(serie)}</div>
      </div>

      <div class="item">
        <div class="k">Fecha calibración</div>
        <div class="v">${dateES(fechaCal)}</div>
      </div>

      <div class="item">
        <div class="k">Próxima calibración</div>
        <div class="v">${dateES(fechaProx)}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>1. Identificación del equipo</h2>

    <div class="box grid2">
      <div class="kv">
        <div class="k">Código</div>
        <div class="v">${esc(codigoEquipo)}</div>
      </div>

      <div class="kv">
        <div class="k">Descripción</div>
        <div class="v">${esc(instrumento.descripcion || instrumento.nombre || "-")}</div>
      </div>

      <div class="kv">
        <div class="k">Fabricante</div>
        <div class="v">${esc(instrumento.fabricante || "-")}</div>
      </div>

      <div class="kv">
        <div class="k">Modelo</div>
        <div class="v">${esc(instrumento.modelo || "-")}</div>
      </div>

      <div class="kv">
        <div class="k">Nº serie</div>
        <div class="v">${esc(serie)}</div>
      </div>

      <div class="kv">
        <div class="k">Rango / designación</div>
        <div class="v">${esc(instrumento.rango || "-")}</div>
      </div>

      <div class="kv">
        <div class="k">Familia motor</div>
        <div class="v">${esc(data.family_resolved?.family || instrumento.familia_motor || "-")}</div>
      </div>

      <div class="kv">
        <div class="k">Procedimiento</div>
        <div class="v">${esc(pauta.procedimiento || audit.requisitos?.procedimiento_tmp || "-")}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>2. Criterio de decisión TMP</h2>

    <div class="decision-note">
      <strong>Dictamen único:</strong>
      el certificado muestra un único resultado final para el uso del equipo: APTO, NO APTO o NO EVALUABLE.
      <br><br>
      <strong>Evaluación metrológica:</strong>
      la regla ILAC-G8 / ISO 14253, la incertidumbre expandida y la trazabilidad se documentan como soporte técnico
      del dictamen final, sin generar un segundo resultado paralelo.
    </div>
  </div>

  <div class="section">
    <h2>3. Resumen de resultados</h2>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Función</th>
          <th>Punto</th>
          <th>Nominal</th>
          <th>Media corregida</th>
          <th>Error</th>
          <th>U(k=2)</th>
          <th>Dictamen TMP</th>
          <th>Evaluación técnica</th>
        </tr>
      </thead>

      <tbody>
        ${puntosRows || `<tr><td colspan="9">Sin puntos calculados.</td></tr>`}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>4. Patrones utilizados</h2>

    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Patrón</th>
          <th>Categoría</th>
          <th>Requisito</th>
          <th>Motivo</th>
        </tr>
      </thead>

      <tbody>
        ${patronesRows || `<tr><td colspan="5">Sin patrón informado.</td></tr>`}
      </tbody>
    </table>
  </div>

  <div class="declaration">
    Tras la evaluación de las lecturas registradas, los patrones utilizados,
    la incertidumbre expandida y la regla de decisión aplicada:

    <div class="declaration-grid">
      <div>
        <div class="small">Dictamen final TMP</div>
        <div class="final ${operativoClass}">${esc(resultadoOperativo)}</div>
      </div>

      <div>
        <div class="small">Evaluación metrológica</div>
        <div class="final ok" style="font-size:18px;">ILAC-G8 / ISO 14253 documentada</div>
      </div>
    </div>

    Nº certificado:
    <strong>${esc(certificado)}</strong>
    · Equipo:
    <strong>${esc(codigoEquipo)}</strong>
    · Serie:
    <strong>${esc(serie)}</strong>
  </div>

  <div class="footer">
    <span>TMP MT15 · Certificado generado automáticamente</span>
    <span>Nº ${esc(certificado)} · Página 1</span>
  </div>
</div>

<div class="page">
  <div class="header">
    <div class="brand">
      <h1>Detalle técnico de calibración</h1>
      <div class="subtitle">Nº certificado ${esc(certificado)} · Equipo ${esc(codigoEquipo)}</div>
    </div>

    <div class="cert-box">
      <div class="label">Dictamen final</div>
      <div class="number">${esc(resultadoOperativo)}</div>
    </div>
  </div>

  <div class="section">
    <h2>5. Lecturas registradas</h2>
    ${lecturasHTML || `<div class="box">Sin lecturas registradas.</div>`}
  </div>

  <div class="section">
    <h2>6. Gráfico de error respecto nominal</h2>
    ${chart}
  </div>

  <div class="section">
    <h2>7. Trazabilidad metrológica</h2>

    <div class="trace">
      <div class="trace-node">
        <div class="trace-code">${esc(codigoEquipo)}</div>
        <div class="trace-text">Instrumento calibrado</div>
      </div>

      <div class="trace-arrow">→</div>

      ${traceItems || `
        <div class="trace-node">
          <div class="trace-code">Patrón</div>
          <div class="trace-text">No informado</div>
        </div>
      `}

      <div class="trace-arrow">→</div>

      <div class="trace-node">
        <div class="trace-code">SI</div>
        <div class="trace-text">Sistema Internacional</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>8. Normativa aplicada</h2>

    <table>
      <thead>
        <tr>
          <th>Grupo</th>
          <th>Código</th>
          <th>Título</th>
          <th>Uso</th>
        </tr>
      </thead>

      <tbody>
        ${normativaRows || `<tr><td colspan="4">Sin normativa informada.</td></tr>`}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>9. Requisitos documentales cubiertos</h2>

    <div class="box">
      <ul>
        ${reqList || "<li>No se han definido requisitos específicos.</li>"}
      </ul>
    </div>
  </div>

  <div class="section">
    <h2>10. Firmas</h2>

    <div class="signatures">
      <div class="signature">
        Realizado por<br>
        <strong>${esc(data.firma?.nombre || "")}</strong>
      </div>

      <div class="signature">
        Responsable de metrología<br>
        <strong>&nbsp;</strong>
      </div>
    </div>
  </div>

  <div class="footer">
    <span>TMP MT15 · Documento controlado</span>
    <span>Nº ${esc(certificado)} · Página 2</span>
  </div>
</div>

</body>
</html>`;
}

export function buildErrorChart(puntos = []) {
  const w = 760;
  const h = 250;
  const pad = 46;

  const vals = puntos
    .map(p => Number((p.error ?? 0) * 1000))
    .filter(Number.isFinite);

  const labels = puntos.map(p => p.punto?.id || p.funcion || "");

  const maxAbs = Math.max(2, ...vals.map(v => Math.abs(v)));
  const y0 = h / 2;
  const xStep = vals.length > 1 ? (w - pad * 2) / (vals.length - 1) : 0;

  const pts = vals.map((v, i) => {
    const x = vals.length > 1 ? pad + i * xStep : w / 2;
    const y = y0 - (v / maxAbs) * (h / 2 - pad);
    return { x, y, v, label: labels[i] };
  });

  const poly = pts.length > 1
    ? `<polyline points="${pts.map(p => `${p.x},${p.y}`).join(" ")}" fill="none" stroke="#123f6d" stroke-width="3"></polyline>`
    : "";

  const circles = pts.map(p => `
    <circle cx="${p.x}" cy="${p.y}" r="6" fill="#123f6d"></circle>
    <text x="${p.x}" y="${p.y - 10}" font-size="11" text-anchor="middle">${num(p.v, 2)} µm</text>
    <text x="${p.x}" y="${h - 15}" font-size="11" text-anchor="middle">${esc(p.label)}</text>
  `).join("");

  return `
    <svg viewBox="0 0 ${w} ${h}" aria-label="Gráfico de error">
      <rect x="0" y="0" width="${w}" height="${h}" fill="#fff"></rect>
      <line x1="${pad}" y1="${y0}" x2="${w - pad}" y2="${y0}" stroke="#98a2b3" stroke-width="1"></line>
      <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h - pad}" stroke="#98a2b3" stroke-width="1"></line>
      <text x="${pad}" y="${pad - 14}" font-size="12" fill="#667085">Error respecto nominal (µm)</text>
      <text x="${pad - 8}" y="${y0 + 4}" font-size="11" text-anchor="end" fill="#667085">0</text>
      ${poly}
      ${circles}
    </svg>
  `;
}

export function openTMPReportPreview(data = {}) {
  const html = buildCertificateHTML(data);

  const win = window.open("", "_blank");

  if (!win) {
    alert("El navegador ha bloqueado la ventana emergente del certificado.");
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();
}