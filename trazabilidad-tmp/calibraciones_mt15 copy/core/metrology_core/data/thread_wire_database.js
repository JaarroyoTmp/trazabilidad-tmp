/* ===========================================================
   TMP THREAD WIRE DATABASE V1
   Base de rodillos/hilos para medicion de roscas en Trimos.
   =========================================================== */

export const TMP_THREAD_WIRE_DATABASE = {
  meta: {
    version: "TMP_THREAD_WIRE_DATABASE_V1",
    units: "mm",
    status: "BASE_TMP_VALIDABLE",
    policy: "Si no existe rodillo cargado, devolver RODILLO_NO_CARGADO. No inventar."
  },

  metric_by_pitch: {
    "0.5": { pitch_mm: 0.5, wire_mm: 0.335, source: "TMP_TABLA_RODILLOS_HISTORICA", status: "TMP_VALIDADO" },
    "0.75": { pitch_mm: 0.75, wire_mm: 0.53, source: "TMP_TABLA_RODILLOS_HISTORICA", status: "TMP_VALIDADO" },
    "1": { pitch_mm: 1, wire_mm: 0.725, source: "TMP_TABLA_RODILLOS_HISTORICA", status: "TMP_VALIDADO" },
    "1.25": { pitch_mm: 1.25, wire_mm: 0.895, source: "TMP_TABLA_RODILLOS_HISTORICA", status: "TMP_VALIDADO" },
    "1.5": { pitch_mm: 1.5, wire_mm: 1.35, source: "TMP_TABLA_RODILLOS_HISTORICA", status: "TMP_VALIDADO", note: "Validar contra certificados: M85x1.5 usa override 0.895." },
    "1.75": { pitch_mm: 1.75, wire_mm: 1.10, source: "TMP_TABLA_RODILLOS_HISTORICA", status: "TMP_VALIDADO" },
    "2": { pitch_mm: 2, wire_mm: 1.35, source: "TMP_TABLA_RODILLOS_HISTORICA_M33x2", status: "TMP_VALIDADO" },
    "2.5": { pitch_mm: 2.5, wire_mm: 1.65, source: "TMP_TABLA_RODILLOS_HISTORICA", status: "TMP_VALIDADO" },
    "3": { pitch_mm: 3, wire_mm: 2.05, source: "TMP_TABLA_RODILLOS_HISTORICA", status: "TMP_VALIDADO" },
    "3.5": { pitch_mm: 3.5, wire_mm: 2.55, source: "TMP_TABLA_RODILLOS_HISTORICA", status: "TMP_VALIDADO" },
    "4": { pitch_mm: 4, wire_mm: 2.55, source: "TMP_TABLA_RODILLOS_HISTORICA", status: "TMP_VALIDADO" },
    "5": { pitch_mm: 5, wire_mm: 3.20, source: "TMP_TABLA_RODILLOS_HISTORICA", status: "TMP_VALIDADO" }
  },

  unified_by_tpi: {},
  whitworth_by_tpi: {},
  pipe_by_tpi: {},
  npt_by_tpi: {},

  historical_overrides: {
    "M33x2-H6": {
      pitch_mm: 2,
      wire_mm: 1.35,
      correction_mm: 2.317949266,
      source: "TMP_CERTIFICADO_HISTORICO_166",
      status: "VALIDADO_CERTIFICADO"
    },
    "M85x1.5-H6": {
      pitch_mm: 1.5,
      wire_mm: 0.895,
      correction_mm: 1.385961905,
      source: "TMP_CERTIFICADO_HISTORICO_594",
      status: "VALIDADO_CERTIFICADO",
      note: "Override historico hasta cerrar tabla maestra final."
    }
  }
};

export function parseNum(value, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function round(value, decimals = 6) {
  const f = Math.pow(10, decimals);
  return Math.round(parseNum(value) * f) / f;
}

export function normalizePitchKey(pitchMm) {
  const p = parseNum(pitchMm, NaN);
  if (!Number.isFinite(p) || p <= 0) return null;
  return String(round(p, 6)).replace(/\.?0+$/, "");
}

export function getHistoricalWireOverride({ nominal_mm, pitch_mm, tolerance_class } = {}) {
  const clsRaw = String(tolerance_class || "").replace(/\s+/g, "").toUpperCase();
  const classCandidates = [clsRaw, clsRaw.replace(/^6H$/, "H6"), clsRaw.replace(/^H6$/, "6H")].filter(Boolean);
  const n = parseNum(nominal_mm, NaN);
  const p = parseNum(pitch_mm, NaN);

  if (!Number.isFinite(n) || !Number.isFinite(p)) return { ok: false, error: "DATOS_INSUFICIENTES_OVERRIDE" };

  for (const cls of classCandidates) {
    const key = `M${Number.isInteger(n) ? n : n}x${normalizePitchKey(p)}-${cls}`;
    const data = TMP_THREAD_WIRE_DATABASE.historical_overrides[key];
    if (data) return { ok: true, key, data };
  }

  return { ok: false, error: "OVERRIDE_NO_ENCONTRADO" };
}

export function getMetricWireByPitch(pitchMm) {
  const key = normalizePitchKey(pitchMm);

  if (!key) {
    return { ok: false, error: "PASO_INVALIDO", message: "No se puede elegir rodillo porque el paso no es válido." };
  }

  const data = TMP_THREAD_WIRE_DATABASE.metric_by_pitch[key];

  if (!data) {
    return {
      ok: false,
      error: "RODILLO_METRICO_NO_CARGADO",
      pitch_key: key,
      message: `No hay rodillo métrico cargado para paso ${key} mm.`
    };
  }

  return {
    ok: true,
    family: "METRIC",
    pitch_key: key,
    pitch_mm: data.pitch_mm,
    wire_mm: data.wire_mm,
    source: data.source,
    status: data.status,
    note: data.note || null,
    raw: data
  };
}

export function resolveThreadWireFromParsed(parsed = {}, options = {}) {
  if (!parsed?.ok) return { ok: false, error: "PARSED_INVALIDO" };

  const family = String(parsed.family || parsed.thread_type || "").toUpperCase();

  if (options.use_historical_overrides !== false) {
    const override = getHistoricalWireOverride({
      nominal_mm: parsed.nominal_mm,
      pitch_mm: parsed.pitch_mm,
      tolerance_class: parsed.tolerance_class
    });

    if (override.ok) {
      return {
        ok: true,
        family: "METRIC",
        source: override.data.source,
        status: override.data.status,
        pitch_mm: override.data.pitch_mm,
        wire_mm: override.data.wire_mm,
        correction_mm: override.data.correction_mm ?? null,
        historical_override: true,
        key: override.key,
        note: override.data.note || null,
        raw: override.data
      };
    }
  }

  if (family.includes("M") || family.includes("METRIC")) return getMetricWireByPitch(parsed.pitch_mm);

  if (family.includes("UNC") || family.includes("UNF") || family.includes("UN")) {
    return { ok: false, error: "RODILLO_UNIFIED_NO_CARGADO_V1", message: "UNC/UNF reconocido, pero V1 no tiene tabla validada." };
  }

  if (family.includes("BSW") || family.includes("BSF") || family.includes("G") || family.includes("R")) {
    return { ok: false, error: "RODILLO_55_NO_CARGADO_V1", message: "Familia 55 grados reconocida, pero V1 no tiene tabla validada." };
  }

  return { ok: false, error: "FAMILIA_RODILLO_NO_IMPLEMENTADA", family };
}

export function getThreadWireDatabaseInfo() {
  return {
    meta: TMP_THREAD_WIRE_DATABASE.meta,
    loaded: {
      metric_by_pitch: Object.keys(TMP_THREAD_WIRE_DATABASE.metric_by_pitch),
      unified_by_tpi: Object.keys(TMP_THREAD_WIRE_DATABASE.unified_by_tpi),
      whitworth_by_tpi: Object.keys(TMP_THREAD_WIRE_DATABASE.whitworth_by_tpi),
      pipe_by_tpi: Object.keys(TMP_THREAD_WIRE_DATABASE.pipe_by_tpi),
      historical_overrides: Object.keys(TMP_THREAD_WIRE_DATABASE.historical_overrides)
    }
  };
}
