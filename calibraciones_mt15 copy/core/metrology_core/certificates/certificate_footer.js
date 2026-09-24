(function(global){
  const U = global.TMPCertUtils;
  global.TMPCertificateFooter = {
    render(p,page){
      return `<footer class="footer"><div><b>${U.esc(p.laboratory)}</b><br>Este certificado se refiere exclusivamente al instrumento identificado y a las condiciones existentes en el momento de la calibración. La reproducción parcial requiere autorización del laboratorio.</div><div class="center"><b>${U.esc(p.document_code || 'CT-001 Rev. A')}</b><br>Documento generado automáticamente por el Sistema Metrológico TMP.</div><div class="right"><b>Página ${page} / ${p.page_count}</b><br>${U.esc(p.certificate_number)}</div></footer>`;
    }
  };
})(window);
