(function(global){
  const U = global.TMPCertUtils;
  global.TMPCertificateIdentification = {
    render(p){
      return `<div class="grid">
        <div class="card"><h3>Identificación administrativa</h3><table class="kv">${U.row('Cliente',p.client)}${U.row('Certificado',p.certificate_number)}${U.row('Fecha calibración',p.calibration_date)}${U.row('Fecha emisión',p.issue_date)}${U.row('Próxima calibración',p.next_calibration_date)}${U.row('Operador',p.operator)}${U.row('Revisado por',p.reviewer)}</table></div>
        <div class="card"><h3>Datos del equipo</h3><table class="kv">${U.row('Código interno',p.equipment.code)}${U.row('Descripción',p.equipment.description)}${U.row('Fabricante',p.equipment.manufacturer)}${U.row('Modelo',p.equipment.model)}${U.row('Nº serie',p.equipment.serial)}${U.row('Rango / designación',p.equipment.range)}${U.row('Resolución',p.equipment.resolution)}${U.row('Ubicación',p.equipment.location)}</table></div>
      </div>`;
    }
  };
})(window);
