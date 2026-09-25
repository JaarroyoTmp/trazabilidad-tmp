(function(global){
  const U = global.TMPCertUtils;
  function cls(p){ return U.statusClass(p.results.decision); }
  function label(decision){ return decision === 'NO APTO' ? 'Instrumento no conforme' : (decision === 'APTO' ? 'Instrumento conforme' : 'Resultado indeterminado'); }
  global.TMPCertificateDecision = {
    hero(p){
      const c = cls(p); const icon = c==='ok'?'✓':(c==='bad'?'✕':'!');
      return `<div class="hero-decision ${c}"><div class="check">${icon}</div><div><div class="big">${U.esc(p.results.decision)}</div><div class="line">${U.esc(label(p.results.decision))}. Dictamen emitido conforme a ${U.esc(p.procedure.decision_rule)}.</div><div class="line">Incertidumbre expandida: <b>${U.mm(p.results.U,6)}</b> · k=${U.esc(p.results.k)} · nivel de confianza aprox. 95%.</div></div><div class="mini"><span>Resultado</span><b>${U.esc(p.results.decision)}</b><span>${U.esc(p.calibration_date)}</span></div></div>`;
    },
    render(p){
      const c = cls(p);
      return `<div class="decision ${c}"><div class="muted">DICTAMEN FINAL</div><div class="big">${U.esc(p.results.decision)}</div><div class="text">La conformidad se ha evaluado considerando los resultados obtenidos, la incertidumbre expandida y la regla de decisión indicada.</div></div>`;
    },
    rule(p){
      return `<div class="card"><h3>Regla de decisión</h3><table class="kv">${U.row('Criterio',p.procedure.decision_rule)}${U.row('Aplicación','Comparación del error de calibración frente al criterio de aceptación, considerando la incertidumbre expandida declarada.')}${U.row('Cobertura','k = '+U.esc(p.results.k)+' · nivel de confianza aproximado 95%')}${U.row('Dictamen',p.results.decision)}</table><p class="declaration">La incertidumbre expandida indicada se ha calculado con un factor de cobertura k = 2, correspondiente aproximadamente a un nivel de confianza del 95 %, salvo indicación expresa en contrario.</p></div>`;
    }
  };
})(window);
