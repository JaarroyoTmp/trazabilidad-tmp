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
export const MT16_PERIODIC_VERIFICATION_VERSION = 'MT16_AUTO03_20261109';
export function evaluateMT16PeriodicVerification(form = {}) {
  const number = value => value === null || value === undefined || String(value).trim() === '' ? null : Number(String(value).trim().replace(',', '.'));
  const text = value => {const s=String(value??'').trim();return /^(null|undefined|-|n\/a)$/i.test(s)?'':s;};
  const missing = [], failures = [], points = [];
  // Missing mode in earlier snapshots means the original historical-comparison model.
  const mode=form.modo_evaluacion||'VARIACION_HISTORICA',absolute=mode==='DIMENSION_ACTUAL';
  if(!['DIMENSION_ACTUAL','VARIACION_HISTORICA'].includes(mode))missing.push('Modo de evaluación válido');
  const required = {operario:'Referencia del operario',banco:'Banco utilizado',certificado_banco:'Certificado del banco',accesorios:'Accesorios y montaje utilizados',metodo:'Método de medida documentado',criterio:'Documento del criterio de aceptación'};
  for (const [key,label] of Object.entries(required)) if (!text(form[key])) missing.push(label);
  const origin=form.origen_referencia;
  if(!['PAUTA','REGISTRO_INTERNO','CERTIFICADO'].includes(origin))missing.push('Origen del criterio de referencia');
  if(origin==='CERTIFICADO'&&!text(form.certificado_inicial))missing.push('Certificado elegido como origen de referencia');
  if(absolute&&form.magnitud!=='D2')missing.push('Diámetro de flancos D2 obtenido con el método documentado');
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
    if (U === null || !Number.isFinite(U) || U <= 0) problems.push('incertidumbre expandida del método, mayor que cero');
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
      minimo_medido:low,maximo_medido:high,intervalo_evaluado:{min:intervalLow,max:intervalHigh},
      regla:absolute?'Aceptar si todas las lecturas D2 ± U están dentro de los límites documentados':'Aceptar si [variación − U, variación + U] está completamente dentro de [mínimo, máximo]',
      lectura_magnitud:form.magnitud || 'INDICACION_TRIMOS',unidad:'mm'});
    if(!accepted) failures.push(label+': no cumple la regla de aceptación con incertidumbre');
  }
  const result=failures.length?'NOK':missing.length?'PENDIENTE':'OK';
  return {tipo:'VERIFICACION_PERIODICA',version:MT16_PERIODIC_VERIFICATION_VERSION,modo:mode,resultado:result,
    puntos:points,faltantes:missing,motivos:failures,criterio_origen:origin||null,documento_criterio:text(form.criterio),
    alcance:absolute?'Verificación del diámetro de flancos frente a límites documentados. No determina desgaste histórico sin medidas anteriores ni valida automáticamente tablas normativas.':'Comparación con una referencia anterior de la misma magnitud y montaje, frente a límites de variación documentados. No sustituye una comprobación dimensional actual.'};
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
  if(!result.certificate)result.messages.push('No hay certificado del equipo enlazado. Es opcional: identifica el procedimiento o registro interno que aporta el criterio de aceptación.');
  if(ring)result.messages.push('Anillo: montaje interior; no se propone el rodillo exterior de un tampón.');
  return result;
}
