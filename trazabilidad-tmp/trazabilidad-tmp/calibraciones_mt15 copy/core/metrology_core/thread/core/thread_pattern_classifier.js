/* TMP THREAD CORE V33 - thread_pattern_classifier.js */
export const TMP_THREAD_PATTERN_CLASSIFIER_VERSION = "TMP_THREAD_PATTERN_CLASSIFIER_V33_20260630_SMART_METROLOGY_CLASSIFIER";

export function normalizeText(v = "") {
  return String(v || "").toUpperCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/×/g, "X")
    .replace(/Ø/g, " ").replace(/⌀/g, " ").replace(/,/g, ".")
    .replace(/\s+/g, " ").trim();
}

export function parseNum(v, fallback = null) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(String(v).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function round(v, d = 9) {
  const n = parseNum(v, null);
  if (!Number.isFinite(n)) return null;
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

export const rowText = (row = {}) =>
  normalizeText(Object.values(row || {}).filter(v => v !== null && v !== undefined).join(" "));

export function extractNumbers(row = {}) {
  const out = [];
  for (const [field, value] of Object.entries(row || {})) {
    const direct = parseNum(value, null);
    if (Number.isFinite(direct)) out.push({ field, value: direct });
    if (typeof value === "string") {
      const matches = value.replace(",", ".").match(/[-+]?\d+(?:\.\d+)?/g) || [];
      for (const m of matches) {
        const n = parseNum(m, null);
        if (Number.isFinite(n)) out.push({ field, value: n });
      }
    }
  }
  return out;
}

function addEvidence(evidences, family, points, reason, data = {}) {
  evidences.push({ family, points, reason, ...data });
}

const hasAny = (text, terms = []) => terms.some(t => text.includes(t));

export function detectThreadDesignation(text, parsedThread = {}) {
  const nominal = parseNum(parsedThread.nominal_mm, null);
  const pitch = parseNum(parsedThread.pitch_mm, null);
  if (!Number.isFinite(nominal) || !Number.isFinite(pitch)) return false;
  const patterns = [
    `M${nominal}X${pitch}`, `M ${nominal} X ${pitch}`,
    `M${nominal} X ${pitch}`, `M${nominal}-${pitch}`, `M${nominal} ${pitch}`
  ].map(normalizeText);
  if (patterns.some(p => text.includes(p))) return true;
  const re = new RegExp(`M\\s*${String(nominal).replace(".", "\\.")}\\s*(?:X|-|\\s)\\s*${String(pitch).replace(".", "\\.")}`);
  return re.test(text);
}

export function detectClass(text, parsedThread = {}) {
  const cls = normalizeText(parsedThread.tolerance_class || "");
  return Boolean(cls && text.includes(cls));
}

export function classifyPatternRecord({ row = {}, parsedThread = {}, targetWireMm = null } = {}) {
  const text = rowText(row);
  const evidences = [];
  const numbers = extractNumbers(row);

  let bank = 0, rollers = 0, master = 0;
  const code = String(row.codigo || row.codigo_equipo || row.codigo_patron || "").trim();

  if (code === "1288") {
    bank += 90;
    addEvidence(evidences, "BANCO_TRIMOS", 90, "Código 1288 identificado como banco Trimos TMP");
  }
  if (hasAny(text, ["TRIMOS", "TELMA", "MAQUINA DE UNA COORDENADA", "MÁQUINA DE UNA COORDENADA"])) {
    bank += 70;
    addEvidence(evidences, "BANCO_TRIMOS", 70, "Señales de banco Trimos/Telma/máquina de una coordenada");
  }
  if (text.includes("BANCO") && hasAny(text, ["LONGITUD", "HORIZONTAL", "COORDENADA", "TRIMOS"])) {
    bank += 45;
    addEvidence(evidences, "BANCO_TRIMOS", 45, "Banco con señal dimensional");
  }

  if (hasAny(text, [
    "RODILLO", "RODILLOS", "HILO", "HILOS", "THREAD WIRE", "THREAD WIRES",
    "MEASURING WIRE", "MEASURING WIRES", "THREE WIRE", "THREE-WIRE",
    "TRES HILOS", "JUEGO DE HILOS", "WIRE SET", "WIRES SET"
  ])) {
    rollers += 95;
    addEvidence(evidences, "RODILLOS", 95, "Terminología directa de hilos/rodillos");
  }
  if (hasAny(text, ["DIN 2269", "DIN2269", "DIN 2250", "DIN2250"])) {
    rollers += 75;
    addEvidence(evidences, "RODILLOS", 75, "Norma típica de hilos/rodillos");
  }
  if (hasAny(text, ["CLASE 0", "CLASS 0"]) && !hasAny(text, ["ISO1502", "ISO 1502"])) {
    rollers += 20;
    addEvidence(evidences, "RODILLOS", 20, "Clase 0 compatible con hilos/rodillos");
  }

  const targetWire = parseNum(targetWireMm, null);
  let bestWireDim = null, bestWireError = null;
  if (Number.isFinite(targetWire)) {
    for (const n of numbers) {
      if (n.value >= 0.1 && n.value <= 5) {
        const err = Math.abs(n.value - targetWire);
        if (bestWireError === null || err < bestWireError) {
          bestWireError = err;
          bestWireDim = n.value;
        }
      }
    }
    if (Number.isFinite(bestWireError)) {
      if (bestWireError <= 0.001) { rollers += 120; addEvidence(evidences, "RODILLOS", 120, "Diámetro coincide con rodillo normativo", { matched_diameter_mm: bestWireDim, error_mm: bestWireError }); }
      else if (bestWireError <= 0.005) { rollers += 95; addEvidence(evidences, "RODILLOS", 95, "Diámetro muy próximo al rodillo normativo", { matched_diameter_mm: bestWireDim, error_mm: bestWireError }); }
      else if (bestWireError <= 0.025) { rollers += 55; addEvidence(evidences, "RODILLOS", 55, "Diámetro cercano al rodillo normativo", { matched_diameter_mm: bestWireDim, error_mm: bestWireError }); }
      else if (bestWireError <= 0.05) { rollers += 25; addEvidence(evidences, "RODILLOS", 25, "Diámetro en ventana amplia de rodillos", { matched_diameter_mm: bestWireDim, error_mm: bestWireError }); }
    }
  }

  if (hasAny(text, [
    "ROSCA", "ROSCADO", "THREAD", "THREAD GAUGE", "THREAD MASTER",
    "ANILLO", "ANILLO ROSCADO", "RING GAUGE", "MASTER RING",
    "TAMPON", "TAPÓN", "PLUG GAUGE", "THREAD PLUG",
    "CALIBRE ROSCA", "CALIBRE ROSCADO"
  ])) {
    master += 80;
    addEvidence(evidences, "PATRON_ROSCA", 80, "Terminología directa de patrón/calibre de rosca");
  }
  if (hasAny(text, ["ISO 1502", "ISO1502", "DIN 13", "DIN13", "ISO 965", "ISO965"])) {
    master += 55;
    addEvidence(evidences, "PATRON_ROSCA", 55, "Norma de rosca detectada");
  }
  if (hasAny(text, ["GO", "NO GO", "NOGO", "PASA", "NO PASA", "P/NP", "PNP"])) {
    master += 35;
    addEvidence(evidences, "PATRON_ROSCA", 35, "Señal PASA/NO PASA");
  }
  if (detectThreadDesignation(text, parsedThread)) {
    master += 85;
    addEvidence(evidences, "PATRON_ROSCA", 85, "Designación de rosca compatible");
  }
  if (detectClass(text, parsedThread)) {
    master += 45;
    addEvidence(evidences, "PATRON_ROSCA", 45, "Clase de tolerancia compatible");
  }

  if (bank >= 100) {
    rollers -= 250;
    master -= 250;
    addEvidence(evidences, "EXCLUSION", -250, "Registro identificado como banco: no puede ser rodillo ni patrón");
  }

  const scores = { BANCO_TRIMOS: bank, RODILLOS: rollers, PATRON_ROSCA: master, OTRO: 0 };
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const family = sorted[0][1] > 0 ? sorted[0][0] : "OTRO";

  return {
    family,
    scores,
    evidences,
    matched_wire_diameter_mm: Number.isFinite(bestWireDim) ? round(bestWireDim, 6) : null,
    wire_error_mm: Number.isFinite(bestWireError) ? round(bestWireError, 9) : null,
    confidence: sorted[0][1],
    compatible: {
      bank: family === "BANCO_TRIMOS" && bank >= 100,
      rollers: family === "RODILLOS" && rollers >= 120,
      master: family === "PATRON_ROSCA" && master >= 140
    }
  };
}

export default { TMP_THREAD_PATTERN_CLASSIFIER_VERSION, classifyPatternRecord, normalizeText, detectThreadDesignation, detectClass };
