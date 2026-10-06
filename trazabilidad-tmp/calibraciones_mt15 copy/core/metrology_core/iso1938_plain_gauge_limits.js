/* ===========================================================
   TMP ISO 1938-1:2015 - PLAIN LIMIT GAUGE LIMITS V1
   -----------------------------------------------------------
   Motor normativo para calibres lisos limite de tamano lineal.

   Alcance V1 TMP:
   - Calibres tampon lisos cilindricos completos (Gauge type A).
   - Caracteristicas internas (agujeros), hasta 500 mm.
   - Estado NUEVO y estado LIMITE DE DESGASTE.
   - ISO 1938-1:2015, apartados 7.2 y 7.4, tablas 6 a 11.
   - ISO 286-1:2010, tabla de grados IT, para obtener H.

   Regla importante:
   - Si la tolerancia de pieza NO viene como codigo ISO 286,
     se selecciona el grado IT mas amplio cuyo intervalo T sea
     <= a la tolerancia real de pieza en el mismo rango nominal.
   - Para calibracion periodica de utiles en servicio TMP se usan
     por defecto los LIMITES DE DESGASTE, no los limites de nuevo.
   =========================================================== */

export function parseNum(value, fallback = NaN) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function round(value, decimals = 6) {
  const n = parseNum(value);
  if (!Number.isFinite(n)) return null;
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

const SIZE_RANGES = [
  [0, 3], [3, 6], [6, 10], [10, 18], [18, 30], [30, 50],
  [50, 80], [80, 120], [120, 180], [180, 250], [250, 315],
  [315, 400], [400, 500]
];

/* ISO 286-1:2010 / ISO 286-2:2010 - valores IT en micrometros. */
const ISO286_IT_UM = {
  1:  [0.8, 1, 1, 1.2, 1.5, 1.5, 2, 2.5, 3.5, 4.5, 6, 7, 8],
  2:  [1.2, 1.5, 1.5, 2, 2.5, 2.5, 3, 4, 5, 7, 8, 9, 10],
  3:  [2, 2.5, 2.5, 3, 4, 4, 5, 6, 8, 10, 12, 13, 15],
  4:  [3, 4, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20],
  5:  [4, 5, 6, 8, 9, 11, 13, 15, 18, 20, 23, 25, 27],
  6:  [6, 8, 9, 11, 13, 16, 19, 22, 25, 29, 32, 36, 40],
  7:  [10, 12, 15, 18, 21, 25, 30, 35, 40, 46, 52, 57, 63],
  8:  [14, 18, 22, 27, 33, 39, 46, 54, 63, 72, 81, 89, 97],
  9:  [25, 30, 36, 43, 52, 62, 74, 87, 100, 115, 130, 140, 155],
  10: [40, 48, 58, 70, 84, 100, 120, 140, 160, 185, 210, 230, 250],
  11: [60, 75, 90, 110, 130, 160, 190, 220, 250, 290, 320, 360, 400],
  12: [100, 120, 150, 180, 210, 250, 300, 350, 400, 460, 520, 570, 630],
  13: [140, 180, 220, 270, 330, 390, 460, 540, 630, 720, 810, 890, 970],
  14: [250, 300, 360, 430, 520, 620, 740, 870, 1000, 1150, 1300, 1400, 1550],
  15: [400, 480, 580, 700, 840, 1000, 1200, 1400, 1600, 1850, 2100, 2300, 2500],
  16: [600, 750, 900, 1100, 1300, 1600, 1900, 2200, 2500, 2900, 3200, 3600, 4000],
  17: [1000, 1200, 1500, 1800, 2100, 2500, 3000, 3500, 4000, 4600, 5200, 5700, 6300],
  18: [1400, 1800, 2200, 2700, 3300, 3900, 4600, 5400, 6300, 7200, 8100, 8900, 9700]
};

/* ISO 1938-1:2015 tablas 7-11: T, z, alpha, y en micrometros. */
const PARAMS = {
  6: [
    [6,1,0,1],[8,1.5,0,1],[9,1.5,0,1],[11,2,0,1.5],[13,2,0,1.5],[16,2.5,0,2],
    [19,2.5,0,2],[22,3,0,3],[25,4,0,3],[29,5,2,4],[32,6,3,5],[36,7,4,6],[40,8,5,7]
  ],
  7: [
    [10,1.5,0,1.5],[12,2,0,1.5],[15,2,0,1.5],[18,2.5,0,2],[21,3,0,3],[25,3.5,0,3],
    [30,4,0,3],[35,5,0,4],[40,6,0,4],[46,7,3,6],[52,8,4,7],[57,10,6,8],[63,11,7,9]
  ],
  8: [
    [14,2,0,3],[18,3,0,3],[22,3,0,3],[27,4,0,4],[33,5,0,4],[39,6,0,5],
    [46,7,0,5],[54,8,0,6],[63,9,0,6],[72,12,4,7],[81,14,6,9],[89,16,7,9],[97,18,9,11]
  ],
  9: [
    [25,5,0,0],[30,6,0,0],[36,7,0,0],[43,8,0,0],[52,9,0,0],[62,11,0,0],
    [74,13,0,0],[87,15,0,0],[100,18,0,0],[115,21,4,0],[130,24,6,0],[140,28,7,0],[155,32,9,0]
  ],
  10: [
    [40,5,0,0],[48,6,0,0],[58,7,0,0],[70,8,0,0],[84,9,0,0],[100,11,0,0],
    [120,13,0,0],[140,15,0,0],[160,18,0,0],[185,24,7,0],[210,27,9,0],[230,32,11,0],[250,37,14,0]
  ],
  11: [
    [60,10,0,0],[75,12,0,0],[90,14,0,0],[110,16,0,0],[130,19,0,0],[160,22,0,0],
    [190,25,0,0],[220,28,0,0],[250,32,0,0],[290,40,10,0],[320,45,15,0],[360,50,15,0],[400,55,20,0]
  ],
  12: [
    [100,10,0,0],[120,12,0,0],[150,14,0,0],[180,16,0,0],[210,19,0,0],[250,22,0,0],
    [300,25,0,0],[350,28,0,0],[400,32,0,0],[460,45,15,0],[520,50,20,0],[570,65,30,0],[630,70,35,0]
  ],
  13: [
    [140,20,0,0],[180,24,0,0],[220,28,0,0],[270,32,0,0],[330,36,0,0],[390,42,0,0],
    [460,48,0,0],[540,54,0,0],[630,60,0,0],[720,80,25,0],[810,90,35,0],[890,100,45,0],[970,110,55,0]
  ],
  14: [
    [250,20,0,0],[300,24,0,0],[360,28,0,0],[430,32,0,0],[520,36,0,0],[620,42,0,0],
    [740,48,0,0],[870,54,0,0],[1000,60,0,0],[1150,100,45,0],[1300,110,55,0],[1400,125,70,0],[1550,145,90,0]
  ],
  15: [
    [400,40,0,0],[480,48,0,0],[580,56,0,0],[700,64,0,0],[840,72,0,0],[1000,80,0,0],
    [1200,90,0,0],[1400,100,0,0],[1600,110,0,0],[1850,170,70,0],[2100,190,90,0],[2300,210,110,0],[2500,240,140,0]
  ],
  16: [
    [600,40,0,0],[750,48,0,0],[900,56,0,0],[1100,64,0,0],[1300,72,0,0],[1600,80,0,0],
    [1900,90,0,0],[2200,100,0,0],[2500,110,0,0],[2900,210,110,0],[3200,240,140,0],[3600,280,180,0],[4000,320,220,0]
  ],
  17: [
    [1000,80,0,0],[1200,96,0,0],[1500,112,0,0],[1800,125,0,0],[2100,140,0,0],[2500,160,0,0],
    [3000,180,0,0],[3500,200,0,0],[4000,220,0,0],[4600,360,180,0],[5200,400,200,0],[5700,450,230,0],[6300,500,250,0]
  ],
  18: [
    [1400,80,0,0],[1800,96,0,0],[2200,112,0,0],[2700,125,0,0],[3300,140,0,0],[3900,160,0,0],
    [4600,180,0,0],[5400,200,0,0],[6300,220,0,0],[7200,470,230,0],[8100,520,250,0],[8900,600,280,0],[9700,710,320,0]
  ]
};

/* Tabla 6, Gauge type A: grado IT usado para H segun el grado de la pieza. */
const TYPE_A_H_GRADE = {
  6: 2,
  7: 3,
  8: 3,
  9: 3,
  10: 3,
  11: 5,
  12: 5,
  13: 7,
  14: 7,
  15: 7,
  16: 7,
  17: 7,
  18: 7
};

export function findSizeRangeIndex(sizeMm) {
  const d = parseNum(sizeMm);
  if (!Number.isFinite(d) || d <= 0 || d > 500) return -1;
  return SIZE_RANGES.findIndex(([min, max]) => d > min && d <= max);
}

export function getISO286ITWidthUm(sizeMm, grade) {
  const idx = findSizeRangeIndex(sizeMm);
  const row = ISO286_IT_UM[Number(grade)];
  if (idx < 0 || !row) return null;
  return row[idx];
}

export function resolveEquivalentITGrade(sizeMm, workpieceToleranceUm, explicitGrade = null) {
  const idx = findSizeRangeIndex(sizeMm);
  const Tactual = parseNum(workpieceToleranceUm);
  if (idx < 0 || !Number.isFinite(Tactual) || Tactual <= 0) {
    return { ok: false, error: "DATOS_INVALIDOS_EQUIVALENTE_IT" };
  }

  if (explicitGrade !== null && explicitGrade !== undefined) {
    const g = Number(explicitGrade);
    if (g >= 6 && g <= 18 && PARAMS[g]) {
      return {
        ok: true,
        grade: g,
        T_um: PARAMS[g][idx][0],
        source: "ISO286_CODE_EXPLICITO"
      };
    }
  }

  let selected = null;
  for (let g = 6; g <= 18; g += 1) {
    const row = PARAMS[g];
    if (!row) continue;
    const T = row[idx][0];
    if (T <= Tactual) selected = { grade: g, T_um: T };
  }

  if (!selected) {
    return {
      ok: false,
      error: "TOLERANCIA_MAS_ESTRECHA_QUE_IT6",
      message: "La tolerancia de pieza es mas estrecha que IT6 para este rango. ISO 1938-1 tablas 7-11 comienzan en IT6."
    };
  }

  return {
    ok: true,
    ...selected,
    source: "ISO1938_7_4_PRIMER_IT_INFERIOR_O_IGUAL"
  };
}

export function getISO1938Parameters(sizeMm, grade) {
  const idx = findSizeRangeIndex(sizeMm);
  const g = Number(grade);
  if (idx < 0 || !PARAMS[g]) return { ok: false, error: "PARAMETROS_NO_DISPONIBLES" };

  const [T, z, alpha, y] = PARAMS[g][idx];
  const hGrade = TYPE_A_H_GRADE[g];
  const H = getISO286ITWidthUm(sizeMm, hGrade);

  if (!Number.isFinite(H)) {
    return { ok: false, error: "H_NO_DISPONIBLE", h_grade: hGrade };
  }

  return {
    ok: true,
    grade: g,
    range: SIZE_RANGES[idx],
    T_um: T,
    z_um: z,
    alpha_um: alpha,
    y_um: y,
    H_um: H,
    H_grade: hGrade,
    gauge_type: "A",
    source: "ISO_1938_1_2015_TABLES_6_11"
  };
}

export function calculateInternalPlugGaugeLimits({
  workpieceLowerMm,
  workpieceUpperMm,
  sizeMm = null,
  isoGrade = null
} = {}) {
  const LSLw = parseNum(workpieceLowerMm);
  const USLw = parseNum(workpieceUpperMm);

  if (!Number.isFinite(LSLw) || !Number.isFinite(USLw) || USLw <= LSLw) {
    return { ok: false, error: "LIMITES_PIEZA_INVALIDOS" };
  }

  const referenceSize = Number.isFinite(parseNum(sizeMm)) ? parseNum(sizeMm) : (LSLw + USLw) / 2;
  const toleranceUm = (USLw - LSLw) * 1000;

  const eq = resolveEquivalentITGrade(referenceSize, toleranceUm, isoGrade);
  if (!eq.ok) return eq;

  const p = getISO1938Parameters(referenceSize, eq.grade);
  if (!p.ok) return p;

  const H2 = p.H_um / 2 / 1000;
  const z = p.z_um / 1000;
  const alpha = p.alpha_um / 1000;
  const y = p.y_um / 1000;

  // Caracteristica interna: MMLS = limite inferior; LMLS = limite superior.
  const goNew = {
    lower: LSLw + z - H2,
    upper: LSLw + z + H2
  };

  const goWear = {
    lower: LSLw + alpha - y,
    upper: LSLw + z + H2
  };

  // NO GO: limites de nuevo y desgaste coinciden en ISO 1938-1:2015 para este caso.
  const noGo = {
    lower: USLw - alpha - H2,
    upper: USLw - alpha + H2
  };

  const center = (a, b) => (a + b) / 2;

  return {
    ok: true,
    standard: "ISO 1938-1:2015",
    scope: "INTERNAL_FEATURE_FULL_FORM_CYLINDRICAL_PLUG_GAUGE_TYPE_A",
    workpiece: {
      lower_mm: round(LSLw, 6),
      upper_mm: round(USLw, 6),
      tolerance_um: round(toleranceUm, 3),
      MMLS_mm: round(LSLw, 6),
      LMLS_mm: round(USLw, 6)
    },
    equivalent_it: eq,
    parameters: p,
    pasa: {
      side: "PASA",
      new_state: {
        lower_mm: round(goNew.lower, 6),
        upper_mm: round(goNew.upper, 6),
        center_mm: round(center(goNew.lower, goNew.upper), 6)
      },
      wear_state: {
        lower_mm: round(goWear.lower, 6),
        upper_mm: round(goWear.upper, 6),
        center_mm: round(center(goWear.lower, goWear.upper), 6)
      }
    },
    no_pasa: {
      side: "NO_PASA",
      new_state: {
        lower_mm: round(noGo.lower, 6),
        upper_mm: round(noGo.upper, 6),
        center_mm: round(center(noGo.lower, noGo.upper), 6)
      },
      wear_state: {
        lower_mm: round(noGo.lower, 6),
        upper_mm: round(noGo.upper, 6),
        center_mm: round(center(noGo.lower, noGo.upper), 6)
      }
    },
    audit: {
      criterion: "ISO1938_1_2015_7_2_7_4_TYPE_A",
      state_for_periodic_calibration: "WEAR_LIMITS_STATE",
      formulas: {
        no_go_upper: "USLw - alpha + H/2",
        no_go_lower: "USLw - alpha - H/2",
        go_new_upper: "LSLw + z + H/2",
        go_new_lower: "LSLw + z - H/2",
        go_wear_upper: "LSLw + z + H/2",
        go_wear_lower: "LSLw + alpha - y"
      }
    }
  };
}
