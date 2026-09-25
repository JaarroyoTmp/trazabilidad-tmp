/* CT-001 Rev. A · Certificado Oficial de Calibración TMP
 * Motor documental común. El certificado muestra información metrológica, no mensajes internos del software.
 */
(function(global){
  const U = global.TMPCertUtils;
  const Layout = global.TMPCertificateLayout;
  const VERSION = 'CT001_REV_A';

  function safeArray(v){ return Array.isArray(v) ? v : []; }
  function cleanText(v, fallback='-'){
    const s = U.pick(v, fallback);
    return String(s).replace(/TMP_CERTIFICATE_ENGINE|TMP_THREAD|CORE|ENGINE|PARSER|BORRADOR|NO CERTIFICABLE/gi,'').trim() || fallback;
  }
  function buildPayload(input={}){
    const core = input.core || {};
    const s = core.summary || {};
    const t = core.traceability || {};
    const proc = core.procedure || {};
    const readings = input.readings || {};
    const pass = U.readArr(readings.PASA);
    const nopass = U.readArr(readings.NO_PASA);
    const pMean = U.mean(pass), nMean = U.mean(nopass);
    const pStd = U.std(pass), nStd = U.std(nopass);
    const pTarget = U.pick(s.pass_target_trimos_mm, s.trimos_target_pasa, s.objective_pass_trimos, s.passTarget, null);
    const nTarget = U.pick(s.no_pass_target_trimos_mm, s.trimos_target_no_pasa, s.objective_nopass_trimos, s.noPassTarget, null);
    const decisionRaw = U.pick(s.global_decision, input.decision, 'Pendiente');
    const decision = decisionRaw === 'OK' ? 'APTO' : decisionRaw === 'NOK' ? 'NO APTO' : (['APTO','NO APTO','INDETERMINADO'].includes(decisionRaw) ? decisionRaw : 'INDETERMINADO');
    const now = new Date();
    const eq = input.equipment || core.equipment || {};
    const frequency = Number(eq.frecuencia_calibracion_meses || eq.frecuencia_meses || 12);
    const standards = proc.standards || proc.norms || [];
    const standardsText = Array.isArray(standards) && standards.length ? standards.join(' · ') : (s.thread_system === 'METRIC_ISO' ? 'ISO 68-1 · ISO 724 · ISO 965 · ISO 1502 · ILAC-G8 · ISO 14253-1 · GUM' : U.pick(s.standard, s.thread_system, 'Normativa aplicable según designación'));
    const designation = U.pick(s.designation, core.parsed?.normalized, eq.rango, '-');
    const Uexp = U.pick(s.U_mm, core.uncertainty?.global_U_max_mm, core.uncertainty?.U_mm, null);
    const certNo = input.certificate_number || (global.TMPCertificateNumbering ? global.TMPCertificateNumbering.build(input) : U.certNo(input));

    const payload = {
      document_code: 'CT-001 Rev. A',
      certificate_number: certNo,
      issue_date: input.issue_date || U.dateES(now),
      issue_time: input.issue_time || U.timeES(now),
      calibration_date: input.calibration_date || U.dateES(now),
      next_calibration_date: input.next_calibration_date || U.dateES(U.addMonths(now, Number.isFinite(frequency) && frequency > 0 ? frequency : 12)),
      page_count: 2,
      operator: U.pick(input.operator, core.operator, 'Operador de metrología'),
      reviewer: U.pick(input.reviewer, 'Responsable de calidad / metrología'),
      client: U.pick(eq.propietario, eq.cliente, input.client, 'Talleres Mecánicos Paramio'),
      laboratory: 'Laboratorio de Metrología TMP',
      equipment: {
        code: U.pick(eq.codigo, core.equipment?.codigo, '-'),
        description: U.pick(eq.descripcion, core.equipment?.descripcion, '-'),
        manufacturer: U.pick(eq.fabricante, eq.marca, core.equipment?.fabricante, 'No indicado'),
        model: U.pick(eq.modelo, core.equipment?.modelo, 'No indicado'),
        serial: U.pick(eq.numero_serie, eq.serie, eq.serial, 'No indicado'),
        range: U.pick(eq.rango, core.equipment?.rango, designation, '-'),
        resolution: U.pick(eq.resolucion, eq.precision, '-'),
        location: U.pick(eq.ubicacion, 'Laboratorio')
      },
      thread: {
        designation,
        class: U.pick(s.class, core.parsed?.class, '-'),
        family: U.pick(s.family, core.parsed?.family, '-'),
        system: U.pick(s.thread_system, core.parsed?.thread_system, '-'),
        pitch: U.pick(s.pitch_mm, '-'),
        tpi: U.pick(s.tpi, '-'),
        roller: U.pick(s.rodillo_mm, s.recommended_wire_mm, null),
        d2_basic: U.pick(s.d2_basic_mm, s.pitch_diameter_basic_mm, null)
      },
      environment: {
        temperature: U.pick(input.temperature, core.environment?.temperature, '20 ± 1 °C'),
        humidity: U.pick(input.humidity, core.environment?.humidity, 'No registrada'),
        stabilization: U.pick(input.stabilization, 'Equipo estabilizado en sala de metrología')
      },
      procedure: {
        title: cleanText(proc.title || proc.name, 'Calibración de tampón roscado PASA / NO PASA'),
        method: 'Método de tres hilos / rodillos mediante banco Trimos certificado',
        standards: standardsText,
        decision_rule: 'ILAC-G8 / ISO 14253-1',
        uncertainty_model: 'Evaluación conforme a GUM con k = 2'
      },
      traceability: {
        bank: t.selected_bank || null,
        rollers: t.selected_rollers || null,
        score: t.score || null
      },
      accessories: {
        rollers: t.selected_rollers || null
      },
      results: {
        pass_target: U.finite(pTarget) ? Number(pTarget) : null,
        nopass_target: U.finite(nTarget) ? Number(nTarget) : null,
        pass_readings: pass,
        nopass_readings: nopass,
        pass_mean: pMean,
        nopass_mean: nMean,
        pass_error: (pMean !== null && U.finite(pTarget)) ? pMean - Number(pTarget) : null,
        nopass_error: (nMean !== null && U.finite(nTarget)) ? nMean - Number(nTarget) : null,
        pass_std: pStd,
        nopass_std: nStd,
        U: U.finite(Uexp) ? Number(Uexp) : null,
        k: 2,
        decision,
        decision_raw: decisionRaw
      },
      uncertainty: {
        pattern: U.pick(core.uncertainty?.u_banco_mm, core.uncertainty?.u_bank_mm, core.traceability?.selected_bank?.u_standard_mm, '-'),
        resolution: U.pick(core.uncertainty?.u_resolution_mm, '-'),
        repeatability: U.pick(core.uncertainty?.u_repeatability_mm, '-'),
        temperature: U.pick(core.uncertainty?.u_temperature_mm, '-'),
        combined: U.pick(core.uncertainty?.u_c_mm, '-'),
        expanded: U.finite(Uexp) ? Number(Uexp) : null,
        k: 2
      },
      warnings: safeArray(core.warnings).filter(w => !/engine|parser|core|certificable|borrador/i.test(String(w))),
      raw: core
    };
    payload.certificate_hash = global.TMPCertificateNumbering ? global.TMPCertificateNumbering.hash(`${payload.certificate_number}|${payload.equipment.code}|${payload.results.decision}|CT001`) : U.hash(`${payload.certificate_number}|${payload.equipment.code}|${payload.results.decision}|CT001`);
    payload.verification_url = global.TMPCertificateNumbering ? global.TMPCertificateNumbering.verificationUrl(payload) : `TMP-CERT:${payload.certificate_number}:${payload.certificate_hash}`;
    return payload;
  }
  function procedureCard(p){
    return `<div class="card"><h3>Procedimiento y normas aplicadas</h3><p class="declaration">${U.esc(p.procedure.title)} realizada mediante banco Trimos certificado. El montaje de lectura se efectúa con hilos/rodillos seleccionados según la designación de la rosca.</p><table class="kv">${U.row('Método',p.procedure.method)}${U.row('Normas / referencias',p.procedure.standards)}${U.row('Regla de decisión',p.procedure.decision_rule)}${U.row('Modelo de incertidumbre',p.procedure.uncertainty_model)}</table></div>`;
  }
  function observations(p){
    const base = [
      'Los resultados indicados corresponden únicamente al instrumento calibrado y a las condiciones existentes durante la calibración.',
      'La trazabilidad metrológica del procedimiento MT16 procede del banco Trimos certificado utilizado como patrón de referencia.',
      'Los rodillos/hilos indicados se registran como accesorios empleados para garantizar la reproducibilidad del montaje.',
      'La incertidumbre expandida se declara con k = 2, salvo indicación expresa en contrario.'
    ];
    return [...base, ...(p.warnings || [])].filter(Boolean).map(x=>`<li>${U.esc(x)}</li>`).join('');
  }
  function pageOne(p, kind){
    const title = kind === 'NOK' ? 'Informe técnico de no conformidad' : 'Certificado de calibración';
    return Layout.sheet(`
      ${global.TMPCertificateHeader.render(p,1,title)}
      ${global.TMPCertificateDecision.hero(p)}
      <div class="summary-kpi"><div class="kpi"><span>U(k=2)</span><b>${U.mm(p.results.U,6)}</b></div><div class="kpi"><span>Próxima calibración</span><b>${U.esc(p.next_calibration_date)}</b></div><div class="kpi"><span>Regla</span><b>ILAC-G8</b></div><div class="kpi"><span>Documento</span><b>${U.esc(p.document_code)}</b></div></div>
      ${global.TMPCertificateIdentification.render(p)}
      ${global.TMPCertificateEnvironment.render(p)}
      ${procedureCard(p)}
      ${global.TMPCertificateTraceability.render(p)}
      ${global.TMPThreadGaugeBlock.render(p)}
      ${global.TMPCertificateResults.render(p)}
      ${global.TMPCertificateDecision.render(p)}
      <div class="grid"><div>${global.TMPCertificateSignatures.render(p)}</div><div class="card"><h3>Verificación digital</h3>${U.qrBox(p.verification_url)}<p class="declaration">Escanee este código para verificar la autenticidad del documento, consultar su estado e histórico asociado. Hash: <b>${U.esc(p.certificate_hash)}</b></p></div></div>
      ${global.TMPCertificateFooter.render(p,1)}
    `);
  }
  function pageTwo(p){
    p.results = p.results || {}; p.thread = p.thread || {}; p.procedure = p.procedure || {};
    return Layout.sheet(`
      ${global.TMPCertificateHeader.render(p,2,'Anexo técnico')}
      <div class="annex-title"><h2>Anexo técnico metrológico</h2><p>Lecturas, cálculo de error, incertidumbre y regla de decisión</p></div>
      <div class="grid"><div class="card"><h3>Cálculo PASA</h3><table class="kv">${U.row('Objetivo',U.mm(p.results.pass_target,6))}${U.row('Media',U.mm(p.results.pass_mean,6))}${U.row('Error',U.signedMm(p.results.pass_error,6))}${U.row('s repetibilidad',U.mm(p.results.pass_std,6))}${U.row('U(k=2)',U.mm(p.results.U,6))}</table></div><div class="card"><h3>Cálculo NO PASA</h3><table class="kv">${U.row('Objetivo',U.mm(p.results.nopass_target,6))}${U.row('Media',U.mm(p.results.nopass_mean,6))}${U.row('Error',U.signedMm(p.results.nopass_error,6))}${U.row('s repetibilidad',U.mm(p.results.nopass_std,6))}${U.row('U(k=2)',U.mm(p.results.U,6))}</table></div></div>
      ${global.TMPCertificateResults.uncertainty(p)}
      ${global.TMPCertificateResults.formulas()}
      <div class="grid"><div>${global.TMPCertificateDecision.rule(p)}</div><div class="card"><h3>Datos técnicos de rosca</h3><table class="kv">${U.row('Designación',p.thread.designation)}${U.row('Clase',p.thread.class)}${U.row('Sistema',p.thread.system)}${U.row('Familia',p.thread.family)}${U.row('Paso / TPI',U.pick(p.thread.pitch,p.thread.tpi,'-'))}${U.row('D2 básico',U.mm(p.thread.d2_basic,6))}${U.row('Rodillo / hilo',U.mm(p.thread.roller,3))}</table></div></div>
      <div class="card"><h3>Observaciones técnicas</h3><div class="obs"><ul>${observations(p)}</ul></div></div>
      <div class="card"><h3>Declaración documental</h3><p class="declaration">Este documento ha sido generado automáticamente a partir de los datos registrados en la calibración. La información técnica se conserva asociada al registro digital del instrumento para consulta histórica, trazabilidad y auditoría.</p></div>
      ${global.TMPCertificateFooter.render(p,2)}
    `,'page-break');
  }
  function renderCertificate(input, kind='CERTIFICADO'){
    const p = buildPayload(input);
    const title = `${kind === 'NOK' ? 'Informe NOK' : 'Certificado'} ${p.certificate_number}`;
    return Layout.document(pageOne(p,kind) + pageTwo(p), title);
  }
  function openCertificate(input, kind='CERTIFICADO'){
    const core = input?.core || {};
    const dec = core?.summary?.global_decision || input?.decision;
    if(kind !== 'NOK' && (!core?.can_emit_full_certificate || dec !== 'OK')) return {ok:false, blocked:true, reason:'CERTIFICATE_NOT_AUTHORIZED', html:''};
    if(kind === 'NOK' && dec !== 'NOK') return {ok:false, blocked:true, reason:'NOK_REPORT_NOT_AUTHORIZED', html:''};
    const html = renderCertificate(input, kind);
    const w = window.open('', '_blank');
    if(!w) return {ok:false, html};
    w.document.open(); w.document.write(html); w.document.close();
    return {ok:true, html};
  }
  global.TMPCertificatePayloadBuilder = { VERSION, buildPayload };
  global.TMPCertificateEngine = { VERSION, buildPayload, renderCertificate, openCertificate };
})(window);
