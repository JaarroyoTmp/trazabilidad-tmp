import { createPoint, parseNum } from "./shared.js";

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
export const MT16_PERIODIC_VERIFICATION_VERSION = 'MT16_AUTO06_20261110';
export function evaluateMT16PeriodicVerification(form = {}) {
  form=structuredClone(form);
  const conversionIssues=[];
  if(form.adquisicion==='M3_HILOS'){
    if(form.modo_evaluacion!=='DIMENSION_ACTUAL'||!form.conversion?.montaje_confirmado)conversionIssues.push('Confirmar medición absoluta exterior sobre tres hilos; no admite desplazamientos respecto a cero ni anillos');
    for(const side of ['PASA','NO_PASA']){
      const point=form.puntos?.[side];if(!point)continue;
      point.lecturas_originales=[...(point.lecturas||[])];
      point.conversiones=(point.lecturas||[]).map(M=>convertMT16ThreeWireReading(M,form.conversion));
      if(point.conversiones.some(v=>!v.ok))conversionIssues.push(side+': '+[...new Set(point.conversiones.filter(v=>!v.ok).map(v=>v.error))].join('; '));
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
    const fields=absolute?[[min,'límite inferior del diámetro de flancos'],[max,'límite superior del diámetro de flancos']]:[[baseline,'referencia anterior'],[min,'variación mínima admitida'],[max,'variación máxima admitida']];
    for (const [v,name] of fields) if (v === null || !Number.isFinite(v)) problems.push(name);
    if (U === null || !Number.isFinite(U) || U <= 0) problems.push(form.incertidumbre_automatica?'cálculo automático de U pendiente':'incertidumbre expandida del método, mayor que cero');
    if (readings.length !== 5 || readings.some(v=>v === null || !Number.isFinite(v))) problems.push('cinco lecturas numéricas');
    if (min !== null && max !== null && min > max) problems.push('límites ordenados de menor a mayor');
    if(absolute&&[min,max,...readings].some(v=>Number.isFinite(v)&&v<=0))problems.push('diámetros de flancos y límites mayores que cero');
    if (problems.length) {
      missing.push(...problems.map(s=>label+': '+s));
      points.push({lado:key,resultado:'PENDIENTE',media:null,variacion:null,modo:mode});
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
  const [{parseThreadDesignation},{calculateBestWire},trace] = await Promise.all([
    import('../thread/core/thread_parser.js'), import('../thread/core/trimos_engine.js'),
    import('../thread/core/thread_traceability_engine.js')
  ]);
  const clean=value=>{const s=String(value??'').trim();return /^(null|undefined|-|n\/a)$/i.test(s)?'':s;};
  const parsed=parseThreadDesignation(equipment.rango || equipment.descripcion || '');
  const ring=family==='ANILLO_ROSCADO';
  const wire=!ring && parsed.ok && parsed.angle_deg===60 ? calculateBestWire(parsed) : null;
  const result={parsed,wire,bank:null,certificate:clean(equipment.informe_calibracion_url),messages:[...(parsed.warnings||[])],sources:[]};
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

// One configuration per exact gauge family/designation; no factory measurement is inferred.
export function resolveMT16CriterionIdentity(equipment, family, parsed) {
  if(!parsed?.ok)return {key:null,reason:'La designación de rosca no se ha podido identificar.'};
  const raw=String(equipment.rango||equipment.descripcion||'');
  let cls=String(parsed.tolerance_class||'');
  if(parsed.thread_system==='METRIC_ISO'){
    const matches=[...raw.matchAll(/\b([1-9][HhGg]|[HhGg][1-9])\b/g)].map(m=>m[1]);
    const classes=[...new Set(matches.map(s=>/^[HhGg]/.test(s)?s[1]+s[0]:s))];
    if(classes.length!==1)return {key:null,reason:'La clase de tolerancia debe figurar inequívocamente en la ficha. No se presupone 6H.'};
    cls=classes[0];
  }
  if(!cls && !parsed.tpi)return {key:null,reason:'Falta la clase o serie necesaria para asociar una pauta.'};
  const key=[family,parsed.thread_system,parsed.normalized,cls,parsed.pitch_mm,parsed.angle_deg,'D2','DIMENSION_ACTUAL'].join('|');
  return {key,label:[parsed.normalized,cls].filter(Boolean).join(' · '),family,system:parsed.thread_system,nominal:parsed.nominal_mm,pitch:parsed.pitch_mm,angle:parsed.angle_deg,tolerance_class:cls};
}
export function validateMT16CriterionConfiguration(config, identity, bankCertificate) {
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
    if(!check.ok)issues.push(check.error);
  }else if(config?.adquisicion&&config.adquisicion!=='D2')issues.push('Adquisición incompatible con una pauta dimensional.');
  return {ok:issues.length===0,issues};
}


// Independently checked scope: this exact ISO 965-2:1998 table 3 row only.
// ISO 1502:1996 tables 4, 5 and 12; dimensions in mm.
export function resolveMT16ServiceLimits(identity){
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
// This function is restricted to an exterior, single-start metric plug setup.
export function convertMT16ThreeWireReading(reading,config={}){
  const n=v=>v===null||v===undefined||String(v).trim()===''?NaN:Number(String(v).replace(',','.'));
  const M=n(reading),P=n(config.pitch_mm),w=n(config.wire_mm),A1=n(config.rake_mm),A2=n(config.force_mm),B=n(config.bank_correction_mm);
  if(config.family!=='TAMPON_ROSCADO_PNP'||config.system!=='METRIC_ISO'||config.angle_deg!==60||config.montaje_confirmado!==true)return {ok:false,error:'Montaje exterior de tres hilos no confirmado o no compatible'};
  if(![M,P,w,A1,A2,B].every(Number.isFinite)||M<=0||P<=0||w<=0||A1<0||A2<0)return {ok:false,error:'Faltan lectura absoluta, diámetro real de hilo o correcciones documentadas de hélice, fuerza y banco'};
  const geometry=3*w-Math.sqrt(3)*P/2,d2=M-geometry-A1+A2+B;
  if(d2<=0)return {ok:false,error:'Lectura incompatible con un diámetro absoluto positivo'};
  return {ok:true,d2_mm:d2,raw_mm:M,wire_mm:w,pitch_mm:P,geometry_mm:geometry,rake_mm:A1,force_mm:A2,bank_correction_mm:B,formula:'D2 = M − 3w + (√3/2)P − A1 + A2 + δB',source:'EURAMET cg-10 v2.1 (12/2012), ecuación 14'};
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
