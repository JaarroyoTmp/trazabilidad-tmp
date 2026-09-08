/* ============================================================
   TMP METROLOGY CORE - THREAD WIRE SELECTOR V1
   Seleccion de varillas / rodillos para medicion de roscas.
   Base inicial: tabla de taller aportada por TMP.
   ============================================================ */

export const THREAD_WIRE_TABLE = [
  { wire_mm: 0.17, metric_pitch: [0.25, 0.30], whitworth_tpi: [], unified_tpi: [] },
  { wire_mm: 0.22, metric_pitch: [0.35], whitworth_tpi: [], unified_tpi: [72] },
  { wire_mm: 0.25, metric_pitch: [0.40], whitworth_tpi: [60], unified_tpi: [64] },
  { wire_mm: 0.29, metric_pitch: [0.45, 0.50], whitworth_tpi: [], unified_tpi: [56] },
  { wire_mm: 0.335, metric_pitch: [0.60], whitworth_tpi: [48, 40], unified_tpi: [48, 44] },
  { wire_mm: 0.455, metric_pitch: [0.70, 0.80], whitworth_tpi: [], unified_tpi: [32] },
  { wire_mm: 0.53, metric_pitch: [0.90], whitworth_tpi: [32, 28], unified_tpi: [28] },
  { wire_mm: 0.62, metric_pitch: [1.00], whitworth_tpi: [26, 24], unified_tpi: [24] },
  { wire_mm: 0.725, metric_pitch: [1.25], whitworth_tpi: [22, 19], unified_tpi: [20] },
  { wire_mm: 0.895, metric_pitch: [1.50], whitworth_tpi: [18, 16], unified_tpi: [18, 16] },
  { wire_mm: 1.10, metric_pitch: [1.75], whitworth_tpi: [14], unified_tpi: [14, 13] },
  { wire_mm: 1.35, metric_pitch: [2.00], whitworth_tpi: [12, 11], unified_tpi: [12, 11] },
  { wire_mm: 1.65, metric_pitch: [2.50], whitworth_tpi: [10, 9], unified_tpi: [10, 9] },
  { wire_mm: 2.05, metric_pitch: [3.00, 3.50], whitworth_tpi: [8, 7], unified_tpi: [8, 7] },
  { wire_mm: 2.55, metric_pitch: [4.00, 4.50], whitworth_tpi: [6], unified_tpi: [6] },
  { wire_mm: 3.20, metric_pitch: [5.00, 5.50], whitworth_tpi: [5, 4.5], unified_tpi: [5, 4.5] }
];

export function parseNum(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (v === null || v === undefined) return 0;
  const n = Number(String(v).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function closeEnough(a, b, eps = 0.0001) {
  return Math.abs(parseNum(a) - parseNum(b)) <= eps;
}

export function selectThreadWire({ standard = 'METRIC_ISO', pitch = null, tpi = null } = {}) {
  const std = String(standard || '').toUpperCase();
  const p = parseNum(pitch);
  const threadsPerInch = parseNum(tpi);

  if (std.includes('METRIC') || std.includes('ISO') || std === 'M') {
    const exact = THREAD_WIRE_TABLE.find(row => row.metric_pitch.some(x => closeEnough(x, p)));
    if (exact) return { ...exact, match: 'EXACT_METRIC_PITCH', requested_pitch: p };
  }

  if (std.includes('BSW') || std.includes('WHITWORTH') || std.includes('BSP') || std.includes('G')) {
    const exact = THREAD_WIRE_TABLE.find(row => row.whitworth_tpi.some(x => closeEnough(x, threadsPerInch)));
    if (exact) return { ...exact, match: 'EXACT_WHITWORTH_TPI', requested_tpi: threadsPerInch };
  }

  if (std.includes('UN') || std.includes('UNC') || std.includes('UNF')) {
    const exact = THREAD_WIRE_TABLE.find(row => row.unified_tpi.some(x => closeEnough(x, threadsPerInch)));
    if (exact) return { ...exact, match: 'EXACT_UNIFIED_TPI', requested_tpi: threadsPerInch };
  }

  if (p > 0) {
    const theoreticalBestWire = p / (2 * Math.cos(Math.PI / 6));
    const nearest = THREAD_WIRE_TABLE
      .map(row => ({ ...row, delta: Math.abs(row.wire_mm - theoreticalBestWire) }))
      .sort((a, b) => a.delta - b.delta)[0];
    return { ...nearest, match: 'NEAREST_BY_THEORETICAL_METRIC_60', requested_pitch: p, theoretical_best_wire_mm: theoreticalBestWire };
  }

  return null;
}
