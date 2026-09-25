(function(global){
  const U = global.TMPCertUtils;
  global.TMPCertificateEnvironment = {
    render(p){
      return `<div class="grid-4">
        <div class="card"><h3>Condición</h3><table class="kv">${U.row('Temperatura',p.environment.temperature)}</table></div>
        <div class="card"><h3>Humedad</h3><table class="kv">${U.row('HR',p.environment.humidity)}</table></div>
        <div class="card"><h3>Estabilización</h3><table class="kv">${U.row('Estado',p.environment.stabilization)}</table></div>
        <div class="card"><h3>Hora emisión</h3><table class="kv">${U.row('Hora',p.issue_time || '-')}</table></div>
      </div>`;
    }
  };
})(window);
