/* ===========================================================
   TMP FAMILY RESOLVER V1
   -----------------------------------------------------------
   Traduce la familia real de Supabase a la familia interna
   que entiende el motor metrologico TMP.

   Problema que resuelve:
   Supabase puede guardar:
   - familia_id = UUID
   - familia = texto
   - descripcion = "Tampón liso P/NP"
   - tipo_calibracion
   - rango

   El motor necesita:
   - TAMPON_LISO_PNP
   - PIE_DE_REY
   - MICROMETRO_EXTERIOR
   - TAMPON_ROSCADO_PNP
   etc.

   V1:
   - Resuelve por texto.
   - Puede resolver por mapa UUID -> familia si se le pasa.
   - Puede cargar familias desde Supabase si existe tabla familias.
   - Tiene fallback por descripcion del instrumento.
   =========================================================== */

export const TMP_FAMILY_KEYS = {
  TAMPON_LISO_PNP: "TAMPON_LISO_PNP",
  TAMPON_ROSCADO_PNP: "TAMPON_ROSCADO_PNP",
  VARILLA: "VARILLA",
  RELOJ_COMPARADOR_MILESIMAL: "RELOJ_COMPARADOR_MILESIMAL",
  RELOJ_COMPARADOR_CENTESIMAL: "RELOJ_COMPARADOR_CENTESIMAL",
  MICROMETRO_EXTERIOR: "MICROMETRO_EXTERIOR",
  MICROMETRO_INTERIOR_3_CONTACTOS: "MICROMETRO_INTERIOR_3_CONTACTOS",
  PIE_DE_REY: "PIE_DE_REY",
  SONDA_ALTURA: "SONDA_ALTURA",
  GRAMIL: "GRAMIL",
  RUGOSIMETRO: "RUGOSIMETRO",
  ANILLO_PATRON: "ANILLO_PATRON",
  ANILLO_ROSCADO: "ANILLO_ROSCADO",
  UTILLAJE_PROPIO: "UTILLAJE_PROPIO",
  DUROMETRO: "DUROMETRO",
  LLAVE_DINAMOMETRICA: "LLAVE_DINAMOMETRICA",
  CALIBRE_CHAFLAN_ANGULO: "CALIBRE_CHAFLAN_ANGULO",
  BALANZA: "BALANZA",
  CALIBRE_HERRADURA: "CALIBRE_HERRADURA",
  DESCONOCIDO: "DESCONOCIDO"
};

export function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[º°]/g, " ")
    .replace(/[\/\\_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ""));
}

/* ===========================================================
   Resolucion por texto
   =========================================================== */

export function resolveFamilyFromText(text = "") {
  const txt = normalizeText(text);

  if (!txt) return TMP_FAMILY_KEYS.DESCONOCIDO;
  if (txt.includes("anillo") && (!/tampon|tapon/.test(txt) || /^anillo\b/.test(txt))) {
    return txt.includes("rosca") ? TMP_FAMILY_KEYS.ANILLO_ROSCADO : TMP_FAMILY_KEYS.ANILLO_PATRON;
  }


  if (
    (txt.includes("tampon") || txt.includes("tapon")) &&
    (txt.includes("rosca") || txt.match(/\bm\s*\d+/) || txt.includes("unc") || txt.includes("unf") || txt.includes("bsp") || txt.includes("bsw") || txt.includes("whitworth"))
  ) {
    return TMP_FAMILY_KEYS.TAMPON_ROSCADO_PNP;
  }

  if (
    (txt.includes("tampon") || txt.includes("tapon")) &&
    (txt.includes("liso") || txt.includes("p np") || txt.includes("pasa") || txt.includes("no pasa") || txt.includes("go no go"))
  ) {
    return TMP_FAMILY_KEYS.TAMPON_LISO_PNP;
  }

  if (txt.includes("varilla")) return TMP_FAMILY_KEYS.VARILLA;

  if (txt.includes("reloj") && txt.includes("comparador") && (txt.includes("milesimal") || txt.includes("0.001"))) {
    return TMP_FAMILY_KEYS.RELOJ_COMPARADOR_MILESIMAL;
  }

  if (txt.includes("comparador") || (txt.includes("reloj") && txt.includes("centesimal"))) {
    return TMP_FAMILY_KEYS.RELOJ_COMPARADOR_CENTESIMAL;
  }

  if (txt.includes("micrometro") && (txt.includes("interior") || txt.includes("3 contactos") || txt.includes("tres contactos"))) {
    return TMP_FAMILY_KEYS.MICROMETRO_INTERIOR_3_CONTACTOS;
  }

  if (txt.includes("micrometro")) return TMP_FAMILY_KEYS.MICROMETRO_EXTERIOR;

  if (
    txt.includes("pie de rey") ||
    txt.includes("calibre digital") ||
    txt.includes("calibre analogico") ||
    txt.includes("caliper")
  ) {
    return TMP_FAMILY_KEYS.PIE_DE_REY;
  }

  if (txt.includes("sonda") && txt.includes("altura")) return TMP_FAMILY_KEYS.SONDA_ALTURA;
  if (txt.includes("gramil")) return TMP_FAMILY_KEYS.GRAMIL;
  if (txt.includes("rugos")) return TMP_FAMILY_KEYS.RUGOSIMETRO;

  if (txt.includes("anillo") && txt.includes("rosca")) return TMP_FAMILY_KEYS.ANILLO_ROSCADO;
  if (txt.includes("anillo")) return TMP_FAMILY_KEYS.ANILLO_PATRON;

  if (txt.includes("utillaje") || txt.includes("util fabricacion") || txt.includes("fixture")) {
    return TMP_FAMILY_KEYS.UTILLAJE_PROPIO;
  }

  if (txt.includes("durometro") || txt.includes("dureza")) return TMP_FAMILY_KEYS.DUROMETRO;

  if (txt.includes("dinamometrica") || txt.includes("dinamometrico") || txt.includes("torque")) {
    return TMP_FAMILY_KEYS.LLAVE_DINAMOMETRICA;
  }

  if (txt.includes("chaflan") || txt.includes("angulo")) return TMP_FAMILY_KEYS.CALIBRE_CHAFLAN_ANGULO;

  if (txt.includes("balanza") || txt.includes("bascula")) return TMP_FAMILY_KEYS.BALANZA;

  if (txt.includes("herradura")) return TMP_FAMILY_KEYS.CALIBRE_HERRADURA;

  return TMP_FAMILY_KEYS.DESCONOCIDO;
}

/* ===========================================================
   Resolucion por instrumento completo
   =========================================================== */

export function resolveFamilyFromInstrument(instrumento = {}, options = {}) {
  const manualMap = options.familyIdMap || options.uuidMap || {};
  const familiaId = instrumento.familia_id || instrumento.family_id || null;
  const description = instrumento.descripcion || instrumento.nombre || instrumento.tipo || "";
  const descriptionFamily = resolveFamilyFromText(description);
  const critical = new Set([TMP_FAMILY_KEYS.TAMPON_LISO_PNP, TMP_FAMILY_KEYS.TAMPON_ROSCADO_PNP, TMP_FAMILY_KEYS.ANILLO_PATRON, TMP_FAMILY_KEYS.ANILLO_ROSCADO]);
  const explicitDescription = /liso|rosca|anillo\s+patron/.test(normalizeText(description));
  function reconcile(candidate) {
    if (explicitDescription && critical.has(candidate.family) && critical.has(descriptionFamily) && candidate.family !== descriptionFamily) {
      return { family:TMP_FAMILY_KEYS.DESCONOCIDO, source:"conflicto_familia_descripcion", familia_id:familiaId,
        confidence:0, error:"FAMILIA_CONTRADICTORIA", candidates:[candidate.family,descriptionFamily],
        message:"La familia registrada y la descripción del instrumento se contradicen. Revisar antes de calibrar." };
    }
    return candidate;
  }
  if (familiaId && manualMap[familiaId]) return reconcile({family:manualMap[familiaId],source:"familyIdMap",familia_id:familiaId,confidence:1});
  const directFamily = instrumento.familia_motor || instrumento.familia || instrumento.family || instrumento.familia_nombre || instrumento.nombre_familia;
  if (typeof directFamily === "string" && !isUuid(directFamily)) {
    const family = resolveFamilyFromText(directFamily);
    if (family !== TMP_FAMILY_KEYS.DESCONOCIDO) return reconcile({family,source:"familia_texto",familia_id:familiaId,raw_family:directFamily,confidence:0.95});
  }
  if (critical.has(descriptionFamily) && explicitDescription) {
    return {family:descriptionFamily,source:"descripcion_instrumento",familia_id:familiaId,raw_text:description,confidence:0.9};
  }
  // Observaciones, código y fabricante no definen el tipo de instrumento.
  const combined = [description,instrumento.tipo,instrumento.rango,instrumento.modelo].filter(Boolean).join(" ");
  const family = resolveFamilyFromText(combined);
  return {family,source:family===TMP_FAMILY_KEYS.DESCONOCIDO?"no_detectado":"descripcion_instrumento",familia_id:familiaId,raw_text:combined,confidence:family===TMP_FAMILY_KEYS.DESCONOCIDO?0:0.8};
}

/* ===========================================================
   Carga de familias desde Supabase
   =========================================================== */

/**
 * Intenta cargar una tabla de familias si existe.
 *
 * Como no sabemos si tu tabla se llama:
 * - familias
 * - instrumento_familias
 * - familias_instrumentos
 *
 * V1 permite indicar tableName.
 */
export async function loadFamilyMapFromSupabase(supabase, options = {}) {
  if (!supabase) throw new Error("Falta cliente Supabase");

  const tableName = options.tableName || "familias_instrumentos";

  const selectCols = options.select || (tableName === "familias_instrumentos" ? "id,nombre,descripcion" : "id,nombre");

  const { data, error } = await supabase
    .from(tableName)
    .select(selectCols);

  if (error) {
    return {
      ok: false,
      tableName,
      error,
      map: {}
    };
  }

  const map = {};

  for (const row of data || []) {
    const text = [
      row.codigo,
      row.nombre,
      row.descripcion
    ].filter(Boolean).join(" ");

    map[row.id] = resolveFamilyFromText(text);
  }

  return {
    ok: true,
    tableName,
    rows: data || [],
    map
  };
}

/**
 * Resolver con Supabase:
 * - Si se pasa familyIdMap, lo usa.
 * - Si no, intenta cargar tabla familias.
 * - Si falla, usa descripcion del instrumento.
 */
export async function resolveFamily(supabase, instrumento = {}, options = {}) {
  if (options.familyIdMap || options.uuidMap) {
    return resolveFamilyFromInstrument(instrumento, options);
  }

  if (supabase && options.loadFromSupabase !== false) {
    const tableName = options.tableName || "familias_instrumentos";
    const loaded = await loadFamilyMapFromSupabase(supabase, { tableName, select: options.select });

    if (loaded.ok) {
      const resolved = resolveFamilyFromInstrument(instrumento, {
        familyIdMap: loaded.map
      });

      if (resolved.error) return {...resolved,family_table:tableName,source:`supabase_${tableName}_conflict`};

      if (resolved.family !== TMP_FAMILY_KEYS.DESCONOCIDO) {
        return {
          ...resolved,
          source: `supabase_${tableName}`,
          family_table: tableName
        };
      }
    }
  }

  return resolveFamilyFromInstrument(instrumento, options);
}

/* ===========================================================
   Aplicar familia motor al instrumento
   =========================================================== */

export function attachResolvedFamily(instrumento = {}, resolved = {}) {
  return {
    ...instrumento,
    familia_motor: resolved.family || TMP_FAMILY_KEYS.DESCONOCIDO,
    familia_motor_source: resolved.source || null,
    familia_motor_confidence: resolved.confidence ?? null
  };
}

/* ===========================================================
   Helper para listas
   =========================================================== */

export function resolveFamilyList(instrumentos = [], options = {}) {
  return instrumentos.map((instrumento) => {
    const resolved = resolveFamilyFromInstrument(instrumento, options);
    return attachResolvedFamily(instrumento, resolved);
  });
}

/* ===========================================================
   Ejemplo:
   const resolved = await resolveFamily(supabase, instrumento, {
     tableName: "familias"
   });
   const instrumentoMotor = attachResolvedFamily(instrumento, resolved);
   =========================================================== */
