/* ===========================================================
   TMP THREAD UNCERTAINTY RESOLVER V6
   -----------------------------------------------------------
   Resolutor automático de incertidumbre para MT16.
   El operario NO introduce incertidumbres.
   =========================================================== */

export const TMP_THREAD_UNCERTAINTY_RESOLVER_VERSION =
  "TMP_THREAD_UNCERTAINTY_RESOLVER_V6_20260624";

export const TMP_MT16_DEFAULT_UNCERTAINTY_MODEL = {
  source: "TMP_MT16_DEFAULT_UNCERTAINTY_MODEL_V1",
  status: "AUTO_PROVISIONAL_HASTA_CERTIFICADOS",
  u_trimos: 0.0005,
  u_wire: 0.0003,
  u_pattern: 0,
  resolution: 0.001,
  u_temperature: 0,
  k: 2,
  can_emit_certificate: false,
  warning:
    "Modelo provisional. Para certificado final deben cargarse incertidumbres reales de banco Trimos, rodillos y patrón."
};

export const TMP_MT16_LOCAL_UNCERTAINTY_CATALOG = {
  TRIMOS: {
    banco: "TRIMOS",
    resolution: 0.001,
    u_trimos: 0.0005,
    source: "LOCAL_DEFAULT_TRIMOS"
  },

  RODILLOS_ROSCA: {
    tipo: "RODILLOS_ROSCA",
    u_wire: 0.0003,
    source: "LOCAL_DEFAULT_THREAD_WIRES"
  }
};

export function parseNum(value, fallback = null) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeCode(value = "") {
  return String(value || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_\-]/g, "")
    .trim();
}

export function resolveBenchUncertaintyFromLocalCatalog(trimosPlan = {}) {
  const banco = normalizeCode(trimosPlan?.setup?.banco || "TRIMOS");
  const row =
    TMP_MT16_LOCAL_UNCERTAINTY_CATALOG[banco] ||
    TMP_MT16_LOCAL_UNCERTAINTY_CATALOG.TRIMOS;

  return {
    ok: true,
    source: row.source,
    banco: row.banco || banco,
    u_trimos: row.u_trimos,
    resolution: row.resolution,
    certificate_id: null,
    certificate_required: true
  };
}

export function resolveWireUncertaintyFromLocalCatalog(trimosPlan = {}) {
  const wire = parseNum(trimosPlan?.setup?.wire_mm, null);
  const row = TMP_MT16_LOCAL_UNCERTAINTY_CATALOG.RODILLOS_ROSCA;

  return {
    ok: true,
    source: row.source,
    wire_mm: wire,
    u_wire: row.u_wire,
    certificate_id: null,
    certificate_required: true
  };
}

export function resolvePatternUncertaintyFromLocalCatalog() {
  return {
    ok: true,
    source: "NO_PATTERN_LINKED_YET",
    u_pattern: 0,
    certificate_id: null,
    certificate_required: true,
    warning:
      "Todavía no hay patrón de ajuste/verificación enlazado al flujo MT16."
  };
}

export function resolveMT16UncertaintyModelSync({
  workflow = {},
  trimosPlan = null
} = {}) {
  const plan = trimosPlan || workflow?.trimos || null;

  const bench = resolveBenchUncertaintyFromLocalCatalog(plan);
  const wire = resolveWireUncertaintyFromLocalCatalog(plan);
  const pattern = resolvePatternUncertaintyFromLocalCatalog();

  const model = {
    source: "TMP_MT16_UNCERTAINTY_RESOLVER",
    resolver_version: TMP_THREAD_UNCERTAINTY_RESOLVER_VERSION,
    status: "AUTO_PROVISIONAL_HASTA_CERTIFICADOS",

    banco: bench.banco || "TRIMOS",
    wire_mm: wire.wire_mm,

    u_trimos: parseNum(bench.u_trimos, TMP_MT16_DEFAULT_UNCERTAINTY_MODEL.u_trimos),
    u_wire: parseNum(wire.u_wire, TMP_MT16_DEFAULT_UNCERTAINTY_MODEL.u_wire),
    u_pattern: parseNum(pattern.u_pattern, TMP_MT16_DEFAULT_UNCERTAINTY_MODEL.u_pattern),
    resolution: parseNum(bench.resolution, TMP_MT16_DEFAULT_UNCERTAINTY_MODEL.resolution),
    u_temperature: TMP_MT16_DEFAULT_UNCERTAINTY_MODEL.u_temperature,
    k: TMP_MT16_DEFAULT_UNCERTAINTY_MODEL.k,

    components_source: {
      bench,
      wire,
      pattern
    },

    can_emit_certificate: false,

    warnings: [
      "Incertidumbre automática provisional hasta enlazar certificados reales.",
      "Falta certificado real del banco Trimos.",
      "Falta certificado real de rodillos/varillas.",
      pattern.warning
    ].filter(Boolean)
  };

  return {
    ok: true,
    source: "thread_uncertainty_resolver",
    version: TMP_THREAD_UNCERTAINTY_RESOLVER_VERSION,
    model
  };
}

export async function resolveMT16UncertaintyModel(args = {}) {
  return resolveMT16UncertaintyModelSync(args);
}

export default {
  TMP_THREAD_UNCERTAINTY_RESOLVER_VERSION,
  TMP_MT16_DEFAULT_UNCERTAINTY_MODEL,
  TMP_MT16_LOCAL_UNCERTAINTY_CATALOG,
  resolveMT16UncertaintyModel,
  resolveMT16UncertaintyModelSync
};
