(function(global){
  const U = global.TMPCertUtils;
  function readingsRows(r){ return [0,1,2,3,4].map(i=>`<tr><td>L${i+1}</td><td>${U.mm(r.pass_readings[i],6)}</td><td>${U.mm(r.nopass_readings[i],6)}</td></tr>`).join(''); }
  global.TMPCertificateResults = {
    render(p){
      const r = p.results;
      return `<div class="card"><h3>Resultados de calibración</h3><table class="results"><thead><tr><th>Concepto</th><th>PASA</th><th>NO PASA</th></tr></thead><tbody><tr><td>Objetivo de medida</td><td>${U.mm(r.pass_target,6)}</td><td>${U.mm(r.nopass_target,6)}</td></tr>${readingsRows(r)}<tr class="mean-row"><td>Media</td><td>${U.mm(r.pass_mean,6)}</td><td>${U.mm(r.nopass_mean,6)}</td></tr><tr><td>Error</td><td>${U.signedMm(r.pass_error,6)}</td><td>${U.signedMm(r.nopass_error,6)}</td></tr><tr><td>Desviación estándar s</td><td>${U.mm(r.pass_std,6)}</td><td>${U.mm(r.nopass_std,6)}</td></tr><tr class="total-row"><td>Incertidumbre expandida U(k=2)</td><td colspan="2">${U.mm(r.U,6)}</td></tr></tbody></table></div>`;
    },
    uncertainty(p){
      return `<div class="card"><h3>Presupuesto de incertidumbre</h3><table class="results"><thead><tr><th>Componente</th><th>Valor</th><th>Distribución / comentario</th></tr></thead><tbody><tr><td>Banco Trimos certificado</td><td>${U.esc(p.uncertainty.pattern)}</td><td>Patrón metrológico trazable del procedimiento MT16</td></tr><tr><td>Resolución</td><td>${U.esc(p.uncertainty.resolution)}</td><td>Resolución del sistema de lectura</td></tr><tr><td>Repetibilidad</td><td>${U.esc(p.uncertainty.repeatability)}</td><td>Calculada a partir de las lecturas realizadas</td></tr><tr><td>Ambiente</td><td>${U.esc(p.uncertainty.temperature)}</td><td>Condiciones ambientales de la sala</td></tr><tr><td>u combinada</td><td>${U.esc(p.uncertainty.combined)}</td><td>Combinación cuadrática de componentes</td></tr><tr class="total-row"><td>U expandida</td><td>${U.mm(p.uncertainty.expanded,6)}</td><td>k = ${U.esc(p.uncertainty.k)} · aprox. 95%</td></tr></tbody></table></div>`;
    },
    formulas(){
      return `<div class="card"><h3>Fórmulas de cálculo empleadas</h3><div class="formula-list"><div class="formula"><b>Media</b><code>x̄ = (L1 + L2 + L3 + L4 + L5) / n</code></div><div class="formula"><b>Error</b><code>E = x̄ - Valor objetivo</code></div><div class="formula"><b>Repetibilidad</b><code>u_rep = s / √n</code></div><div class="formula"><b>Resolución</b><code>u_res = resolución / √12</code></div><div class="formula"><b>Incertidumbre combinada</b><code>u_c = √(u_pat² + u_rep² + u_res² + u_amb²)</code></div><div class="formula"><b>Incertidumbre expandida</b><code>U = k · u_c ; k = 2</code></div></div></div>`;
    }
  };
})(window);
