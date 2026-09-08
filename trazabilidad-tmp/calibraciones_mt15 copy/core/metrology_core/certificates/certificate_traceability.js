(function(global){
  const U = global.TMPCertUtils;
  function val(item, ...keys){
    if(!item) return '-';
    for(const k of keys){ if(item[k] !== undefined && item[k] !== null && item[k] !== '') return item[k]; }
    return '-';
  }
  function renderBank(bank){
    if(!bank){
      return `<div class="trace-card pattern"><span class="role">Patrón metrológico</span><h4>Banco Trimos certificado</h4><div class="trace-status">Datos del banco no enlazados</div><p class="declaration">El procedimiento MT16 utiliza el banco Trimos certificado como patrón trazable. Sus datos deben quedar asociados a la calibración.</p></div>`;
    }
    return `<div class="trace-card pattern"><span class="role">Patrón metrológico</span><h4>${U.esc(val(bank,'descripcion','nombre','description','designation','modelo','Banco Trimos'))}</h4><div class="trace-status">Banco utilizado como referencia trazable</div><table class="kv"><tr><th>Código</th><td>${U.esc(val(bank,'codigo','id','code'))}</td></tr><tr><th>Certificado</th><td>${U.esc(val(bank,'certificado','certificate','certificado_numero'))}</td></tr><tr><th>Vigencia</th><td>${U.esc(val(bank,'fecha_vencimiento','vigencia','vigente'))}</td></tr><tr><th>Corrección</th><td>${U.esc(val(bank,'correccion','correction','correccion_mm'))}</td></tr><tr><th>U(k=2)</th><td>${U.esc(val(bank,'U','u','u_k2','incertidumbre','incertidumbre_mm'))}</td></tr></table></div>`;
  }
  function renderAccessory(p){
    const th = p.thread || {};
    const acc = p.traceability?.rollers || p.accessories?.rollers || null;
    const roller = th.roller ? 'Ø '+U.mm(th.roller,3) : '-';
    return `<div class="trace-card accessory"><span class="role">Accesorio empleado</span><h4>Rodillos / hilos de medición</h4><div class="trace-status">Útil de apoyo a la lectura</div><table class="kv"><tr><th>Diámetro requerido</th><td>${U.esc(roller)}</td></tr><tr><th>Juego / ID</th><td>${U.esc(acc ? val(acc,'codigo','id','code','juego') : 'No indicado')}</td></tr><tr><th>Función</th><td>Montaje para lectura del diámetro medio</td></tr><tr><th>Consideración</th><td>Accesorio, no patrón metrológico</td></tr></table></div>`;
  }
  function renderInstrument(p){
    return `<div class="trace-card instrument"><span class="role">Instrumento calibrado</span><h4>${U.esc(p.equipment.description)}</h4><div class="trace-status">${U.esc(p.equipment.code)}</div><table class="kv"><tr><th>Rango / designación</th><td>${U.esc(p.equipment.range)}</td></tr><tr><th>Fabricante</th><td>${U.esc(p.equipment.manufacturer)}</td></tr><tr><th>Resultado</th><td>${U.esc(p.results.decision)}</td></tr></table></div>`;
  }
  global.TMPCertificateTraceability = {
    render(p){
      const bank = p.traceability?.bank || null;
      return `<div class="card"><h3>Cadena de trazabilidad metrológica</h3>
        <p class="declaration"><b>Criterio MT16 TMP:</b> el banco Trimos certificado es el patrón trazable que aporta corrección e incertidumbre. Los rodillos/hilos son accesorios de medición seleccionados por el procedimiento y registrados para reproducibilidad del montaje.</p>
        <div class="trace-chain">${renderBank(bank)}<div class="trace-arrow">→</div>${renderAccessory(p)}<div class="trace-arrow">→</div>${renderInstrument(p)}</div>
      </div>`;
    }
  };
})(window);
