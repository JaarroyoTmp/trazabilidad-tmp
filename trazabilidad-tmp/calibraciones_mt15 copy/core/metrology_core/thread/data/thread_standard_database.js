/* ===========================================================
   TMP THREAD STANDARD DATABASE V1
   Base inicial de roscas normalizadas para MT16.
   Fuente inicial: tabla de roscas normalizadas + inventario real TMP.
   =========================================================== */

export const THREAD_STANDARD_DATABASE = {
  meta: {
    version: "TMP_THREAD_STANDARD_DATABASE_V1",
    units: "mm",
    status: "BASE_INICIAL_MT16"
  },

  families: {
    M: { angle_deg: 60, standard: "DIN 13 / ISO metric thread", type: "METRIC" },
    MF: { angle_deg: 60, standard: "DIN 13 / ISO metric fine thread", type: "METRIC_FINE" },
    UNC: { angle_deg: 60, standard: "ANSI B1.1", type: "UNIFIED_COARSE" },
    UNF: { angle_deg: 60, standard: "ANSI B1.1", type: "UNIFIED_FINE" },
    UNEF: { angle_deg: 60, standard: "ANSI B1.1", type: "UNIFIED_EXTRA_FINE" },
    BSW: { angle_deg: 55, standard: "BS84", type: "WHITWORTH" },
    BSF: { angle_deg: 55, standard: "BS84", type: "WHITWORTH_FINE" },
    G: { angle_deg: 55, standard: "ISO 228 / BSP", type: "BSP_PARALLEL" },
    R: { angle_deg: 55, standard: "ISO 7 / BSPT", type: "BSP_TAPER" },
    NPT: { angle_deg: 60, standard: "ANSI/ASME B1.20.1", type: "NPT" },
    NPTF: { angle_deg: 60, standard: "ANSI B1.20.3", type: "NPTF" }
  },

  metric_coarse: {
    3:[0.5,2.5],4:[0.7,3.3],5:[0.8,4.2],6:[1,5],7:[1,6],8:[1.25,6.8],
    9:[1.25,7.8],10:[1.5,8.5],11:[1.5,9.5],12:[1.75,10.2],14:[2,12],
    16:[2,14],18:[2.5,15.5],20:[2.5,17.5],22:[2.5,19.5],24:[3,21],
    27:[3,24],30:[3.5,26.5],33:[3.5,29.5],36:[4,32],39:[4,35],
    42:[4.5,37.5],45:[4.5,40.5],48:[5,43],52:[5,47],56:[5.5,50.5],
    60:[5.5,54.5],64:[6,58],68:[6,62],70:[6,64],72:[6,66],75:[6,69],
    76:[6,70],80:[6,74],85:[6,79],90:[6,84],95:[6,89],100:[6,94]
  },

  metric_fine: {
    "4x0.5":[3.5],"6x0.75":[5.25],"8x1":[7],"10x1":[9],"10x1.25":[8.75],
    "12x1":[11],"12x1.25":[10.75],"12x1.5":[10.5],
    "14x1":[13],"14x1.5":[12.5],"16x1":[15],"16x1.5":[14.5],
    "18x1":[17],"18x1.5":[16.5],"18x2":[16],
    "20x1":[19],"20x1.5":[18.5],"20x2":[18],
    "22x1":[21],"22x1.5":[20.5],"22x2":[20],
    "24x1.5":[22.5],"24x2":[22],"25x1.5":[23.5],"26x1.5":[24.5],
    "27x1.5":[25.5],"28x1.5":[26.5],"30x1.5":[28.5],"30x2":[28],
    "32x1.5":[30.5],"33x1.5":[30.5],"35x1.5":[33.5],"36x1.5":[34.5],
    "40x1.5":[38.5],"48x1.5":[46.5],"50x1.5":[48.5],"52x1.5":[50.5],
    "55x2":[53],"60x1.5":[58.5],"82x2":[null],"97x2":[null],
    "100x2":[98],"105x1.5":[null],"105x2":[null],"115x1.5":[null],"144x1.5":[null]
  },

  unified: {
    "1/4-20-UNC": [6.35,20,5.1], "5/16-18-UNC": [7.938,18,6.6],
    "3/8-16-UNC": [9.525,16,8], "1/2-13-UNC": [12.7,13,10.75],
    "5/8-11-UNC": [15.875,11,13.5], "3/4-10-UNC": [19.05,10,16.5],
    "1/4-28-UNF": [6.35,28,5.5], "3/8-24-UNF": [9.525,24,8.5],
    "1/2-20-UNF": [12.7,20,11.5], "5/8-18-UNF": [15.875,18,14.5],
    "3/4-16-UNF": [19.05,16,17.5],
    "1/4-20-BSW": [6.35,20,5.1], "3/8-16-BSW": [9.525,16,7.9],
    "1/2-12-BSW": [12.7,12,10.5], "5/8-11-BSW": [15.876,11,13.5]
  },

  pipe: {
    "G1/8-28":[9.728,28,8.8], "G1/4-19":[13.157,19,11.8],
    "G3/8-19":[16.662,19,15.3], "G1/2-14":[20.995,14,19.1],
    "G3/4-14":[26.441,14,24.6], "G7/8-14":[30.201,14,28.4],
    "G1-11":[33.249,11,30.9], "R3/4-14":[26.441,14,24.6],
    "R1-11":[33.249,11,30.9], "R1 1/2-11":[47.803,11,45.5]
  },

  npt: {
    "1/8-27-NPTF":[10.287,27], "1/4-18-NPTF":[13.716,18],
    "3/8-18-NPTF":[17.145,18], "1/2-14-NPTF":[21.336,14],
    "3/4-14-NPTF":[26.67,14], "1-11.5-NPTF":[33.401,11.5]
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

export function tpiToPitchMm(tpi) {
  const n = parseNum(tpi);
  return n ? round(25.4 / n, 6) : null;
}

export function fractionToDecimal(frac = "") {
  const parts = String(frac).replace(/"/g, "").trim().split(/\s+/);
  let total = 0;
  for (const p of parts) {
    if (p.includes("/")) {
      const [a,b] = p.split("/").map(Number);
      if (b) total += a / b;
    } else {
      const n = Number(p);
      if (Number.isFinite(n)) total += n;
    }
  }
  return total;
}

export function fractionToMm(frac = "") {
  return round(fractionToDecimal(frac) * 25.4, 6);
}

export function resolveMetric(nominal, pitch = null) {
  const n = parseNum(nominal);
  const p = pitch === null || pitch === undefined ? null : parseNum(pitch);

  if (p) {
    const key = `${n}x${p}`;
    const fine = THREAD_STANDARD_DATABASE.metric_fine[key];
    if (fine) return { ok:true, source:"metric_fine", family:"MF", nominal_mm:n, pitch_mm:p, drill_mm:fine[0], key };
    return { ok:true, source:"metric_fallback", family:"MF", nominal_mm:n, pitch_mm:p, drill_mm:null, key, warning:"Pendiente validar en tabla." };
  }

  const coarse = THREAD_STANDARD_DATABASE.metric_coarse[n];
  if (coarse) return { ok:true, source:"metric_coarse", family:"M", nominal_mm:n, pitch_mm:coarse[0], drill_mm:coarse[1], key:`M${n}` };

  return { ok:false, error:"METRIC_NOT_FOUND" };
}
