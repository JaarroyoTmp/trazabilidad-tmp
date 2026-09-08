(function(global){
  const U = global.TMPCertUtils;
  global.TMPThreadGaugeBlock = {
    render(p){
      const th = p.thread || {};
      return `<div class="card"><h3>Bloque técnico MT16 · Tampón roscado PASA / NO PASA</h3>
        <div class="grid-4">
          <table class="kv"><tbody>${U.row('Designación',th.designation)}${U.row('Clase',th.class)}</tbody></table>
          <table class="kv"><tbody>${U.row('Sistema',th.system)}${U.row('Familia',th.family)}</tbody></table>
          <table class="kv"><tbody>${U.row('Paso / TPI',U.pick(th.pitch,th.tpi,'-'))}${U.row('D2 básico',U.mm(th.d2_basic,6))}</tbody></table>
          <table class="kv"><tbody>${U.row('Accesorio: rodillo / hilo',U.mm(th.roller,3))}${U.row('Método',p.procedure.method)}</tbody></table>
        </div>
      <p class="declaration"><b>Nota:</b> el rodillo/hilo indicado es un útil de medición requerido para el montaje. La trazabilidad metrológica e incertidumbre proceden del banco Trimos certificado.</p></div>`;
    }
  };
})(window);
