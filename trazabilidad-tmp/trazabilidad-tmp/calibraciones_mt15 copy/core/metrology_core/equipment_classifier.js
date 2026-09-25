/* ===========================================================
   TMP EQUIPMENT CLASSIFIER V1
   Clasificador textual inicial para familias TMP.
   -----------------------------------------------------------
   Este clasificador es conservador:
   - Detecta por descripción/familia/rango/tipo.
   - No sustituye a una familia seleccionada manualmente.
   =========================================================== */

export function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[º°]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function classifyEquipment(instrumento = {}) {
  const txt = normalizeText([
    instrumento.codigo,
    instrumento.descripcion,
    instrumento.familia,
    instrumento.rango,
    instrumento.tipo_calibracion,
    instrumento.fabricante,
    instrumento.fabricante_tipo
  ].filter(Boolean).join(" "));

  if (!txt) return "DESCONOCIDO";

  if ((txt.includes("tampon") || txt.includes("tapon")) && (txt.includes("rosca") || txt.includes("m") || txt.includes("unc") || txt.includes("unf") || txt.includes("bsp") || txt.includes("bsw") || txt.includes("g "))) {
    return "TAMPON_ROSCADO_PNP";
  }

  if ((txt.includes("tampon") || txt.includes("tapon")) && (txt.includes("liso") || txt.includes("p/np") || txt.includes("pasa") || txt.includes("no pasa"))) {
    return "TAMPON_LISO_PNP";
  }

  if (txt.includes("varilla")) return "VARILLA";

  if (txt.includes("reloj") && txt.includes("comparador") && (txt.includes("milesimal") || txt.includes("0.001"))) {
    return "RELOJ_COMPARADOR_MILESIMAL";
  }

  if ((txt.includes("reloj") && txt.includes("comparador")) || txt.includes("comparador")) {
    return "RELOJ_COMPARADOR_CENTESIMAL";
  }

  if (txt.includes("micrometro") && (txt.includes("interior") || txt.includes("3 contactos") || txt.includes("tres contactos"))) {
    return "MICROMETRO_INTERIOR_3_CONTACTOS";
  }

  if (txt.includes("micrometro")) return "MICROMETRO_EXTERIOR";

  if (txt.includes("pie de rey") || txt.includes("calibre digital") || txt.includes("calibre analogico")) {
    return "PIE_DE_REY";
  }

  if (txt.includes("sonda") && txt.includes("altura")) return "SONDA_ALTURA";
  if (txt.includes("gramil")) return "GRAMIL";
  if (txt.includes("rugos")) return "RUGOSIMETRO";

  if (txt.includes("anillo") && txt.includes("rosca")) return "ANILLO_ROSCADO";
  if (txt.includes("anillo")) return "ANILLO_PATRON";

  if (txt.includes("utillaje") || txt.includes("util")) return "UTILLAJE_PROPIO";
  if (txt.includes("durometro") || txt.includes("dureza")) return "DUROMETRO";
  if (txt.includes("dinamometrica") || txt.includes("dinamometrico") || txt.includes("torque")) return "LLAVE_DINAMOMETRICA";
  if (txt.includes("chaflan") || txt.includes("angulo") || txt.includes("30") || txt.includes("45")) return "CALIBRE_CHAFLAN_ANGULO";
  if (txt.includes("balanza") || txt.includes("bascula")) return "BALANZA";
  if (txt.includes("herradura")) return "CALIBRE_HERRADURA";

  return "DESCONOCIDO";
}