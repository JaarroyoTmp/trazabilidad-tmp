// core/metrology_core/thread/mt16_normative_contract.js
// TMP MT16 · Contrato normativo
// Regla: si no hay rodillos + nominal teorico + fuente normativa validada, NO se permite medir.

export const MT16_NORMATIVE_CONTRACT_VERSION = "TMP_MT16_NORMATIVE_CONTRACT_V1_20260701";

export function parseThreadDesignation(text = "") {
  const raw = String(text || "")
    .toUpperCase()
    .replace(",", ".")
    .replace(/×/g, "X")
    .replace(/\s+/g, " ")
    .trim();

  const m =
    raw.match(/M\s*(\d+(?:\.\d+)?)\s*X\s*(\d+(?:\.\d+)?)/) ||
    raw.match(/M\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/);

  const c = raw.match(/(?:^|\s|-)([0-9][A-Z])(?:\s|$)/);

  if (!m) {
    return {
      ok: false,
      error: "No se reconoce designacion de rosca metrica ISO. Ejemplo valido: M12 x 1.25 - 6H",
      raw
    };
  }

  return {
    ok: true,
    system: "ISO_METRIC",
    nominal_mm: Number(m[1]),
    pitch_mm: Number(m[2]),
    tolerance_class: c ? c[1] : "6H",
    angle_deg: 60,
    raw
  };
}

function round6(v) {
  return Math.round(Number(v) * 1000000) / 1000000;
}

function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

export function computeIsoMetricAuxiliaryGeometry(parsed) {
  if (!parsed?.ok || !isFiniteNumber(parsed.nominal_mm) || !isFiniteNumber(parsed.pitch_mm)) {
    return { ok: false, error: "Falta nominal o paso de rosca." };
  }

  const P = parsed.pitch_mm;
  const D = parsed.nominal_mm;

  return {
    ok: true,
    best_wire_mm_aux: round6(0.5773502691896258 * P),
    pitch_diameter_basic_mm_aux: round6(D - 0.649519052838329 * P),
    note: "Geometria auxiliar ISO 60. No sustituye tabla normativa validada."
  };
}

export function resolveMT16NormativeContract(input = {}) {
  const parsed = parseThreadDesignation(
    [input.designation, input.rango, input.descripcion, input.modelo].filter(Boolean).join(" ")
  );

  if (!parsed.ok) {
    return block("THREAD_PARSE_ERROR", parsed.error, { parsed });
  }

  const auxiliaryGeometry = computeIsoMetricAuxiliaryGeometry(parsed);

  // Este objeto debe venir del motor normativo real / tablas validadas.
  const validated =
    input.validated_normative ||
    input.normative ||
    input.normativa ||
    null;

  const rodillos =
    validated?.rodillos_recomendados_mm ??
    validated?.wire_mm ??
    validated?.rodillo_mm ??
    null;

  const nominalLectura =
    validated?.nominal_teorico_lectura_mm ??
    validated?.target_reading_mm ??
    validated?.nominal_reading_mm ??
    null;

  const correccion =
    validated?.correccion_trimos_teorica_mm ??
    validated?.trimos_correction_mm ??
    validated?.correction_mm ??
    null;

  const fuente =
    validated?.norma_origen ??
    validated?.source ??
    validated?.norma ??
    null;

  const hasValidated =
    Number.isFinite(Number(rodillos)) &&
    Number.isFinite(Number(nominalLectura)) &&
    String(fuente || "").trim().length > 0;

  if (!hasValidated) {
    return {
      ok: false,
      blocked: true,
      block_code: "MISSING_VALIDATED_NORMATIVE_DATA",
      message: "No se puede continuar: faltan rodillos y/o nominal teorico calculados por motor/tablas normativas validadas.",
      parsed,
      auxiliary_geometry: auxiliaryGeometry,
      required_fields: [
        "rodillos_recomendados_mm",
        "nominal_teorico_lectura_mm",
        "norma_origen"
      ],
      operator_instruction:
        "Revisar tabla/motor normativo MT16. No introducir lecturas hasta disponer de rodillos y nominal teorico validados.",
      output: null
    };
  }

  return {
    ok: true,
    blocked: false,
    parsed,
    auxiliary_geometry: auxiliaryGeometry,
    output: {
      rodillos_recomendados_mm: round6(rodillos),
      nominal_teorico_lectura_mm: round6(nominalLectura),
      correccion_trimos_teorica_mm: correccion == null ? null : round6(correccion),
      norma_origen: fuente,
      metodo_medicion:
        validated?.metodo_medicion ||
        "Medicion sobre rodillos/hilos en banco horizontal Trimos",
      patron_principal: "Banco Trimos certificado",
      utiles_medicion: "Rodillos/hilos calculados por norma",
      decision_policy: "ILAC-G8 / ISO 14253 segun configuracion TMP"
    },
    operator_instruction:
      `Montar rodillos/hilos Ø ${round6(rodillos)} mm y recoger lecturas alrededor de ${round6(nominalLectura)} mm.`
  };
}

function block(code, message, extra = {}) {
  return {
    ok: false,
    blocked: true,
    block_code: code,
    message,
    output: null,
    ...extra
  };
}
