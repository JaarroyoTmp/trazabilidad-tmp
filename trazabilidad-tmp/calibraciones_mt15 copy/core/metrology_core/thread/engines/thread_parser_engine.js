/* ===========================================================
   TMP THREAD PARSER ENGINE V1
   Parser inicial de roscas para MT16.
   =========================================================== */

import {
  THREAD_STANDARD_DATABASE,
  parseNum,
  tpiToPitchMm,
  fractionToMm,
  resolveMetric
} from "./thread_standard_database.js";

export function normalizeThreadText(value = "") {
  return String(value || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[×]/g, "X")
    .replace(/,/g, ".")
    .replace(/[´`]/g, "'")
    .replace(/["“”]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseThreadGaugeDesignation(input = {}) {
  const raw = [input.designacion,input.rango,input.descripcion,input.nombre,input.modelo,input.observaciones].filter(Boolean).join(" ");
  const txt = normalizeThreadText(raw);
  const direction = /\bIZQ\b|\bLH\b|IZQUIERDA/.test(txt) ? "IZQUIERDA" : "DERECHA";
  const side = resolveGaugeSide(txt);

  for (const fn of [parseMetricThread, parseUnifiedThread, parsePipeThread, parseNptThread, parseBswThread]) {
    const r = fn(txt, { raw, direction, side });
    if (r.ok) return r;
  }

  return { ok:false, source:"thread_parser_engine", raw, normalized:txt, error:"THREAD_DESIGNATION_NOT_PARSED", message:"No se pudo interpretar la designación de rosca." };
}

export function resolveGaugeSide(txt = "") {
  const t = normalizeThreadText(txt);
  if (/\bP\/NP\b|\bPNP\b|\bP-NP\b/.test(t)) return "PASA_NO_PASA";
  if (/\bNO PASA\b|\bNP\b|\bNOGO\b/.test(t)) return "NO_PASA";
  if (/\bPASA\b|\bGO\b|\bP\b/.test(t)) return "PASA";
  return "PASA_NO_PASA";
}

export function extractToleranceClass(txt = "") {
  const t = normalizeThreadText(txt);
  const m = t.match(/\b([0-9][ABHG]|[0-9]H|[0-9]G|SH[0-9]|[0-9]?[A-Z]{1,2}[0-9])\b/);
  return m ? m[1] : null;
}

export function parseMetricThread(txt, ctx = {}) {
  const t = normalizeThreadText(txt);

  let m = t.match(/\bM\s*([0-9]+(?:\.[0-9]+)?)(?:\s*[A-Z]{1,4})?\s*(?:X|\s)?\s*([0-9]+(?:\.[0-9]+)?)?\s*(?:[- ]\s*)?([0-9]?[A-Z]{1,3}[0-9]?)?/);

  if (!m) m = t.match(/\b([0-9]+(?:\.[0-9]+)?)\s*X\s*([0-9]+(?:\.[0-9]+)?)\s*(?:[- ]\s*)?([0-9]?[A-Z]{1,3}[0-9]?)?/);
  if (!m) return { ok:false };

  const nominal = parseNum(m[1]);
  let pitch = m[2] ? parseNum(m[2]) : null;
  const cls = m[3] || extractToleranceClass(t);

  if (!nominal) return { ok:false };

  const resolved = resolveMetric(nominal, pitch);
  if (!resolved.ok) return { ok:false };

  return {
    ok:true,
    source:"thread_parser_engine",
    standard_source:resolved.source,
    raw:ctx.raw,
    normalized:t,
    family:resolved.family,
    thread_type:resolved.family === "MF" ? "METRIC_FINE" : "METRIC",
    standard:THREAD_STANDARD_DATABASE.families[resolved.family]?.standard || "DIN 13",
    angle_deg:60,
    nominal_mm:resolved.nominal_mm,
    pitch_mm:resolved.pitch_mm,
    tpi:null,
    drill_mm:resolved.drill_mm,
    tolerance_class:cls || null,
    direction:ctx.direction,
    side:ctx.side,
    database_key:resolved.key,
    warnings:[resolved.warning, !cls ? "Clase de tolerancia no indicada." : null].filter(Boolean)
  };
}

export function parseUnifiedThread(txt, ctx = {}) {
  const t = normalizeThreadText(txt);
  const m = t.match(/\b([0-9]+(?:\s+[0-9]+\/[0-9]+)?|[0-9]+\/[0-9]+)\s*-\s*([0-9]+(?:\.[0-9]+)?)\s*(UNC|UNF|UNEF|UN|UNS)?\s*-?\s*([0-9][AB])?/);
  if (!m || /(NPT|NPS)/.test(t)) return { ok:false };

  const frac = m[1].trim();
  const tpi = parseNum(m[2]);
  const family = m[3] || guessUnifiedFamily(frac, tpi) || "UN";
  const key = `${frac}-${tpi}-${family}`;
  const row = THREAD_STANDARD_DATABASE.unified[key];

  return {
    ok:true,
    source:"thread_parser_engine",
    standard_source:row ? "THREAD_STANDARD_DATABASE.unified" : "UNIFIED_FALLBACK",
    raw:ctx.raw,
    normalized:t,
    family,
    thread_type:THREAD_STANDARD_DATABASE.families[family]?.type || "UNIFIED",
    standard:THREAD_STANDARD_DATABASE.families[family]?.standard || "ANSI B1.1",
    angle_deg:THREAD_STANDARD_DATABASE.families[family]?.angle_deg || 60,
    nominal_fraction:frac,
    nominal_mm:row ? row[0] : fractionToMm(frac),
    pitch_mm:tpiToPitchMm(tpi),
    tpi,
    drill_mm:row ? row[2] : null,
    tolerance_class:m[4] || null,
    direction:ctx.direction,
    side:ctx.side,
    database_key:key,
    warnings:[row ? null : "Pendiente validar en tabla."].filter(Boolean)
  };
}

export function guessUnifiedFamily(frac, tpi) {
  const candidates = ["UNC","UNF","BSW"];
  for (const f of candidates) {
    if (THREAD_STANDARD_DATABASE.unified[`${frac}-${tpi}-${f}`]) return f;
  }
  return null;
}

export function parsePipeThread(txt, ctx = {}) {
  const t = normalizeThreadText(txt);
  let m = t.match(/\b(G|R|RC)\s*([0-9]+(?:\s+[0-9]+\/[0-9]+)?|[0-9]+\/[0-9]+)\s*-\s*([0-9]+(?:\.[0-9]+)?)/);
  if (!m) {
    const b = t.match(/\b([0-9]+(?:\s+[0-9]+\/[0-9]+)?|[0-9]+\/[0-9]+)\s*BSPX?\s*([0-9]+(?:\.[0-9]+)?)/);
    if (b) m = ["","G",b[1],b[2]];
  }
  if (!m) return { ok:false };

  const family = m[1] === "RC" ? "R" : m[1];
  const nominalPipe = m[2].trim();
  const tpi = parseNum(m[3]);
  const key = `${family}${nominalPipe}-${tpi}`;
  const row = THREAD_STANDARD_DATABASE.pipe[key];

  return {
    ok:true,
    source:"thread_parser_engine",
    standard_source:row ? "THREAD_STANDARD_DATABASE.pipe" : "PIPE_FALLBACK",
    raw:ctx.raw,
    normalized:t,
    family,
    thread_type:THREAD_STANDARD_DATABASE.families[family]?.type || "BSP",
    standard:THREAD_STANDARD_DATABASE.families[family]?.standard || "BSP",
    angle_deg:55,
    nominal_pipe:nominalPipe,
    nominal_mm:row ? row[0] : null,
    pitch_mm:tpiToPitchMm(tpi),
    tpi,
    drill_mm:row ? row[2] : null,
    tolerance_class:extractToleranceClass(t),
    direction:ctx.direction,
    side:ctx.side,
    database_key:key,
    warnings:[row ? null : "Pendiente validar en tabla."].filter(Boolean)
  };
}

export function parseNptThread(txt, ctx = {}) {
  const t = normalizeThreadText(txt);
  const m = t.match(/\b([0-9]+(?:\s+[0-9]+\/[0-9]+)?|[0-9]+\/[0-9]+)\s*-\s*([0-9]+(?:\.[0-9]+)?)\s*(NPTF|NPT|NPSI|NPS|NPSF|NPSM)\b/);
  if (!m) return { ok:false };

  const frac = m[1].trim();
  const tpi = parseNum(m[2]);
  const family = m[3] || "NPTF";
  const key = `${frac}-${tpi}-NPTF`;
  const row = THREAD_STANDARD_DATABASE.npt[key];

  return {
    ok:true,
    source:"thread_parser_engine",
    standard_source:row ? "THREAD_STANDARD_DATABASE.npt" : "NPT_FALLBACK",
    raw:ctx.raw,
    normalized:t,
    family,
    thread_type:family,
    standard:THREAD_STANDARD_DATABASE.families[family]?.standard || "ANSI/ASME B1.20",
    angle_deg:60,
    nominal_pipe:frac,
    nominal_mm:row ? row[0] : null,
    pitch_mm:tpiToPitchMm(tpi),
    tpi,
    drill_mm:null,
    tolerance_class:null,
    direction:ctx.direction,
    side:ctx.side,
    database_key:key,
    warnings:[row ? null : "Pendiente validar en tabla."].filter(Boolean)
  };
}

export function parseBswThread(txt, ctx = {}) {
  const t = normalizeThreadText(txt);
  if (!/\bBSW\b|\bBSF\b/.test(t)) return { ok:false };

  const family = /\bBSF\b/.test(t) ? "BSF" : "BSW";
  const m = t.match(/\b([0-9]+(?:\s+[0-9]+\/[0-9]+)?|[0-9]+\/[0-9]+)(?:\s*-\s*([0-9]+(?:\.[0-9]+)?))?\s*(BSW|BSF)/);
  if (!m) return { ok:false };

  const frac = m[1].trim();
  const tpi = m[2] ? parseNum(m[2]) : null;
  const key = tpi ? `${frac}-${tpi}-${family}` : null;
  const row = key ? THREAD_STANDARD_DATABASE.unified[key] : null;

  return {
    ok:true,
    source:"thread_parser_engine",
    standard_source:row ? "THREAD_STANDARD_DATABASE.unified" : "WHITWORTH_PARTIAL",
    raw:ctx.raw,
    normalized:t,
    family,
    thread_type:THREAD_STANDARD_DATABASE.families[family]?.type || "WHITWORTH",
    standard:THREAD_STANDARD_DATABASE.families[family]?.standard || "BS84",
    angle_deg:55,
    nominal_fraction:frac,
    nominal_mm:row ? row[0] : fractionToMm(frac),
    pitch_mm:tpi ? tpiToPitchMm(tpi) : null,
    tpi,
    drill_mm:row ? row[2] : null,
    tolerance_class:extractToleranceClass(t),
    direction:ctx.direction,
    side:ctx.side,
    database_key:key || frac,
    warnings:[!tpi ? "No se indicó TPI. Parser parcial." : null, row || !tpi ? null : "Pendiente validar en tabla."].filter(Boolean)
  };
}
