(function(global){
  const U = global.TMPCertUtils;
  global.TMPCertificateSignatures = {
    render(p){
      return `<div class="card"><h3>Firmas y aprobación</h3><div class="sign"><div class="sig">Técnico de calibración<br><b>${U.esc(p.operator)}</b><br><small>Firma digital / registro interno</small></div><div class="sig">Responsable de calidad / metrología<br><b>${U.esc(p.reviewer)}</b><br><small>Aprobación documental</small></div></div></div>`;
    }
  };
})(window);
