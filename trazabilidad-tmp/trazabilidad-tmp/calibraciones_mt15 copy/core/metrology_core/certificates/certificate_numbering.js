(function(global){
  const VERSION = 'TMP_CERTIFICATE_NUMBERING_CORE_1_0';
  const pad = (n,w=6)=>String(n).padStart(w,'0');
  const clean = v => String(v || 'SN').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,10) || 'SN';
  const ymd = (d=new Date()) => `${d.getFullYear()}${pad(d.getMonth()+1,2)}${pad(d.getDate(),2)}`;
  function nextLocalSeq(scope){
    try{ const key = `TMP_CERT_SEQ_${scope}`; const cur = Number(localStorage.getItem(key) || '0') + 1; localStorage.setItem(key, String(cur)); return cur; }
    catch{ return Math.floor(Math.random()*999999)+1; }
  }
  function build(input={}){
    const core = input.core || {}; const eq = input.equipment || core.equipment || {};
    const procedure = clean(core.procedure?.code || core.procedure?.id || 'MT16').replace(/^TMP/,'').replace(/^-/,'') || 'MT16';
    const date = ymd(new Date()); const code = clean(eq.codigo || core.equipment?.codigo || 'SN');
    return `TMP-${procedure}-${date}-${pad(nextLocalSeq(`${procedure}_${date}`),6)}-${code}`;
  }
  function hash(text){ let h=2166136261; const s=String(text||''); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return ('00000000'+(h>>>0).toString(16).toUpperCase()).slice(-8); }
  function verificationUrl(payload={}){
    const cert = payload.certificate_number || build(payload); const h = hash(`${cert}|${payload.equipment?.code || payload.equipment?.codigo || ''}|${payload.results?.decision || ''}`);
    try{ const base = global.location ? `${global.location.origin}${global.location.pathname.replace(/\/[^/]*$/, '')}` : ''; return `${base}/certificado_verificacion.html?id=${encodeURIComponent(cert)}&hash=${encodeURIComponent(h)}`; }
    catch{ return `TMP-CERT:${cert}:${h}`; }
  }
  global.TMPCertificateNumbering = { VERSION, build, hash, verificationUrl };
})(window);
