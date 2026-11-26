import {MT16_CATALOGUE} from './mt16_catalogue.js?v=20261126';
import { createPoint, parseNum } from "./shared.js";
import { BSP_THREAD_TABLE, parseThreadDesignation } from '../thread/core/thread_parser.js';

export const TAMPON_ROSCADO_PROCEDURE_VERSION =
  "TMP_TAMPON_ROSCADO_PROCEDURE_V2_20260630_GUIDED_KNOWLEDGE";

function rodilloMetricoISO(paso) {
  const p = parseNum(paso);
  if (!p) return null;
  return Math.round((0.57735026919 * p) * 1000) / 1000;
}

function parseThreadFromText(text = "") {
  const t = String(text).toUpperCase().replace(",", ".");
  const m = t.match(/M\s*(\d+(?:\.\d+)?)\s*[Xx]\s*(\d+(?:\.\d+)?)(?:\s*[- ]?\s*([0-9][A-Z]))?/);
  if (!m) return {};
  return {
    tipo_rosca: "ISO_METRICA",
    diametro_nominal: parseNum(m[1]),
    paso: parseNum(m[2]),
    clase: m[3] || null,
    angulo: 60
  };
}

function buildGuidedSteps({ tipoRosca, diametro, paso, clase, angulo, rodillo, rep }) {
  return [
    {
      id: "IDENTIFICAR_EQUIPO",
      titulo: "Instrumento identificado",
      tipo: "CONFIRMACION",
      texto: `Verifique que el equipo corresponde a un tampón roscado P/NP ${tipoRosca} M${diametro}x${paso} ${clase}.`
    },
    {
      id: "NORMA_APLICABLE",
      titulo: "Método normativo",
      tipo: "INFORMATIVO",
      texto: "El sistema aplica ISO 1502 / ISO 965 / ISO 724 para definir límites y método de verificación."
    },
    {
      id: "PREPARAR_BANCO",
      titulo: "Preparar banco patrón Trimos",
      tipo: "CONFIRMACION",
      texto: "Utilice el banco patrón Trimos certificado. El banco es el patrón trazable que aporta corrección e incertidumbre."
    },
    {
      id: "MONTAR_RODILLOS",
      titulo: "Montar rodillos/hilos",
      tipo: "CONFIRMACION",
      texto: rodillo
        ? `Monte los rodillos/hilos Ø ${rodillo} mm calculados por norma. Son útiles de medición, no el patrón principal.`
        : "No se pudo calcular el rodillo. Revise paso/designación antes de continuar."
    },
    {
      id: "MEDIR_PASA",
      titulo: "Medir lado PASA",
      tipo: "LECTURAS",
      punto_id: "PASA",
      lecturas: rep,
      texto: `Coloque el lado PASA y tome ${rep} lecturas consecutivas en el banco Trimos.`
    },
    {
      id: "MEDIR_NO_PASA",
      titulo: "Medir lado NO PASA",
      tipo: "LECTURAS",
      punto_id: "NO_PASA",
      lecturas: rep,
      texto: `Coloque el lado NO PASA y tome ${rep} lecturas consecutivas en el banco Trimos.`
    },
    {
      id: "CALCULAR_DECISION",
      titulo: "Calcular resultado",
      tipo: "CALCULO",
      texto: "El sistema aplicará corrección del banco, incertidumbre, repetibilidad y regla de decisión ILAC-G8."
    }
  ];
}

export function buildTamponRoscadoProcedure(ctx = {}) {
  const i = ctx.instrumento || {};
  const rep = ctx.repeticiones || 5;

  const parsed = parseThreadFromText(`${i.descripcion || ""} ${i.rango || ""} ${i.modelo || ""}`);

  const tipoRosca = ctx.tipo_rosca || i.tipo_rosca || parsed.tipo_rosca || "ISO_METRICA";
  const diametro = parseNum(ctx.diametro_nominal ?? i.diametro_nominal ?? parsed.diametro_nominal);
  const paso = parseNum(ctx.paso ?? i.paso ?? parsed.paso);
  const clase = ctx.clase || i.clase || parsed.clase || "6H";
  const angulo = parseNum(ctx.angulo ?? i.angulo ?? parsed.angulo, 60);

  const rodillo = ctx.rodillo ?? rodilloMetricoISO(paso);

  const extraComun = {
    tipo_rosca: tipoRosca,
    diametro_nominal: diametro,
    paso,
    clase,
    angulo,
    rodillo_recomendado: rodillo,
    magnitud: "diametro_medio_sobre_rodillos",
    patron_principal: "BANCO_TRIMOS_CERTIFICADO",
    rodillos_son_patron: false,
    rodillos_son_util_medicion: true
  };

  const puntos = [
    createPoint({
      id: "PASA",
      etiqueta: `Rosca PASA ${tipoRosca} M${diametro}x${paso} ${clase}`,
      funcion: "PASA",
      nominal: diametro,
      patron_tipo: "BANCO_HORIZONTAL",
      repeticiones: rep,
      extra: {
        ...extraComun,
        lado: "PASA"
      }
    }),
    createPoint({
      id: "NO_PASA",
      etiqueta: `Rosca NO PASA ${tipoRosca} M${diametro}x${paso} ${clase}`,
      funcion: "NO_PASA",
      nominal: diametro,
      patron_tipo: "BANCO_HORIZONTAL",
      repeticiones: rep,
      extra: {
        ...extraComun,
        lado: "NO_PASA"
      }
    })
  ];

  return {
    procedimiento: "PT-ROSCA-001",
    version: TAMPON_ROSCADO_PROCEDURE_VERSION,
    familia: "TAMPON_ROSCADO",
    descripcion: "Pauta guiada para tampón roscado P/NP",

    norma: ["ISO 1502", "ISO 965", "ISO 724", "DIN 2269", "ILAC-G8", "GUM"],

    criterio_metrologico: {
      patron_principal: "Banco patrón Trimos certificado",
      utiles_medicion: "Rodillos/hilos calculados por norma",
      regla:
        "El banco Trimos es el patrón trazable para corrección e incertidumbre. Los rodillos son útiles necesarios para obtener la lectura, pero no bloquean la calibración por no estar en Supabase."
    },

    datos_rosca: {
      tipo_rosca: tipoRosca,
      diametro_nominal: diametro,
      paso,
      clase,
      angulo,
      rodillo_recomendado: rodillo
    },

    instrucciones_operario: [
      "Usar banco patrón Trimos certificado.",
      rodillo
        ? `Montar rodillos/hilos Ø ${rodillo} mm calculados por norma.`
        : "Falta paso de rosca: no se puede recomendar rodillo.",
      "Limpiar rosca, rodillos y superficies de contacto.",
      "Tomar 5 lecturas del lado PASA.",
      "Tomar 5 lecturas del lado NO PASA.",
      "No decidir manualmente el resultado. El sistema aplicará la regla de decisión."
    ],

    pasos_guiados: buildGuidedSteps({
      tipoRosca,
      diametro,
      paso,
      clase,
      angulo,
      rodillo,
      rep
    }),

    funciones: [
      {
        id: "ROSCA_PASA_NO_PASA",
        nombre: "Tampón roscado Pasa / No Pasa",
        patron_tipo: "BANCO_HORIZONTAL",
        patron_principal: "BANCO_TRIMOS_CERTIFICADO",
        patron_complementario: "RODILLOS_ROSCA_UTIL_MEDICION",
        rodillos_bloquean_calibracion: false,
        puntos
      }
    ],

    regla_global: "CUALQUIER_LADO_NO_OK_ES_NO_APTO",
    decision_operario_permitida: false,
    resultado_permitido: ["OK", "NOK", "INDETERMINADO"],

    warnings: rodillo
      ? []
      : ["No se pudo calcular rodillo recomendado. Revisar tipo de rosca/paso."]
  };
}
// MT16 periodic verification. No calibration dates or initial certificates are changed.
export const MT16_PERIODIC_VERIFICATION_VERSION = 'MT16_AUTO08_20261113';
export function evaluateMT16PeriodicVerification(form = {}) {
  if(form.regla_decision==='INTERNA_EXCEL')return evaluateMT16InternalVerification(form);
  form=structuredClone(form);
  const conversionIssues=[];
  if(form.adquisicion==='M3_HILOS'){
    if(form.modo_evaluacion!=='DIMENSION_ACTUAL'||!form.conversion?.montaje_confirmado)conversionIssues.push('Confirmar medición absoluta exterior sobre tres hilos; no admite desplazamientos respecto a cero ni anillos');
    for(const side of ['PASA','NO_PASA']){
      const point=form.puntos?.[side];if(!point)continue;
      point.lecturas_originales=[...(point.lecturas||[])];
      point.conversiones=(point.lecturas||[]).map(M=>convertMT16ThreeWireReading(M,form.conversion));
      if(point.conversiones.some(v=>!v.ok))conversionIssues.push(side+': '+[...new Set(point.conversiones.filter(v=>!v.ok).map(v=>v.error))].join('; '));
      conversionIssues.push(...[...new Set(point.conversiones.flatMap(v=>v.ok&&!v.complete?v.pending:[]))].map(x=>side+': '+x));
      point.lecturas=point.conversiones.map(v=>v.ok?v.d2_mm:null);
    }
  }else if(form.adquisicion&&!['D2','INDICACION_TRIMOS'].includes(form.adquisicion))conversionIssues.push('Modo de adquisición desconocido');
  const number = value => value === null || value === undefined || String(value).trim() === '' ? null : Number(String(value).trim().replace(',', '.'));
  const text = value => {const s=String(value??'').trim();return /^(null|undefined|-|n\/a)$/i.test(s)?'':s;};
  const uncertaintyResults={};
  if(form.incertidumbre_automatica&&form.modo_evaluacion==='DIMENSION_ACTUAL'){
    for(const side of ['PASA','NO_PASA']){
      const point=form.puntos?.[side];if(!point)continue;
      const u=calculateMT16AutomaticUncertainty({readings:point.lecturas,rawReadings:point.lecturas_originales||point.lecturas,acquisition:form.adquisicion,bank:form.banco_datos,budget:form.presupuesto_incertidumbre});
      uncertaintyResults[side]=u;point.U=u.complete?u.U_mm:null;
      conversionIssues.push(...u.missing.map(x=>side+': '+x));
    }
  }
  const missing = [...conversionIssues], failures = [], points = [];
  // Missing mode in earlier snapshots means the original historical-comparison model.
  const mode=form.modo_evaluacion||'VARIACION_HISTORICA',absolute=mode==='DIMENSION_ACTUAL';
  if(!['DIMENSION_ACTUAL','VARIACION_HISTORICA'].includes(mode))missing.push('Modo de evaluación válido');
  const required = {operario:'Referencia del operario',banco:'Banco utilizado',certificado_banco:'Certificado del banco',accesorios:'Accesorios y montaje utilizados',metodo:'Método de medida documentado',criterio:'Documento del criterio de aceptación'};
  for (const [key,label] of Object.entries(required)) if (!text(form[key])) missing.push(label);
  const origin=form.origen_referencia;
  if(!['PAUTA','REGISTRO_INTERNO','CERTIFICADO'].includes(origin))missing.push('Origen del criterio de referencia');
  if(origin==='CERTIFICADO'&&!text(form.certificado_inicial))missing.push('Certificado elegido como origen de referencia');
  if(absolute&&form.magnitud!=='D2')missing.push('Diámetro de flancos D2 obtenido con el método documentado');
  if(form.criterio_configurado===false)missing.push('Configuración técnica del criterio pendiente; no requiere buscar el histórico del equipo');
  if (!form.metodo_confirmado) missing.push('Confirmar que las lecturas y referencias corresponden a la misma magnitud y método');
  for (const [key,label] of [['identificacion','Identificación'],['limpieza','Limpieza y estado de superficies'],['integridad','Ausencia de daños'],['trazabilidad','Vigencia del certificado del banco']]) {
    if (form[key] === 'NOK') failures.push(label + ': no conforme');
    else if (form[key] !== 'OK') missing.push(label);
  }
  for (const key of ['PASA','NO_PASA']) {
    const p = form.puntos?.[key] || {}, label = key === 'PASA' ? 'PASA' : 'NO PASA';
    const baseline=number(p.referencia), min=number(p.min), max=number(p.max), U=number(p.U);
    const readings = Array.isArray(p.lecturas) ? p.lecturas.map(number) : [];
    const problems=[];
    if(p.conversiones?.some(v=>v.ok&&!v.complete))problems.push('conversión geométrica previa: completar referencia y correcciones del montaje');
    const fields=absolute?[[min,'límite inferior del diámetro de flancos'],[max,'límite superior del diámetro de flancos']]:[[baseline,'referencia anterior'],[min,'variación mínima admitida'],[max,'variación máxima admitida']];
    for (const [v,name] of fields) if (v === null || !Number.isFinite(v)) problems.push(name);
    if (U === null || !Number.isFinite(U) || U <= 0) problems.push(form.incertidumbre_automatica?'cálculo automático de U pendiente':'incertidumbre expandida del método, mayor que cero');
    if (readings.length !== 5 || readings.some(v=>v === null || !Number.isFinite(v))) problems.push('cinco lecturas numéricas');
    if (min !== null && max !== null && min > max) problems.push('límites ordenados de menor a mayor');
    if(absolute&&[min,max,...readings].some(v=>Number.isFinite(v)&&v<=0))problems.push('diámetros de flancos y límites mayores que cero');
    if (problems.length) {
      missing.push(...problems.map(s=>label+': '+s));
      const numeric=readings.length===5&&readings.every(v=>Number.isFinite(v)&&v!==null&&(!absolute||v>0));
      const avg=numeric?readings.reduce((a,b)=>a+b,0)/5:null;
      points.push({lado:key,resultado:'PENDIENTE',media:avg,variacion:!absolute&&avg!==null&&Number.isFinite(baseline)&&baseline!==null?avg-baseline:null,modo:mode,
        lecturas_d2:absolute&&numeric?readings:null,lecturas_originales:p.lecturas_originales||null,conversiones:p.conversiones||null,
        minimo_medido:numeric?Math.min(...readings):null,maximo_medido:numeric?Math.max(...readings):null,min,max,U,
        pendientes:problems,intervalo_evaluado:null});
      continue;
    }
    const avg=readings.reduce((a,b)=>a+b,0)/5,low=Math.min(...readings),high=Math.max(...readings),delta=absolute?null:avg-baseline;
    // In dimensional mode all five readings must satisfy the documented bounds.
    // An acceptable average cannot hide an out-of-bounds reading.
    const intervalLow=(absolute?low:delta)-U,intervalHigh=(absolute?high:delta)+U;
    const accepted=intervalLow>=min-1e-12 && intervalHigh<=max+1e-12;
    points.push({lado:key,resultado:accepted?'OK':'NOK',modo:mode,media:avg,referencia:absolute?null:baseline,variacion:delta,min,max,U,
      lecturas_d2:absolute?readings:null,lecturas_originales:p.lecturas_originales||null,conversiones:p.conversiones||null,minimo_medido:low,maximo_medido:high,intervalo_evaluado:{min:intervalLow,max:intervalHigh},
      regla:absolute?'Aceptar si todas las lecturas D2 ± U están dentro de los límites documentados':'Aceptar si [variación − U, variación + U] está completamente dentro de [mínimo, máximo]',
      lectura_magnitud:form.magnitud || 'INDICACION_TRIMOS',unidad:'mm'});
    if(!accepted) failures.push(label+': no cumple la regla de aceptación con incertidumbre');
  }
  const result=failures.length?'NOK':missing.length?'PENDIENTE':'OK';
  return {tipo:'VERIFICACION_PERIODICA',version:MT16_PERIODIC_VERIFICATION_VERSION,modo:mode,resultado:result,
    incertidumbres:uncertaintyResults,puntos:points,faltantes:missing,motivos:failures,criterio_origen:origin||null,documento_criterio:text(form.criterio),
    alcance:absolute?'Verificación del diámetro simple de flancos frente a los límites indicados. No determina el desgaste histórico sin medidas anteriores ni verifica por sí sola el paso, el ángulo, la forma o el funcionamiento completo del calibre.':'Comparación con una referencia anterior de la misma magnitud y montaje, frente a límites de variación documentados. No sustituye una comprobación dimensional actual.'};
}

// Reuse existing MT16 parser, wire selection and certificate readers.
export async function resolveMT16VerificationAutomation(client, equipment, family) {
  const [{calculateBestWire},trace] = await Promise.all([
    import('../thread/core/trimos_engine.js'),
    import('../thread/core/mt16_thread_traceability_engine.js')
  ]);
  const clean=value=>{const s=String(value??'').trim();return /^(null|undefined|-|n\/a)$/i.test(s)?'':s;};
  const parsed=parseMT16VerificationDesignation(equipment.rango || equipment.descripcion || '');
  if(parsed.ok&&Number.isFinite(parsed.tpi)&&parsed.tpi>0)parsed.pitch_mm=25.4/parsed.tpi;
  const ring=family==='ANILLO_ROSCADO';
  const scope=resolveMT16ThreeWireScope({family,system:parsed.thread_system,angle_deg:parsed.angle_deg});
  const wire=scope.supported&&parsed.ok ? calculateBestWire(parsed) : null;
  const result={parsed,wire,three_wire_scope:scope,bank:null,certificate:clean(equipment.informe_calibracion_url),messages:[...(parsed.warnings||[])],sources:[]};
  const bankRequest=client.from('v_patron_valores_activos').select('*').eq('codigo','1288').limit(100);
  const refRequest=client.from('calibraciones').select('id,certificado_url,fecha_ultima,procedimiento_codigo').eq('instrumento_id',equipment.id).order('fecha_ultima',{ascending:false,nullsFirst:false}).limit(50);
  const responses=await Promise.allSettled([bankRequest,refRequest]);
  const bankResponse=responses[0].status==='fulfilled'?responses[0].value:null;
  if(bankResponse && !bankResponse.error){
    const groups=trace.groupRows(bankResponse.data||[]);
    if(groups.length===1){
      const g=groups[0],length=parsed.ok?parsed.nominal_mm:null;
      result.bank={codigo:'1288',descripcion:g.descripcion,certificado:g.certificado,vencimiento:g.vencimiento,
        vigente:g.vigente,U:trace.getExpandedU(g.row,length),correccion:trace.getCorrection(g.row,length),longitud_referencia:length,k:trace.getK(g.row)};
      result.sources.push('v_patron_valores_activos / 1288');
    }else result.messages.push(groups.length?'Banco 1288: hay varios certificados activos; requiere seleccionar el aplicable.':'Banco 1288: no hay certificado disponible en la vista activa.');
  }else result.messages.push('No se pudo recuperar el certificado del banco 1288.');
  const refsResponse=responses[1].status==='fulfilled'?responses[1].value:null;
  if(!result.certificate && refsResponse && !refsResponse.error){
    const ref=(refsResponse.data||[]).find(c=>!String(c.procedimiento_codigo||'').startsWith('MT16')&&clean(c.certificado_url));
    if(ref){result.certificate=clean(ref.certificado_url);result.sources.push('calibraciones / certificado de referencia existente');}
  }
  if(!result.certificate)result.messages.push('El certificado del equipo es opcional. No es necesario recuperar su informe de compra para configurar el criterio aplicable.');
  if(ring)result.messages.push('Anillo: montaje interior; no se propone el rodillo exterior de un tampón.');
  return result;
}

export function parseMT16VerificationDesignation(raw) {
  const designation = String(raw || '').toUpperCase()
    .replace(/\b(\d+)\.\s+(?=\d+\/\d+)/g, '$1 ')
    .replace(/[\\"'“”″]+/g, ' ')
    .replace(/\bGAS\s+CIL[IÍ]NDRIC[AO]\b/g, 'G')
    .replace(/\b(UNF|UNC|UNEF|UN|UNS)\s*(?=[123][AB]\b)/g, '$1 - ')
    .replace(/(\d)\s*X\s*(\d+)\s*-?\s*(?=UN(?:[CFJS]|EF)?\b)/g, '$1-$2 ')
    .replace(/\b(BSW|BSF)\s+(?=NORMAL\b|MED(?:IA|IUM)?\b)/g, '$1 - ');
  const bsw = designation.match(/\b(1\/4|5\/16|3\/8|1\/2|5\/8|3\/4)\s+BSW\b/);
  const size = bsw && WHITWORTH_BSW[bsw[1]];
  const normalized = size ? designation.replace(bsw[0], `${bsw[1]}-${size.tpi} BSW`) : designation;
  const result = parseThreadDesignation(normalized);
  if (result.thread_system === 'BSPP_ISO228') {
    const gaugeSize = result.nominal_label?.replace(/^G /, '');
    const row = BSP_THREAD_TABLE[gaugeSize];
    const externalClass = /\b(?:G|BSPP)\s*(?:\d+\s+)?(?:\d+\/\d+|\d+)\s*(?:-\s*\d+\s*)?-?\s*[AB]\b/.test(normalized);
    if (externalClass || /\b(?:BSPT|R[CP]?)\b/.test(normalized)) {
      return {...result,ok:false,warnings:['El marcado combina G con una clase exterior o con una designación de rosca para estanqueidad. Comprueba el calibre.']};
    }
    if (row && result.tpi !== row.tpi) {
      return {...result,ok:false,warnings:[`El paso indicado no corresponde a G ${gaugeSize} según ISO 228-1.`]};
    }
  }
  if (!result.ok && /\bBSP\b|\bGAS\b/.test(designation)) {
    return {...result, warnings:['La ficha dice BSP o GAS. Identifica si el calibre es G cilíndrico o R/Rc/Rp según el marcado.']};
  }
  return result;
}

// One configuration per exact gauge family/designation; no factory measurement is inferred.
export function resolveMT16CriterionIdentity(equipment, family, parsed) {
  if(!parsed?.ok)return {key:null,reason:parsed?.warnings?.[0]||'La designación de rosca no se ha podido identificar.'};
  const raw=String(equipment.rango||equipment.descripcion||'');
  let cls=String(parsed.tolerance_class||'');
  if(parsed.thread_system==='METRIC_ISO'){
    const matches=[...raw.matchAll(/\b([1-9][HhGg]|[HhGg][1-9])\b/g)].map(m=>m[1]);
    const classes=[...new Set(matches.map(s=>/^[HhGg]/.test(s)?s[1]+s[0]:s))];
    if(classes.length!==1)return {key:null,reason:'La clase de tolerancia debe figurar inequívocamente en la ficha. No se presupone 6H.'};
    cls=classes[0];
  }
  if(!cls && !parsed.tpi)return {key:null,reason:'Falta la clase o serie necesaria para asociar una pauta.'};
  const direction=/IZQ|LEFT|\bLH\b/i.test([equipment.rango,equipment.descripcion].filter(Boolean).join(' '))?'IZQUIERDA':'DERECHA';
  const key=[family,parsed.thread_system,parsed.normalized,cls,parsed.pitch_mm,parsed.angle_deg,direction,'D2','DIMENSION_ACTUAL'].join('|');
  const reason=!cls&&parsed.thread_system==='UN_ASME_B1_1'?'Falta la clase interior del calibre, por ejemplo 2B o 3B.':
    !cls&&parsed.thread_system==='BSW_BS84'?'Falta identificar la clase de rosca Whitworth, por ejemplo Normal o Media.':null;
  return {key,label:[parsed.normalized,cls].filter(Boolean).join(' · '),family,system:parsed.thread_system,series:parsed.family,size:parsed.nominal_label,tpi:parsed.tpi,direction,nominal:parsed.nominal_mm,pitch:parsed.pitch_mm,angle:parsed.angle_deg,tolerance_class:cls,reason};
}
export function validateMT16CriterionConfiguration(config, identity, bankCertificate) {
  if(config?.regla_decision==='INTERNA_EXCEL'){
    const issues=[],num=v=>v===null||v===undefined||String(v).trim()===''?NaN:Number(String(v).replace(',','.'));
    if(!identity?.key||config.key!==identity.key)issues.push('Pauta de otra familia/designación');
    if(config.modo_evaluacion!=='DIMENSION_ACTUAL'||config.magnitud!=='D2'||config.adquisicion!=='M3_HILOS')issues.push('La pauta interna utiliza M y D2 actual');
    for(const k of ['metodo','criterio','accesorios'])if(!String(config[k]||'').trim())issues.push('Falta '+k);
    if(!bankCertificate||config.bank_certificate!==bankCertificate)issues.push('Revisar certificado del banco');
    const scope=resolveMT16ThreeWireScope({family:identity?.family,system:identity?.system,angle_deg:identity?.angle});if(!scope.supported)issues.push(scope.reason);
    const g=calculateMT16WireGeometry({...config.conversion,pitch_mm:identity?.pitch,angle_deg:identity?.angle});if(!g.ok)issues.push(g.error);
    const norm=resolveMT16ServiceLimits(identity);
    for(const side of ['PASA','NO_PASA']){const p=config.puntos?.[side]||{},lo=num(p.min),hi=num(p.max);if(!Number.isFinite(lo)||!Number.isFinite(hi)||lo<=0||lo>hi)issues.push(side+': límites de servicio incompletos');if(norm&&(['min','max'].some(k=>Math.abs(num(p[k])-norm.puntos[side][k])>1e-9)))issues.push(side+': límites diferentes de la pauta incorporada');}
    return {ok:issues.length===0,issues};
  }

  const issues=[],text=v=>{const s=String(v??'').trim();return /^(null|undefined|n\/a|-)$/i.test(s)?'':s;};
  const num=v=>text(v)===''?NaN:Number(String(v).replace(',','.'));
  if(!identity?.key||config?.key!==identity.key)issues.push('La pauta no corresponde a la familia y designación exactas.');
  if(![1,2].includes(config?.version)||config?.modo_evaluacion!=='DIMENSION_ACTUAL'||config?.magnitud!=='D2')issues.push('Formato o modo de pauta no compatible.');
  for(const field of ['criterio','metodo','accesorios'])if(!text(config?.[field]))issues.push('Falta '+({criterio:'el documento/revisión del criterio',metodo:'el método documentado',accesorios:'el montaje de medida'}[field])+'.');
  if(!text(bankCertificate)||!text(config?.bank_certificate)||config.bank_certificate!==bankCertificate)issues.push('La pauta debe revisarse para el certificado actual del banco.');
  for(const side of ['PASA','NO_PASA']){const p=config?.puntos?.[side]||{},min=num(p.min),max=num(p.max),U=num(p.U);if(![min,max].every(Number.isFinite)||min<=0||max<=0||min>max||(!config?.presupuesto_incertidumbre&&(!Number.isFinite(U)||U<=0)))issues.push(side+': límites D2 e incertidumbre del método incompletos o incoherentes.');}
  if(config?.version===2){const b=config.presupuesto_incertidumbre||{};if(!String(b.documento||'').trim()||b.confirmado!==true||!(num(b.resolucion_mm)>0)||!(num(b.cota_restante_mm)>0)||(config.adquisicion!=='M3_HILOS'&&!(num(b.longitud_max_mm)>0)))issues.push('Falta comprobar el presupuesto del método: resolución, cota de efectos restantes, documento y longitud de medida máxima para D2.');}
  const norm=resolveMT16ServiceLimits(identity);
  if(norm)for(const side of ['PASA','NO_PASA'])for(const k of ['min','max'])if(Math.abs(num(config?.puntos?.[side]?.[k])-norm.puntos[side][k])>1e-9)issues.push('Los límites de '+side+' deben coincidir con los límites de servicio incorporados en AUTO-05.');
  if(config?.adquisicion==='M3_HILOS'){
    const c=config.conversion||{},check=convertMT16ThreeWireReading(100,{...c,family:identity?.family,system:identity?.system,angle_deg:identity?.angle,pitch_mm:identity?.pitch});
    if(!check.ok)issues.push(check.error);else if(!check.complete)issues.push(...check.pending);
  }else if(config?.adquisicion&&config.adquisicion!=='D2')issues.push('Adquisición incompatible con una pauta dimensional.');
  return {ok:issues.length===0,issues};
}


// ISO 228-2:1987, Figure 7 and Table 5. Values in µm by internal TD2.
const BSPP_PLUG_TOLERANCES = {
  107:{ZPL:8,TPL:10,WGO:14,WNG:10},
  125:{ZPL:8,TPL:10,WGO:14,WNG:10},
  142:{ZPL:13,TPL:12,WGO:19,WNG:13},
  180:{ZPL:13,TPL:12,WGO:19,WNG:13},
  217:{ZPL:18,TPL:16,WGO:23,WNG:17}
};

function resolveBSPPPlugLimits(identity) {
  if(identity.system!=='BSPP_ISO228'||identity.tolerance_class!=='G_INTERNAL'||identity.angle!==55)return null;
  const row=BSP_THREAD_TABLE[identity.size?.replace(/^G /,'')];
  if(!row||row.d!==identity.nominal||row.tpi!==identity.tpi)return null;
  const workMin=Math.round(row.d2*1000),td2=Math.round(row.td2_int*1000),workMax=workMin+td2;
  const tolerance=BSPP_PLUG_TOLERANCES[td2];
  if(!tolerance)return null;
  const {ZPL,TPL,WGO,WNG}=tolerance;
  const point=(center,wear)=>({center:center/1000,new_min:(center-TPL/2)/1000,new_max:(center+TPL/2)/1000,min:(center-wear)/1000,max:(center+TPL/2)/1000,wear_min:(center-wear)/1000});
  return {version:'MT16_BSPP_ISO228',standard:'ISO 228-2:1987',designation:identity.label,
    criterio:'ISO 228-2:1987 · figura 7 y tabla 5; ISO 228-1:2000 · tabla 1; límites D2 de tapones en servicio',
    sources:['https://www.iso.org/standard/4104.html','https://law.resource.org/pub/in/bis/S01/is.2643.2005.pdf'],
    workpiece:{min:workMin/1000,max:workMax/1000},parameters:{ZPL:ZPL/1000,TPL:TPL/1000,WGO:WGO/1000,WNG:WNG/1000},
    puntos:{PASA:point(workMin+ZPL,WGO),NO_PASA:point(workMax+TPL/2,WNG)}};
}

// Swanson 2025-1 table of threaded plug gages, Class 2B and 3B, X tolerance.
// Integer units of 0.0001 in. Scope: the unified sizes in TMP's inventory.
const UNIFIED_PLUG_X = {
  'UNC 1/4':{tpi:20,go:2175,noGo2B:2224,noGo3B:2211,x:3},
  'UNC 5/16':{tpi:18,go:2764,noGo2B:2817,noGo3B:2803,x:3},
  'UNC 3/8':{tpi:16,go:3344,noGo2B:3401,noGo3B:3387,x:3},
  'UNC 1/2':{tpi:13,go:4500,noGo2B:4565,noGo3B:4548,x:3},
  'UNC 5/8':{tpi:11,go:5660,noGo2B:5732,noGo3B:5714,x:3},
  'UNC 3/4':{tpi:10,go:6850,noGo2B:6927,noGo3B:6907,x:3},
  'UNF 9/16':{tpi:18,go:5264,noGo2B:5323,noGo3B:5308,x:3},
  'UNF 3/4':{tpi:16,go:7094,noGo2B:7159,noGo3B:7143,x:3},
  'UNF 7/8':{tpi:14,go:8286,noGo2B:8356,noGo3B:8339,x:3},
  'UNF 1':{tpi:12,go:9459,noGo2B:9535,noGo3B:9516,x:3},
  'UNF 1 1/4':{tpi:12,go:11959,noGo2B:12039,noGo3B:12019,x:3}
};

// BS 84:2007, internal BSW medium (Table 3) and normal (Table 5).
// BS 919-2:2007, Tables 1 and 3, simple effective diameter of General plugs.
const WHITWORTH_BSW = {
  '1/4':{tpi:20,low:2180,medium:2219,normal:2238},
  '5/16':{tpi:18,low:2769,medium:2811,normal:2832},
  '3/8':{tpi:16,low:3350,medium:3395,normal:3418},
  '1/2':{tpi:12,low:4466,medium:4518,normal:4543},
  '5/8':{tpi:11,low:5668,medium:5724,normal:5752},
  '3/4':{tpi:10,low:6860,medium:6920,normal:6950}
};

// Reference figures for checking the documented criterion of a specific plug.
// They are never passed to the evaluator as incorporated service limits.
export function resolveMT16PlugLimitReference(identity) {
  if(!identity?.key||identity.family!=='TAMPON_ROSCADO_PNP')return null;
  const mm=units=>Number((units*0.00254).toFixed(6));
  const limits=(min,max)=>({min:mm(min),max:mm(max)});
  if(identity.system==='UN_ASME_B1_1'&&identity.angle===60){
    const row=UNIFIED_PLUG_X[identity.size],cls=identity.tolerance_class;
    if(!row||row.tpi!==identity.tpi||!['2B','3B'].includes(cls))return null;
    const upper=row['noGo'+cls];
    return {standard:'Swanson 2025-1 · tapón unificado clase X',note:'Contrasta la edición aplicable y los límites en servicio del calibre antes de usar estas cifras para decidir.',puntos:{PASA:limits(row.go,row.go+row.x),NO_PASA:limits(upper-row.x,upper)}};
  }
  if(identity.system==='BSW_BS84'&&identity.series==='BSW_THREAD'&&identity.angle===55){
    const row=WHITWORTH_BSW[identity.size?.replace(/^BSW /,'')],cls=identity.tolerance_class;
    if(!row||row.tpi!==identity.tpi||!['NORMAL','MED','MEDIA','MEDIUM'].includes(cls))return null;
    const upper=cls==='NORMAL'?row.normal:row.medium;
    const small=identity.nominal<=12.7,goTol=small?6:7,noGoTol=small?4:5;
    return {standard:'BS 84:2007 y BS 919-2:2007 · tapón General',note:'Límites de fabricación del diámetro simple. Para la decisión en servicio, confirma el tipo de calibre y el criterio de desgaste.',puntos:{PASA:limits(row.low+2,row.low+goTol),NO_PASA:limits(upper,upper+noGoTol)}};
  }
  return null;
}

// Independently checked scope: this exact ISO 965-2:1998 table 3 row only.
// ISO 1502:1996 tables 4, 5 and 12; dimensions in mm.
export function resolveMT16ServiceLimits(identity){
  if(identity?.key&&identity.family==='TAMPON_ROSCADO_PNP'){
    const bspp=resolveBSPPPlugLimits(identity);
    if(bspp)return bspp;
    // TMP worksheet explicitly uses these bounds in service. Its designation,
    // angle, pitch and all four bounds agree with the independent class X table.
    if(identity.system==='UN_ASME_B1_1'&&identity.size==='UNF 3/4'&&identity.tolerance_class==='2B'&&identity.direction==='DERECHA'){
      const reference=resolveMT16PlugLimitReference(identity);
      if(reference){
        const file='ROSCAS UNC-UNF/3%4 - 16 UNF 2B -.xlsm';
        const puntos=Object.fromEntries(Object.entries(reference.puntos).map(([side,p])=>[side,{...p,new_min:p.min,new_max:p.max}]));
        return {version:'MT16_UNF_TMP',standard:'Pauta interna TMP / clase X',designation:identity.label,
          criterio:'Pauta TMP de servicio · '+file+' · límites D2 comprobados con Swanson 2025-1, clase X',
          sources:[{file,sha256:'b0bf2353dc75a95f6fc562239ccb909ef20e4faea9663546e7c891c486c5d5d0'}],puntos};
      }
    }
  }
  const row=MT16_CATALOGUE.find(r=>identity?.key&&r.family===identity.family&&r.system===identity.system&&r.tolerance_class===identity.tolerance_class&&r.nominal===identity.nominal&&r.pitch===identity.pitch&&r.angle===identity.angle&&r.direction===(identity.direction||'DERECHA'));
  if(row)return {...structuredClone(row),version:'MT16_CATALOGUE_20261117',criterio:row.criterion+' · '+row.source_file.split('/').pop(),sources:[{file:row.source_file,sha256:row.source_sha256}]};
  if(!identity?.key||identity.family!=='TAMPON_ROSCADO_PNP'||identity.system!=='METRIC_ISO'||identity.tolerance_class!=='6H'||identity.nominal!==12||identity.pitch!==1.25||identity.angle!==60)return null;
  const workMin=11.188,workMax=11.368,Z=0.012,T=0.011,Wgo=0.0175,Wng=0.0115;
  const r=v=>Number(v.toFixed(7));
  const point=(center,W)=>({center:r(center),new_min:r(center-T/2),new_max:r(center+T/2),wear_min:r(center-W),min:r(center-W),max:r(center+T/2)});
  return {version:'MT16_LIMITS_75148_20261109',designation:'M12x1.25 · 6H',
    criterio:'ISO 1502:1996 · tablas 4, 5 y 12; ISO 965-2:1998 · tabla 3; servicio: desgaste mínimo a máximo de fabricación',
    sources:['https://law.resource.org/pub/in/bis/S01/is.2334.2001.pdf','https://law.resource.org/pub/in/bis/S01/is.14962.2.2001.pdf'],
    workpiece:{min:workMin,max:workMax},parameters:{ZPL:Z,TPL:T,WGO:Wgo,WNG:Wng},
    puntos:{PASA:point(workMin+Z,Wgo),NO_PASA:point(workMax+T/2,Wng)}};
}

// EURAMET cg-10 v2.1, equation 14. All corrections must be supplied by
// the documented method. In particular a blank force correction is not zero.
// Parallel symmetric 55/60 degree exterior threads only. No taper or ring inference.
export function resolveMT16ThreeWireScope({family,system,angle_deg}={}){
  const expected={METRIC_ISO:60,UN_ASME_B1_1:60,BSW_BS84:55,BSPP_ISO228:55};
  const supported=family==='TAMPON_ROSCADO_PNP'&&expected[system]===angle_deg;
  return {supported,reason:supported?'Conversión geométrica exterior paralela; requiere pauta del montaje y límites de su familia.':'Sin conversión M exterior habilitada: anillos, roscas cónicas y otros perfiles requieren procedimiento específico.'};
}
export function calculateMT16WireGeometry({pitch_mm,wire_mm,angle_deg}={}){
  const n=v=>v===null||v===undefined||String(v).trim()===''?NaN:Number(String(v).replace(',','.'));
  const P=n(pitch_mm),w=n(wire_mm),a=n(angle_deg);
  if(![P,w,a].every(Number.isFinite)||P<=0||w<=0||![55,60].includes(a))return {ok:false,error:'Faltan paso, diámetro del hilo o ángulo compatible (55° / 60°)'};
  const half=a*Math.PI/360,C=w*(1+1/Math.sin(half))-P/(2*Math.tan(half));
  return {ok:true,geometry_mm:C,wire_mm:w,pitch_mm:P,angle_deg:a,formula:'C = w(1 + 1/sen(α/2)) − P/(2tan(α/2))'};
}
export function convertMT16ThreeWireReading(reading,config={}){
  const n=v=>v===null||v===undefined||String(v).trim()===''?NaN:Number(String(v).replace(',','.'));
  const scope=resolveMT16ThreeWireScope(config);
  if(!scope.supported)return {ok:false,error:scope.reason};
  const M=n(reading),g=calculateMT16WireGeometry(config);
  if(!g.ok)return g;
  if(!Number.isFinite(M)||M<=0)return {ok:false,error:'Falta lectura exterior absoluta M positiva'};
  const corrections={rake_mm:n(config.rake_mm),force_mm:n(config.force_mm),bank_correction_mm:n(config.bank_correction_mm)};
  const pending=[];
  if(config.montaje_confirmado!==true)pending.push('Confirmar referencia absoluta M y montaje del método');
  for(const [k,v] of Object.entries(corrections))if(!Number.isFinite(v)||(['rake_mm','force_mm'].includes(k)&&v<0))pending.push('Corrección documentada pendiente: '+k);
  const geometric=M-g.geometry_mm;
  const complete=pending.length===0;
  const d2=complete?geometric-corrections.rake_mm+corrections.force_mm+corrections.bank_correction_mm:geometric;
  if(d2<=0)return {ok:false,error:'Lectura incompatible con un diámetro absoluto positivo'};
  return {ok:true,complete,pending,d2_mm:d2,d2_geometrico_mm:geometric,raw_mm:M,...g,...Object.fromEntries(Object.entries(corrections).map(([k,v])=>[k,Number.isFinite(v)?v:null])),
    formula:'D2 = M − C − A1 + A2 + δB',source:'EURAMET cg-10 v2.1 (12/2012), ecuación 14; perfil paralelo simétrico',
    estado:complete?'CONVERSION_COMPLETA':'GEOMETRIA_PREVIA_NO_AUTORIZA_APTO'};
}


// AUTO-06: uncertainty of each individual reading (not of the mean).
// The remaining-method bound is an explicitly validated aggregate Type-B bound
// expressed at D2, excluding bank, resolution and the repeatability measured here.
export function calculateMT16AutomaticUncertainty({readings=[],rawReadings=[],acquisition='D2',bank,budget={}}={}){
  const n=v=>v===null||v===undefined||String(v).trim()===''?NaN:Number(String(v).replace(',','.'));
  const missing=[],xs=readings.map(n),raw=rawReadings.map(n);
  if(xs.length!==5||xs.some(x=>!Number.isFinite(x)||x<=0))missing.push('Completar las cinco lecturas válidas para calcular la repetibilidad');
  const valid=xs.length===5&&xs.every(x=>Number.isFinite(x)&&x>0);
  const mean=valid?xs.reduce((a,b)=>a+b,0)/5:null;
  const repeat=valid?Math.sqrt(xs.reduce((a,b)=>a+(b-mean)**2,0)/4):null;
  const resolution=n(budget.resolucion_mm),bound=n(budget.cota_restante_mm);
  if(!(resolution>0))missing.push('Resolución del banco pendiente en la configuración del método');
  if(!(bound>0)||budget.confirmado!==true||!String(budget.documento||'').trim())missing.push('Configurar una vez la cota documentada de los efectos restantes del montaje (hilos, temperatura, fuerza y modelo)');
  const length=acquisition==='M3_HILOS'&&raw.length===5&&raw.every(x=>Number.isFinite(x)&&x>0)?Math.max(...raw):n(budget.longitud_max_mm);
  if(!(length>0))missing.push('Longitud máxima de medida del montaje pendiente');
  if(acquisition==='D2'&&valid&&Number.isFinite(length)&&length<Math.max(...xs))missing.push('La longitud máxima configurada no cubre los diámetros introducidos');
  let bankU=n(bank?.U),bankK=n(bank?.k);
  if(bank?.certificado==='C-11377.00002')bankU=length>0&&length<=300?(1.1+.031*length)/1000:NaN;
  else bankU=NaN; // A new certificate needs its own reviewed length-dependent model.
  if(!bank?.vigente||!(bankU>0)||!(bankK>0))missing.push('Certificado vigente del banco con U y k aplicables a esta longitud');
  const parts={banco_standard_mm:bankU>0&&bankK>0?bankU/bankK:null,repetibilidad_standard_mm:repeat,resolucion_standard_mm:resolution>0?resolution/Math.sqrt(6):null,resto_metodo_standard_mm:bound>0?bound/Math.sqrt(3):null};
  const known=Object.values(parts).filter(x=>Number.isFinite(x));
  const combined=known.length?Math.hypot(...known):null;
  // Fixed conservative t_0.975,4 instead of assuming k=2 with only five readings.
  const k=2.7764451051977987,U=combined===null?null:k*combined;
  return {version:'MT16_U_AUTO06_20261110',complete:missing.length===0,U_mm:missing.length?null:U,U_parcial_mm:valid?U:null,u_combinada_mm:combined,k,componentes:parts,longitud_banco_mm:Number.isFinite(length)?length:null,media_mm:mean,missing,
    regla:'U = 2.776445105 × √[(Ubanco/kbanco)² + s² + (resolución/√6)² + (cota restante/√3)²]',
    modelo:'Cada lectura individual; s muestral de cinco repeticiones, no s/√5. Dos cuantizaciones independientes del desplazamiento. Cota agregada tipo B documentada y expresada en D2 para los efectos restantes; sin duplicar los tres componentes calculados.',
    documento:budget.documento||null,certificado_banco:bank?.certificado||null};
}


// Reproduction of the supplied Excel G13 and reading-G13 calculation ONLY.
// This does not identify an instrument zero, add force/rake corrections,
// validate a measurement setup or issue a conformity result.
export function reproduceMT16ExcelGeometry({reading,pitch_mm,angle_deg,wire_mm}={}){
  const n=v=>v===null||v===undefined||String(v).trim()===''?NaN:Number(String(v).replace(',','.'));
  const M=n(reading),P=n(pitch_mm),a=n(angle_deg),w=n(wire_mm);
  if(![M,P,a,w].every(Number.isFinite)||M<=0||P<=0||w<=0||a<=0||a>=180)return {ok:false,error:'Datos de la fórmula Excel incompletos'};
  const half=3.141592*a/180/2;
  const C=w*(1+1/Math.sin(half))-P/(2*Math.tan(half));
  return {ok:true,reading_mm:M,correction_mm:C,d2_mm:M-C,source:'Reproducción aritmética de G13 y lectura−G13 del Excel suministrado',pi_legacy:3.141592,setup_validated:false};
}

// Internal verification expressly selected by TMP. Geometric Excel model,
// direct acceptance limits, no guard band and no claimed full method U.
export function evaluateMT16InternalVerification(input={}){
  const f=structuredClone(input),missing=[],failures=[],points=[];
  const text=v=>{const s=String(v??'').trim();return /^(null|undefined|n\/a|-)$/i.test(s)?'':s;};
  const n=v=>!text(v)?NaN:Number(String(v).replace(',','.'));
  const scope=resolveMT16ThreeWireScope(f.conversion);
  if(!scope.supported)missing.push(scope.reason);
  if(f.adquisicion!=='M3_HILOS'||f.modo_evaluacion!=='DIMENSION_ACTUAL'||f.magnitud!=='D2')missing.push('La pauta interna utiliza lecturas absolutas M y comparación de D2 actual');
  if(!f.metodo_confirmado||!f.conversion?.montaje_confirmado)missing.push('Confirmar reglaje de referencia M, montaje y criterio de esta verificación');
  for(const [k,label]of Object.entries({operario:'Operario',banco:'Banco patrón',certificado_banco:'Certificado del banco',accesorios:'Juego de hilos y montaje',metodo:'Método',criterio:'Límites y documento del criterio'}))if(!text(f[k]))missing.push(label);
  if(f.criterio_configurado===false)missing.push('Configurar los límites de servicio para esta designación');
  if(!f.banco_datos?.vigente||f.banco_datos.certificado!==f.certificado_banco)missing.push('Recuperar certificado vigente y concordante del banco');
  const B=n(f.banco_datos?.correccion);
  if(!Number.isFinite(B))missing.push('Corrección aplicable del banco no disponible');
  for(const [k,label]of Object.entries({identificacion:'Identificación',limpieza:'Limpieza',integridad:'Ausencia de daños',trazabilidad:'Vigencia del banco'})){
    if(f[k]==='NOK')failures.push(label+': no conforme');else if(f[k]!=='OK')missing.push(label);
  }
  const g=calculateMT16WireGeometry(f.conversion);
  if(!g.ok)missing.push(g.error);
  for(const side of ['PASA','NO_PASA']){
    const p=f.puntos?.[side]||{},raw=Array.isArray(p.lecturas)?p.lecturas:[],xs=raw.map(n),min=n(p.min),max=n(p.max),problems=[];
    if(xs.length!==5||xs.some(x=>!Number.isFinite(x)||x<=0))problems.push('cinco lecturas M positivas');
    if(![min,max].every(Number.isFinite)||min<=0||max<=0||min>max)problems.push('límites D2 de servicio positivos y ordenados');
    const conversions=raw.map(M=>{
      const value=n(M);if(!scope.supported||!g.ok||!Number.isFinite(value)||value<=0||!Number.isFinite(B))return {ok:false,error:'Datos de conversión incompletos'};
      const d2=value-g.geometry_mm+B;
      return {ok:d2>0,complete:d2>0,raw_mm:value,d2_mm:d2,...g,bank_correction_mm:B,modelo:'GEOMETRIA_EXCEL',rake_mm:null,force_mm:null,
        efectos_no_evaluados:['Hélice','Deformación por fuerza','Desviaciones de paso y ángulo respecto al perfil nominal'],
        formula:'D2 = M − C + δB; C = w(1 + 1/sen(α/2)) − P/(2tan(α/2))',estado:'MODELO_INTERNO_GEOMETRICO'};
    });
    if(conversions.some(c=>!c.ok))problems.push('conversión M a D2 válida');
    const valid=conversions.length===5&&conversions.every(c=>c.ok),ds=valid?conversions.map(c=>c.d2_mm):null;
    const mean=valid?ds.reduce((a,b)=>a+b,0)/5:null,low=valid?Math.min(...ds):null,high=valid?Math.max(...ds):null;
    const sd=valid?Math.sqrt(ds.reduce((sum,x)=>sum+(x-mean)**2,0)/4):null;
    const accepted=problems.length===0&&low>=min-1e-12&&high<=max+1e-12;
    const result=problems.length?'PENDIENTE':accepted?'OK':'NOK';
    if(result==='NOK')failures.push(side+': al menos una lectura D2 está fuera de los límites de servicio');
    missing.push(...problems.map(x=>side+': '+x));
    points.push({lado:side,resultado:result,modo:'DIMENSION_ACTUAL',lecturas_originales:raw,lecturas_d2:ds,conversiones:conversions,media:mean,minimo_medido:low,maximo_medido:high,desviacion_tipica_mm:sd,min,max,U:null,
      intervalo_evaluado:valid?{min:low,max:high}:null,pendientes:problems,regla:'Todas las lecturas D2 dentro de límites de servicio, sin banda de guarda por incertidumbre',unidad:'mm'});
  }
  const result=failures.length?'NOK':missing.length?'PENDIENTE':'OK';
  return {tipo:'VERIFICACION_PERIODICA',version:MT16_PERIODIC_VERIFICATION_VERSION,modo:'DIMENSION_ACTUAL',regla_decision:'INTERNA_EXCEL',modelo:'GEOMETRIA_EXCEL',resultado:result,
    puntos:points,incertidumbres:{},faltantes:[...new Set(missing)],motivos:failures,documento_criterio:text(f.criterio),criterio_origen:'PAUTA',
    declaracion:'Decisión interna por comparación directa con límites, sin banda de guarda. No se ha determinado la incertidumbre completa del método ni se aplican correcciones de hélice o deformación por fuerza. Riesgo de aceptación en los límites no cuantificado.',
    alcance:'Verificación interna del diámetro simple de flancos mediante perfil nominal y tres hilos, con comprobaciones físicas declaradas. No es un certificado de calibración ni demuestra por sí sola paso, ángulo, forma y funcionamiento completos.'};
}
