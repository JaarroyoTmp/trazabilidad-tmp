const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = value => value === '' || value === null || value === undefined ? '' : value;
const rowInput = (key, value='', type='text', attrs='') => `<input data-k="${key}" type="${type}" value="${esc(num(value))}" ${attrs}>`;

function removeButtons(container){ container.querySelectorAll('.remove-result').forEach(b => b.onclick = () => b.closest('tr').remove()); }
function collect(container){
  return [...container.querySelectorAll('tbody tr')].map(tr => {
    const row = {};
    tr.querySelectorAll('[data-k]').forEach(el => row[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.value);
    const extra = {};
    tr.querySelectorAll('[data-extra]').forEach(el => extra[el.dataset.extra] = el.type === 'checkbox' ? el.checked : el.value);
    row.extra = extra;
    return row;
  }).filter(r => r.code || r.nominal !== '' || r.from !== '' || r.test);
}
function table(headers){ return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}<th></th></tr></thead><tbody></tbody></table></div>`; }
function button(){ return `<button type="button" class="secondary" data-action="add-row">Añadir fila</button>`; }

const generic = {
  code:'GENERIC', title:'Editor genérico de resultados', description:'Registra puntos o elementos certificados.',
  render(host){ host.innerHTML = `<div class="editor-head"><div><h3>${this.title}</h3><p class="hint">${this.description}</p></div>${button()}</div>${table(['Código','Tipo','Nominal','Unidad','Valor certificado','Corrección','U','k'])}`; host.querySelector('[data-action=add-row]').onclick=()=>this.add(host,{}); this.add(host,{}); },
  add(host,v){ host.querySelector('tbody').insertAdjacentHTML('beforeend',`<tr><td>${rowInput('code',v.code)}</td><td><select data-k="type"><option>PUNTO</option><option>ELEMENTO</option><option>TRAMO</option></select></td><td>${rowInput('nominal',v.nominal,'number','step="any"')}</td><td>${rowInput('unit',v.unit||'mm')}</td><td>${rowInput('certifiedValue',v.certifiedValue,'number','step="any"')}</td><td>${rowInput('correction',v.correction,'number','step="any"')}</td><td>${rowInput('expandedUncertainty',v.expandedUncertainty,'number','step="any"')}</td><td>${rowInput('coverageFactor',v.coverageFactor??2,'number','step="0.1"')}</td><td><button type="button" class="secondary remove-result">×</button></td></tr>`); removeButtons(host); },
  collect
};

const blocks = {
  code:'BLOCK_GAUGE_SET', title:'Juego de bloques patrón', description:'Una fila por cada cala física. Se conserva el vínculo con el componente existente.',
  async render(host,ctx){ host.innerHTML=`<div class="editor-head"><div><h3>${this.title}</h3><p class="hint">${this.description}</p></div>${button()}</div>${table(['Código cala','Nominal','Unidad','Valor certificado','Corrección','U','k','Clase','Estado'])}`; host.querySelector('[data-action=add-row]').onclick=()=>this.add(host,{}); let rows=[]; try { const {data,error}=await ctx.sb.from('mc_patron_componentes').select('*').eq('patron_id',ctx.pattern.id).order('nominal'); if(!error) rows=data||[]; } catch(_){} if(!rows.length)this.add(host,{}); else rows.forEach(c=>this.add(host,{componentId:c.id,code:c.codigo,nominal:c.nominal,unit:c.unidad||'mm',certifiedValue:c.valor_real,correction:c.correccion,expandedUncertainty:c.incertidumbre,coverageFactor:c.factor_k||2,grade:c.clase||'',state:c.estado||'ACTIVO'})); },
  add(host,v){ host.querySelector('tbody').insertAdjacentHTML('beforeend',`<tr><td><input data-k="componentId" type="hidden" value="${esc(v.componentId||'')}">${rowInput('code',v.code)}</td><td>${rowInput('nominal',v.nominal,'number','step="any"')}</td><td>${rowInput('unit',v.unit||'mm')}</td><td>${rowInput('certifiedValue',v.certifiedValue,'number','step="any"')}</td><td>${rowInput('correction',v.correction,'number','step="any"')}</td><td>${rowInput('expandedUncertainty',v.expandedUncertainty,'number','step="any"')}</td><td>${rowInput('coverageFactor',v.coverageFactor??2,'number','step="0.1"')}</td><td>${rowInput('',v.grade).replace('data-k=""','data-extra="grade"')}</td><td><select data-extra="state"><option>ACTIVO</option><option>NO_CONFORME</option><option>BAJA</option></select></td><td><button type="button" class="secondary remove-result">×</button></td></tr>`); const tr=host.querySelector('tbody tr:last-child'); tr.querySelector('[data-extra=state]').value=v.state||'ACTIVO'; tr.querySelector('[data-k=type]')?.remove(); removeButtons(host); }, collect
};

const ring = {
  code:'RING', title:'Anillo patrón', description:'Resultado discreto por anillo certificado.',
  render(host){ host.innerHTML=`<div class="editor-head"><div><h3>${this.title}</h3><p class="hint">${this.description}</p></div>${button()}</div>${table(['Código','Diámetro nominal','Unidad','Diámetro certificado','Corrección','U','k','Temperatura'])}`;host.querySelector('[data-action=add-row]').onclick=()=>this.add(host,{});this.add(host,{});},
  add(host,v){host.querySelector('tbody').insertAdjacentHTML('beforeend',`<tr><td>${rowInput('code',v.code)}</td><td>${rowInput('nominal',v.nominal,'number','step="any"')}</td><td>${rowInput('unit',v.unit||'mm')}</td><td>${rowInput('certifiedValue',v.certifiedValue,'number','step="any"')}</td><td>${rowInput('correction',v.correction,'number','step="any"')}</td><td>${rowInput('expandedUncertainty',v.expandedUncertainty,'number','step="any"')}</td><td>${rowInput('coverageFactor',v.coverageFactor??2,'number','step="0.1"')}</td><td>${rowInput('',v.temperature).replace('data-k=""','data-extra="temperature"')}</td><td><button type="button" class="secondary remove-result">×</button></td></tr>`);removeButtons(host);}, collect
};

const trimos = {
  code:'TRIMOS', title:'Banco Trimos', description:'Puntos o tramos del certificado. Indica desde/hasta para tramos o nominal para puntos.',
  render(host){host.innerHTML=`<div class="editor-head"><div><h3>${this.title}</h3><p class="hint">${this.description}</p></div>${button()}</div>${table(['Código','Tipo','Nominal','Desde','Hasta','Unidad','Corrección','U','k'])}`;host.querySelector('[data-action=add-row]').onclick=()=>this.add(host,{});this.add(host,{});},
  add(host,v){host.querySelector('tbody').insertAdjacentHTML('beforeend',`<tr><td>${rowInput('code',v.code)}</td><td><select data-k="type"><option>PUNTO</option><option>TRAMO</option></select></td><td>${rowInput('nominal',v.nominal,'number','step="any"')}</td><td>${rowInput('from',v.from,'number','step="any"')}</td><td>${rowInput('to',v.to,'number','step="any"')}</td><td>${rowInput('unit',v.unit||'mm')}</td><td>${rowInput('correction',v.correction,'number','step="any"')}</td><td>${rowInput('expandedUncertainty',v.expandedUncertainty,'number','step="any"')}</td><td>${rowInput('coverageFactor',v.coverageFactor??2,'number','step="0.1"')}</td><td><button type="button" class="secondary remove-result">×</button></td></tr>`);removeButtons(host);}, collect
};

const cmm = {
  code:'CMM', title:'Máquina de medición por coordenadas', description:'Resultados documentales del certificado. No habilita su uso automático como patrón sin método validado.',
  render(host){host.innerHTML=`<div class="editor-head"><div><h3>${this.title}</h3><p class="hint warning-text">${this.description}</p></div>${button()}</div>${table(['Ensayo','Código','Longitud nominal','Unidad','Resultado/Desviación','U','k','Posición/Orientación'])}`;host.querySelector('[data-action=add-row]').onclick=()=>this.add(host,{});['E0','E150','R0'].forEach(test=>this.add(host,{test,code:test}));},
  add(host,v){host.querySelector('tbody').insertAdjacentHTML('beforeend',`<tr><td>${rowInput('test',v.test)}</td><td>${rowInput('code',v.code)}</td><td>${rowInput('nominal',v.nominal,'number','step="any"')}</td><td>${rowInput('unit',v.unit||'mm')}</td><td>${rowInput('certifiedValue',v.certifiedValue,'number','step="any"')}</td><td>${rowInput('expandedUncertainty',v.expandedUncertainty,'number','step="any"')}</td><td>${rowInput('coverageFactor',v.coverageFactor??2,'number','step="0.1"')}</td><td>${rowInput('position',v.position)}</td><td><button type="button" class="secondary remove-result">×</button></td></tr>`);removeButtons(host);}, collect
};

const weight = {
  code:'WEIGHT', title:'Pesa patrón', description:'Valor discreto de masa convencional por pesa.',
  render(host){host.innerHTML=`<div class="editor-head"><div><h3>${this.title}</h3><p class="hint">${this.description}</p></div>${button()}</div>${table(['Código','Masa nominal','Unidad','Masa certificada','Corrección','U','k','Clase'])}`;host.querySelector('[data-action=add-row]').onclick=()=>this.add(host,{});this.add(host,{});},
  add(host,v){host.querySelector('tbody').insertAdjacentHTML('beforeend',`<tr><td>${rowInput('code',v.code)}</td><td>${rowInput('nominal',v.nominal,'number','step="any"')}</td><td>${rowInput('unit',v.unit||'g')}</td><td>${rowInput('certifiedValue',v.certifiedValue,'number','step="any"')}</td><td>${rowInput('correction',v.correction,'number','step="any"')}</td><td>${rowInput('expandedUncertainty',v.expandedUncertainty,'number','step="any"')}</td><td>${rowInput('coverageFactor',v.coverageFactor??2,'number','step="0.1"')}</td><td>${rowInput('',v.grade).replace('data-k=""','data-extra="grade"')}</td><td><button type="button" class="secondary remove-result">×</button></td></tr>`);removeButtons(host);}, collect
};

export function detectEditor(pattern={}, model={}){
  const text=`${pattern.codigo||''} ${pattern.descripcion||''} ${pattern.tipo_patron||''} ${pattern.familia||''} ${model.codigo_modelo||''} ${model.tipo_modelo||''}`.toLowerCase();
  if(/bloque|cala|johansson/.test(text)) return blocks;
  if(/anillo/.test(text)) return ring;
  if(/trimos|telma|banco/.test(text)) return trimos;
  if(/cmm|global evo|global f|coordenadas/.test(text)) return cmm;
  if(/pesa|masa/.test(text)) return weight;
  return generic;
}

export async function mountPatternResultEditor(host, context){ const editor=detectEditor(context.pattern,context.model); await editor.render(host,context); return {code:editor.code,title:editor.title,collect:()=>editor.collect(host)}; }
