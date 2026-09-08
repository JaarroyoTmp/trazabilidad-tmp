/* ===========================================================
   TMP EQUIPMENT CLASSIFIER V1
   -----------------------------------------------------------
   Clasificador único de equipos para calibración guiada.

   Objetivo:
   - El operario selecciona un equipo.
   - TMP detecta la familia/procedimiento.
   - TMP deriva al motor correcto.
   - No crear un HTML diferente por cada calibración.

   Política:
   - No modifica motores existentes.
   - No rompe MT15.
   - No fuerza MT16 si faltan datos normativos.
   =========================================================== */

export const TMP_EQUIPMENT_CLASSIFIER_VERSION = "TMP_EQUIPMENT_CLASSIFIER_V1";

export const TMP_EQUIPMENT_FAMILIES = {
  TAMPON_LISO_PNP: "TAMPON_LISO_PNP",
  TAMPON_ROSCADO_PNP: "TAMPON_ROSCADO_PNP",
  RELOJ_COMPARADOR: "RELOJ_COMPARADOR",
  MICROMETRO_EXTERIOR: "MICROMETRO_EXTERIOR",
  MICROMETRO_INTERIOR: "MICROMETRO_INTERIOR",
  ALEXOMETRO: "ALEXOMETRO",
  PIE_DE_REY: "PIE_DE_REY",
  SONDA: "SONDA",
  ANILLO_PATRON: "ANILLO_PATRON",
  DESCONOCIDA: "DESCONOCIDA"
};

export function normalizeText(value = "") {
  return String(value || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildEquipmentText(equipo = {}) {
  return [
    equipo.codigo,
    equipo.descripcion,
    equipo.rango,
    equipo.precision,
    equipo.tipo_calibracion,
    equipo.familia,
    equipo.familia_nombre,
    equipo.familia_calibracion,
    equipo.observaciones
  ].filter(Boolean).join(" ");
}

export function classifyEquipment(equipo = {}) {
  const raw = buildEquipmentText(equipo);
  const txt = normalizeText(raw);

  const result = {
    ok: true,
    source: "equipment_classifier",
    version: TMP_EQUIPMENT_CLASSIFIER_VERSION,
    equipo_id: equipo.id || null,
    codigo: equipo.codigo || null,
    raw_text: raw,
    normalized_text: txt,
    family: TMP_EQUIPMENT_FAMILIES.DESCONOCIDA,
    confidence: 0,
    reasons: [],
    warnings: []
  };

  if (!txt) {
    return {
      ...result,
      ok: false,
      error: "EQUIPO_SIN_DATOS",
      warnings: ["No hay texto suficiente para clasificar el equipo."]
    };
  }

  /*
    MT16 - Tampón roscado P/NP
  */
  if (
    /ROSCA|ROSCADO|ROSC\b|TAPON ROSCA|TAMPON DE ROSCA/.test(txt) ||
    /\bUNC\b|\bUNF\b|\bBSW\b|\bBSP\b|\bNPT\b|\bNPTF\b|\bG\s*\d|\bR\s*\d/.test(txt)
  ) {
    return {
      ...result,
      family: TMP_EQUIPMENT_FAMILIES.TAMPON_ROSCADO_PNP,
      confidence: 0.95,
      reasons: ["Texto compatible con tampón roscado P/NP."]
    };
  }

  /*
    MT15 - Tampón liso P/NP
  */
  if (
    (/TAMPON|TAPON|CALIBRE/.test(txt) && /LISO/.test(txt)) ||
    (/P\/NP|PASA|NO PASA|NP/.test(txt) && /H[0-9]|G[0-9]|J[0-9]|K[0-9]|M[0-9]|N[0-9]/.test(txt))
  ) {
    return {
      ...result,
      family: TMP_EQUIPMENT_FAMILIES.TAMPON_LISO_PNP,
      confidence: 0.9,
      reasons: ["Texto compatible con tampón/calibre liso P/NP."]
    };
  }

  if (/RELOJ|COMPARADOR|INTERAPID/.test(txt)) {
    return {
      ...result,
      family: TMP_EQUIPMENT_FAMILIES.RELOJ_COMPARADOR,
      confidence: 0.85,
      reasons: ["Texto compatible con reloj comparador."]
    };
  }

  if (/MICROMETRO/.test(txt) && /EXTERIOR|EXTERIORES/.test(txt)) {
    return {
      ...result,
      family: TMP_EQUIPMENT_FAMILIES.MICROMETRO_EXTERIOR,
      confidence: 0.85,
      reasons: ["Texto compatible con micrómetro exterior."]
    };
  }

  if (/MICROMETRO/.test(txt) && /INTERIOR|INTERIORES|3 CONTACTOS/.test(txt)) {
    return {
      ...result,
      family: TMP_EQUIPMENT_FAMILIES.MICROMETRO_INTERIOR,
      confidence: 0.85,
      reasons: ["Texto compatible con micrómetro interior."]
    };
  }

  if (/ALEXOMETRO|ALEXOMETRO|COMPARADOR DE INTERIORES/.test(txt)) {
    return {
      ...result,
      family: TMP_EQUIPMENT_FAMILIES.ALEXOMETRO,
      confidence: 0.85,
      reasons: ["Texto compatible con alexómetro."]
    };
  }

  if (/PIE DE REY|CALIBRE DIGITAL|CALIBRE 0/.test(txt)) {
    return {
      ...result,
      family: TMP_EQUIPMENT_FAMILIES.PIE_DE_REY,
      confidence: 0.85,
      reasons: ["Texto compatible con pie de rey."]
    };
  }

  if (/SONDA/.test(txt)) {
    return {
      ...result,
      family: TMP_EQUIPMENT_FAMILIES.SONDA,
      confidence: 0.75,
      reasons: ["Texto compatible con sonda."]
    };
  }

  if (/ANILLO PATRON|ANILLO PATRON/.test(txt)) {
    return {
      ...result,
      family: TMP_EQUIPMENT_FAMILIES.ANILLO_PATRON,
      confidence: 0.8,
      reasons: ["Texto compatible con anillo patrón."]
    };
  }

  return {
    ...result,
    family: TMP_EQUIPMENT_FAMILIES.DESCONOCIDA,
    confidence: 0.2,
    warnings: [
      "Familia no reconocida. Debe revisarse descripción/familia de calibración antes de calibrar."
    ]
  };
}
