/* TMP THREAD CORE V71 - thread_parser.js
   Parser universal defensivo: metrica ISO completa + deteccion G/R/NPT/UN/TR.
   IMPORTANTE: V43 no inventa limites de calibracion para familias sin tablas normativas cargadas.
*/
export const TMP_THREAD_PARSER_VERSION = "TMP_THREAD_PARSER_V71_20260702_UNIFIED_BSW_SAFE";

export function normalizeText(value = "") {
  return String(value || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ø/g, "")
    .replace(/×/g, "X")
    .replace(/\*/g, "X")
    .replace(/,/g, ".")
    .replace(/\s+/g, " ")
    .replace(/\s*[-–—]\s*/g, " - ")
    .trim();
}

export function parseNum(value, fallback = null) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function metricCoarsePitch(nominal) {
  const table = {1:0.25,1.2:0.25,1.4:0.3,1.6:0.35,1.8:0.35,2:0.4,2.5:0.45,3:0.5,3.5:0.6,4:0.7,5:0.8,6:1,7:1,8:1.25,10:1.5,12:1.75,14:2,16:2,18:2.5,20:2.5,22:2.5,24:3,27:3,30:3.5,33:3.5,36:4,39:4,42:4.5,45:4.5,48:5,52:5,56:5.5,60:5.5,64:6,68:6};
  return table[Number(nominal)] || null;
}

const INCH = 25.4;
// ISO 228-1 / ISO 7-1 common Whitworth pipe thread dimensions (mm).
// td2_int is TD2 for internal parallel G from ISO 228-1 table.
export const BSP_THREAD_TABLE = {
  "1/16":{tpi:28,P:0.907,d:7.723,d2:7.142,d1:6.561,td2_int:0.107},
  "1/8": {tpi:28,P:0.907,d:9.728,d2:9.147,d1:8.566,td2_int:0.107},
  "1/4": {tpi:19,P:1.337,d:13.157,d2:12.301,d1:11.445,td2_int:0.125},
  "3/8": {tpi:19,P:1.337,d:16.662,d2:15.806,d1:14.950,td2_int:0.125},
  "1/2": {tpi:14,P:1.814,d:20.955,d2:19.793,d1:18.631,td2_int:0.142},
  "5/8": {tpi:14,P:1.814,d:22.911,d2:21.749,d1:20.587,td2_int:0.142},
  "3/4": {tpi:14,P:1.814,d:26.441,d2:25.279,d1:24.117,td2_int:0.142},
  "7/8": {tpi:14,P:1.814,d:30.201,d2:29.039,d1:27.877,td2_int:0.142},
  "1":   {tpi:11,P:2.309,d:33.249,d2:31.770,d1:30.291,td2_int:0.180},
  "1 1/8":{tpi:11,P:2.309,d:37.897,d2:36.418,d1:34.939,td2_int:0.180},
  "1 1/4":{tpi:11,P:2.309,d:41.910,d2:40.431,d1:38.952,td2_int:0.180},
  "1 1/2":{tpi:11,P:2.309,d:47.803,d2:46.324,d1:44.845,td2_int:0.180},
  "1 3/4":{tpi:11,P:2.309,d:53.746,d2:52.267,d1:50.788,td2_int:0.180},
  "2":   {tpi:11,P:2.309,d:59.614,d2:58.135,d1:56.656,td2_int:0.180},
  "2 1/2":{tpi:11,P:2.309,d:75.184,d2:73.705,d1:72.226,td2_int:0.217},
  "3":   {tpi:11,P:2.309,d:87.884,d2:86.405,d1:84.926,td2_int:0.217},
  "4":   {tpi:11,P:2.309,d:113.030,d2:111.551,d1:110.072,td2_int:0.217},
  "5":   {tpi:11,P:2.309,d:138.430,d2:136.951,d1:135.472,td2_int:0.217},
  "6":   {tpi:11,P:2.309,d:163.830,d2:162.351,d1:160.872,td2_int:0.217}
};
const BSP_MAJOR_MM = Object.fromEntries(Object.entries(BSP_THREAD_TABLE).map(([k,v]) => [k,v.d]));
function parseFractionToken(tok){
  tok = String(tok || "").trim().replace(/\s+/g," ");
  if(!tok) return null;
  if(/^\d+(?:\.\d+)?$/.test(tok)) return Number(tok);
  const mixed = tok.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if(mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = tok.match(/^(\d+)\/(\d+)$/);
  if(frac) return Number(frac[1]) / Number(frac[2]);
  return null;
}
function cleanFractionKey(v){ return String(v || "").trim().replace(/\s+/g," "); }
function pitchFromTpi(tpi){ const n = parseNum(tpi, null); return Number.isFinite(n) && n > 0 ? INCH / n : null; }
function commonResult({ raw, normalized, family, thread_system, standard_hint, designation, nominal_label, nominal_mm, pitch_mm, tpi, tolerance_class, angle_deg, database_key, warnings = [], supported = false }){
  return {
    ok:true, source:TMP_THREAD_PARSER_VERSION, raw, normalized:designation || normalized, family, thread_system, standard_hint,
    nominal_label:nominal_label || null, nominal_mm:Number.isFinite(nominal_mm) ? nominal_mm : null, pitch_mm:Number.isFinite(pitch_mm) ? pitch_mm : null,
    tpi:Number.isFinite(tpi) ? tpi : null, tolerance_class:tolerance_class || null, angle_deg, direction:"DERECHA",
    external_internal:(String(tolerance_class || "").includes("H") || family === "BSPP_G") ? "INTERNAL" : "UNKNOWN",
    database_key, normative_objectives_supported:supported, warnings
  };
}

export function parseThreadDesignation(raw = "") {
  const normalized = normalizeText(raw);

  const metric = normalized.match(/\bM\s*([0-9]+(?:\.[0-9]+)?)\s*(?:X\s*([0-9]+(?:\.[0-9]+)?))?\s*(?:-\s*([0-9]+[A-Z]+))?/i);
  if (metric) {
    const nominal = parseNum(metric[1]);
    const pitchInput = parseNum(metric[2], null);
    const coarsePitch = metricCoarsePitch(nominal);
    const pitch = Number.isFinite(pitchInput) ? pitchInput : coarsePitch;
    const toleranceClass = metric[3] || "6H";
    if (!Number.isFinite(nominal) || !Number.isFinite(pitch)) return { ok:false, source:TMP_THREAD_PARSER_VERSION, raw, normalized, family:"METRIC", error:"THREAD_NUMERIC_DATA_INCOMPLETE", message:"Falta nominal o paso valido." };
    const n = Number.isInteger(nominal) ? String(nominal) : String(nominal).replace(/0+$/,"").replace(/\.$/,"");
    const p = Number.isInteger(pitch) ? String(pitch) : String(pitch).replace(/0+$/,"").replace(/\.$/,"");
    return commonResult({ raw, normalized, family:pitch === coarsePitch ? "METRIC_COARSE" : "METRIC_FINE", thread_system:"METRIC_ISO", standard_hint:pitch === coarsePitch ? "ISO 724 / ISO 965 / ISO 1502" : "ISO metric fine / DIN 13 + ISO 965 / ISO 1502", designation:`M${n}x${p}`, nominal_label:`M${n}`, nominal_mm:nominal, pitch_mm:pitch, tolerance_class:toleranceClass, angle_deg:60, database_key:`M${n}x${p}|${toleranceClass}`, supported:true, warnings:Number.isFinite(pitchInput) ? [] : ["No se indico paso; se aplica paso metrico grueso por defecto."] });
  }

  // G 7/8 - 14 / G1/2-14 / BSPP ISO 228, perfil Whitworth 55 grados.
  const bsp = normalized.match(/\b(?:G|BSPP)\s*([0-9]+\s+[0-9]+\/[0-9]+|[0-9]+\/[0-9]+|[0-9]+(?:\.[0-9]+)?)\s*(?:-\s*([0-9]+(?:\.[0-9]+)?))?/);
  if (bsp) {
    const frac = cleanFractionKey(bsp[1]);
    const row = BSP_THREAD_TABLE[frac] || null;
    const tpi = parseNum(bsp[2], row?.tpi ?? null);
    const pitch = row?.P ?? pitchFromTpi(tpi);
    const major = row?.d ?? BSP_MAJOR_MM[frac] ?? null;
    return commonResult({ raw, normalized, family:"BSPP_G", thread_system:"BSPP_ISO228", standard_hint:"ISO 228-1 / ISO 228-2, rosca G paralela Whitworth 55 grados", designation:`G ${frac}${Number.isFinite(tpi) ? " - " + tpi : ""}`, nominal_label:`G ${frac}`, nominal_mm:major, pitch_mm:pitch, tpi, tolerance_class:"G_INTERNAL", angle_deg:55, database_key:`G${frac}|${tpi || ""}`, supported:!!row, warnings: row ? ["Familia G/BSPP resuelta con tabla ISO 228-1. Criterio GO/NO GO segun ISO 228-2; verificar fisicamente el tipo PASA/NO PASA del calibre."] : ["Familia G/BSPP detectada, pero esa designacion no esta en la tabla ISO 228-1 cargada."] });
  }

  const r = normalized.match(/\b(?:R|RC|RP|BSPT)\s*([0-9]+\s+[0-9]+\/[0-9]+|[0-9]+\/[0-9]+|[0-9]+(?:\.[0-9]+)?)\s*(?:-\s*([0-9]+(?:\.[0-9]+)?))?/);
  if (r) {
    const frac = cleanFractionKey(r[1]); const row = BSP_THREAD_TABLE[frac] || null; const tpi = parseNum(r[2], row?.tpi ?? null); const pitch = row?.P ?? pitchFromTpi(tpi); const major = row?.d ?? BSP_MAJOR_MM[frac] ?? null;
    const prefix = normalized.startsWith("RC") ? "Rc" : normalized.startsWith("RP") ? "Rp" : "R";
    return commonResult({ raw, normalized, family:"BSPT_R", thread_system:"BSPT_ISO7", standard_hint:"ISO 7-1 / ISO 7-2, rosca R-Rc-Rp Whitworth 55 grados", designation:`${prefix} ${frac}${Number.isFinite(tpi)?" - "+tpi:""}`, nominal_label:`${prefix} ${frac}`, nominal_mm:major, pitch_mm:pitch, tpi, tolerance_class:prefix, angle_deg:55, database_key:`${prefix}${frac}|${tpi || ""}`, supported:!!row, warnings:["Familia R/Rc/Rp detectada. En ISO 7-2 la verificacion se realiza por calibres conicos y escalon de tolerancia; V70 informa geometria, pero bloquea objetivo Trimos directo salvo procedimiento conico especifico."] });
  }


  // Unified/NPT written in common shop order: 5/16-18 UNC, 3/8-24 UNF, 1/4-18 NPT.
  const inchSizeFirst = normalized.match(/\b([0-9]+\s+[0-9]+\/[0-9]+|[0-9]+\/[0-9]+|#[0-9]+|[0-9]+(?:\.[0-9]+)?)\s*-\s*([0-9]+(?:\.[0-9]+)?)\s*(UNC|UNF|UNEF|UN|UNJ|NPTF|NPT)\b\s*(?:-\s*([0-9]+[AB]))?/);
  if (inchSizeFirst) {
    const size = cleanFractionKey(inchSizeFirst[1]);
    const tpi = parseNum(inchSizeFirst[2], null);
    const familyCode = inchSizeFirst[3];
    const cls = inchSizeFirst[4] || null;
    const pitch = pitchFromTpi(tpi);
    const sizeVal = size.startsWith("#") ? null : parseFractionToken(size);
    if (familyCode === "NPT" || familyCode === "NPTF") {
      return commonResult({ raw, normalized, family:familyCode, thread_system:"NPT_ASME_B1_20", standard_hint:"ASME B1.20 / rosca conica 60 grados", designation:`${size} - ${tpi} ${familyCode}`, nominal_label:`${familyCode} ${size}`, nominal_mm:(BSP_MAJOR_MM[size] || (Number.isFinite(sizeVal) ? sizeVal * INCH : null)), pitch_mm:pitch, tpi, angle_deg:60, database_key:`${familyCode}${size}|${tpi || ""}`, supported:false, warnings:["Familia detectada: NPT/NPTF. Geometria operativa disponible; limites oficiales pendientes de motor ASME B1.20. Certificado completo bloqueado hasta validar norma."] });
    }
    return commonResult({ raw, normalized, family:`${familyCode}_THREAD`, thread_system:"UN_ASME_B1_1", standard_hint:"ASME B1.1 / Unified thread 60 grados", designation:`${size} - ${tpi} ${familyCode}${cls?" - "+cls:""}`, nominal_label:`${familyCode} ${size}`, nominal_mm:Number.isFinite(sizeVal) ? sizeVal * INCH : null, pitch_mm:pitch, tpi, tolerance_class:cls, angle_deg:60, database_key:`${familyCode}${size}|${tpi || ""}|${cls || ""}`, supported:false, warnings:["Familia detectada: UN/UNC/UNF en formato tamano-paso-serie. Geometria y rodillo operativos; limites oficiales pendientes de tablas ASME B1.1/B1.2."] });
  }

  const npt = normalized.match(/\b(?:NPT|NPTF)\s*([0-9]+\s+[0-9]+\/[0-9]+|[0-9]+\/[0-9]+|[0-9]+(?:\.[0-9]+)?)\s*(?:-\s*([0-9]+(?:\.[0-9]+)?))?/);
  if (npt) {
    const frac = cleanFractionKey(npt[1]); const tpi = parseNum(npt[2], null); const pitch = pitchFromTpi(tpi);
    return commonResult({ raw, normalized, family:"NPT", thread_system:"NPT_ASME_B1_20", standard_hint:"ASME B1.20 / rosca conica 60 grados", designation:`NPT ${frac}${Number.isFinite(tpi)?" - "+tpi:""}`, nominal_label:`NPT ${frac}`, nominal_mm:(BSP_MAJOR_MM[frac] || null), pitch_mm:pitch, tpi, angle_deg:60, database_key:`NPT${frac}|${tpi || ""}`, supported:false, warnings:["Familia detectada: NPT/NPTF. Requiere motor ASME B1.20 y criterio conico; V43 bloquea objetivos hasta cargar motor normativo."] });
  }

  const un = normalized.match(/\b(UNF|UNC|UNEF|UN|UNJ)\s*([0-9]+\s+[0-9]+\/[0-9]+|[0-9]+\/[0-9]+|#[0-9]+|[0-9]+(?:\.[0-9]+)?)\s*(?:-\s*([0-9]+(?:\.[0-9]+)?))?\s*(?:-\s*([0-9]+[AB]))?/);
  if (un) {
    const series = un[1]; const size = cleanFractionKey(un[2]); const tpi = parseNum(un[3], null); const pitch = pitchFromTpi(tpi); const cls = un[4] || null;
    const sizeVal = size.startsWith("#") ? null : parseFractionToken(size);
    return commonResult({ raw, normalized, family:`${series}_THREAD`, thread_system:"UN_ASME_B1_1", standard_hint:"ASME B1.1 / Unified thread 60 grados", designation:`${series} ${size}${Number.isFinite(tpi)?" - "+tpi:""}${cls?" - "+cls:""}`, nominal_label:`${series} ${size}`, nominal_mm:Number.isFinite(sizeVal) ? sizeVal * INCH : null, pitch_mm:pitch, tpi, tolerance_class:cls, angle_deg:60, database_key:`${series}${size}|${tpi || ""}|${cls || ""}`, supported:false, warnings:["Familia detectada: UN/UNC/UNF. Requiere tablas ASME B1.1 para limites de tampones; V43 bloquea objetivos hasta cargar motor normativo."] });
  }


  // Whitworth BSW/BSF, e.g. 1/4-20 BSW - NORMAL. Perfil 55 grados no tuberia.
  const bsw = normalized.match(/\b([0-9]+\s+[0-9]+\/[0-9]+|[0-9]+\/[0-9]+|[0-9]+(?:\.[0-9]+)?)\s*-\s*([0-9]+(?:\.[0-9]+)?)\s*(BSW|BSF|WHITWORTH)\b(?:\s*-\s*([A-Z0-9]+))?/);
  if (bsw) {
    const size = cleanFractionKey(bsw[1]);
    const tpi = parseNum(bsw[2], null);
    const series = bsw[3] === 'WHITWORTH' ? 'BSW' : bsw[3];
    const cls = bsw[4] || null;
    const pitch = pitchFromTpi(tpi);
    const sizeVal = parseFractionToken(size);
    return commonResult({ raw, normalized, family:`${series}_THREAD`, thread_system:"BSW_BS84", standard_hint:"BS 84 / Whitworth 55 grados", designation:`${size} - ${tpi} ${series}${cls?" - "+cls:""}`, nominal_label:`${series} ${size}`, nominal_mm:Number.isFinite(sizeVal) ? sizeVal * INCH : null, pitch_mm:pitch, tpi, tolerance_class:cls, angle_deg:55, database_key:`${series}${size}|${tpi || ""}|${cls || ""}`, supported:false, warnings:["Familia detectada: Whitworth BSW/BSF. Geometria y rodillo operativos; limites oficiales pendientes de tabla normativa."] });
  }

  const tr = normalized.match(/\bTR\s*([0-9]+(?:\.[0-9]+)?)\s*X\s*([0-9]+(?:\.[0-9]+)?)(?:\s*-\s*([0-9]+[A-Z]+))?/);
  if (tr) {
    const nominal = parseNum(tr[1]); const pitch = parseNum(tr[2]); const cls = tr[3] || null;
    return commonResult({ raw, normalized, family:"TRAPEZOIDAL_TR", thread_system:"TR_ISO2904", standard_hint:"ISO 2904 / ISO 2901-2903, rosca trapezoidal 30 grados", designation:`Tr${nominal}x${pitch}${cls?" - "+cls:""}`, nominal_label:`Tr${nominal}`, nominal_mm:nominal, pitch_mm:pitch, tolerance_class:cls, angle_deg:30, database_key:`TR${nominal}x${pitch}|${cls || ""}`, supported:false, warnings:["Familia detectada: Trapezoidal. Requiere motor ISO 2901/2903/2904; V43 bloquea objetivos hasta cargar motor normativo."] });
  }

  return { ok:false, source:TMP_THREAD_PARSER_VERSION, raw, normalized, family:"UNKNOWN", thread_system:"UNKNOWN", error:"THREAD_PARSE_FAILED", message:"No se pudo interpretar la designacion de rosca." };
}

export default { TMP_THREAD_PARSER_VERSION, parseThreadDesignation, normalizeText, parseNum, metricCoarsePitch };
