/* ===========================================================
   TMP THREAD ISO724 DATABASE V1
   -----------------------------------------------------------
   Fuente normativa para dimensiones básicas de rosca métrica ISO.

   ISO 724:
   - D2 = D - 0.6495 * P
   - D1 = D - 1.0825 * P

   Política:
   - No introducir D2/D1 manualmente.
   - Calcular desde nominal y paso.
   - Si la combinación no está cargada como estándar, avisar.
   =========================================================== */

export const TMP_ISO724_DATABASE = {
  "source": "ISO 724:1993",
  "status": "phase_1_formula_engine",
  "authority": "normative",
  "language_runtime": "es",
  "scope": "Dimensiones básicas de roscas métricas ISO de uso general",
  "profile_reference": "ISO 68",
  "formulae": {
    "pitch_diameter_D2": {
      "formula": "D2 = D - 0.6495 * P",
      "description_es": "Diámetro medio básico de rosca interna/externa",
      "rounding": "tabla ISO 724 redondea a 0.001 mm"
    },
    "minor_diameter_D1": {
      "formula": "D1 = D - 1.0825 * P",
      "description_es": "Diámetro menor básico de rosca interna/externa",
      "rounding": "tabla ISO 724 redondea a 0.001 mm"
    },
    "fundamental_triangle_H": {
      "formula": "H = 0.8660254038 * P",
      "description_es": "Altura del triángulo fundamental del perfil de 60°",
      "rounding": "cálculo interno con más decimales"
    }
  },
  "symbols": {
    "D": "diámetro mayor básico de rosca interna; diámetro nominal",
    "d": "diámetro mayor básico de rosca externa; diámetro nominal",
    "D2": "diámetro medio básico de rosca interna",
    "d2": "diámetro medio básico de rosca externa",
    "D1": "diámetro menor básico de rosca interna",
    "d1": "diámetro menor básico de rosca externa",
    "P": "paso",
    "H": "altura del triángulo fundamental"
  },
  "policy": {
    "no_manual_operator_values": true,
    "if_nominal_and_pitch_valid": "calculate_by_formula",
    "if_pitch_not_listed": "calculate but return warning PITCH_NOT_IN_LOADED_ISO724_TABLE until full table is loaded",
    "historical_certificates": "reference_only"
  },
  "sample_checks": [
    {
      "designation": "M33x2",
      "D": 33,
      "P": 2,
      "D2": 31.701,
      "D1": 30.835
    },
    {
      "designation": "M14x2",
      "D": 14,
      "P": 2,
      "D2": 12.701,
      "D1": 11.835
    },
    {
      "designation": "M16x1.5",
      "D": 16,
      "P": 1.5,
      "D2": 15.026,
      "D1": 14.376
    }
  ],
  "loaded_pitch_examples": {
    "coarse_common": {
      "M3": 0.5,
      "M4": 0.7,
      "M5": 0.8,
      "M6": 1.0,
      "M8": 1.25,
      "M10": 1.5,
      "M12": 1.75,
      "M14": 2.0,
      "M16": 2.0,
      "M18": 2.5,
      "M20": 2.5,
      "M22": 2.5,
      "M24": 3.0,
      "M30": 3.5,
      "M36": 4.0,
      "M42": 4.5,
      "M48": 5.0,
      "M56": 5.5,
      "M64": 6.0
    },
    "fine_examples_from_iso724_table": {
      "M8": [
        1.0,
        0.75
      ],
      "M10": [
        1.25,
        1.0,
        0.75
      ],
      "M12": [
        1.5,
        1.25,
        1.0
      ],
      "M14": [
        1.5,
        1.25,
        1.0
      ],
      "M16": [
        1.5,
        1.0
      ],
      "M18": [
        2.0,
        1.5,
        1.0
      ],
      "M20": [
        2.0,
        1.5,
        1.0
      ],
      "M22": [
        2.0,
        1.5,
        1.0
      ],
      "M24": [
        2.0,
        1.5,
        1.0
      ],
      "M30": [
        3.0,
        2.0,
        1.5,
        1.0
      ]
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

export function normalizeMetricDesignationKey(nominalMm) {
  const n = parseNum(nominalMm, NaN);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `M${Number.isInteger(n) ? n : n}`;
}

export function normalizePitchKey(pitchMm) {
  const p = parseNum(pitchMm, NaN);
  if (!Number.isFinite(p) || p <= 0) return null;
  return String(round(p, 6)).replace(/\.?0+$/, "");
}

export function isLoadedISO724PitchCombination({ nominal_mm, pitch_mm } = {}) {
  const mkey = normalizeMetricDesignationKey(nominal_mm);
  const p = parseNum(pitch_mm, NaN);

  if (!mkey || !Number.isFinite(p)) {
    return {
      ok: false,
      error: "DATOS_INSUFICIENTES_ISO724"
    };
  }

  const coarse = TMP_ISO724_DATABASE.loaded_pitch_examples.coarse_common[mkey];
  if (coarse !== undefined && parseNum(coarse) === p) {
    return {
      ok: true,
      kind: "COARSE_COMMON",
      nominal_key: mkey,
      pitch_mm: p
    };
  }

  const fine = TMP_ISO724_DATABASE.loaded_pitch_examples.fine_examples_from_iso724_table[mkey] || [];
  if (fine.some(x => parseNum(x) === p)) {
    return {
      ok: true,
      kind: "FINE_EXAMPLE_LOADED",
      nominal_key: mkey,
      pitch_mm: p
    };
  }

  return {
    ok: false,
    error: "PITCH_NOT_IN_LOADED_ISO724_TABLE",
    nominal_key: mkey,
    pitch_mm: p,
    message:
      "La geometría básica puede calcularse por fórmula ISO724, pero la combinación nominal/paso aún no está marcada como cargada en la tabla."
  };
}

export function calculateISO724BasicDimensions({ nominal_mm, pitch_mm } = {}) {
  const D = parseNum(nominal_mm, NaN);
  const P = parseNum(pitch_mm, NaN);

  if (!Number.isFinite(D) || D <= 0 || !Number.isFinite(P) || P <= 0) {
    return {
      ok: false,
      error: "DATOS_INSUFICIENTES_DIMENSIONES_BASICAS",
      message: "Faltan diámetro nominal o paso."
    };
  }

  const D2 = D - 0.6495 * P;
  const D1 = D - 1.0825 * P;
  const H = 0.8660254038 * P;

  const loaded = isLoadedISO724PitchCombination({ nominal_mm: D, pitch_mm: P });

  return {
    ok: true,
    source: "ISO724",
    standard: "ISO 724:1993",
    nominal_mm: round(D, 6),
    pitch_mm: round(P, 6),
    basic_mm: {
      major_diameter_D_d: round(D, 6),
      pitch_diameter_D2_d2: round(D2, 6),
      minor_diameter_D1_d1: round(D1, 6),
      H: round(H, 9)
    },
    table_rounded_mm: {
      pitch_diameter_D2_d2: round(D2, 3),
      minor_diameter_D1_d1: round(D1, 3)
    },
    formulae: {
      D2: "D2 = D - 0.6495 * P",
      D1: "D1 = D - 1.0825 * P",
      H: "H = 0.8660254038 * P"
    },
    pitch_combination: loaded.ok ? loaded : {
      ...loaded,
      severity: "warning"
    },
    warnings: loaded.ok ? [] : [loaded.message]
  };
}
