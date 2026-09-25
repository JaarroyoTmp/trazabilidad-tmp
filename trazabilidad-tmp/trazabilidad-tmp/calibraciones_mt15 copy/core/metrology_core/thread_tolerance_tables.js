/* ============================================================
   TMP METROLOGY CORE - THREAD TOLERANCE TABLES V1
   Tablas iniciales para tampones/anillos roscados.
   Fuente inicial: hoja TMP aportada. Pendiente ampliar por norma.
   Unidades: micrometros donde se indique *_um.
   ============================================================ */

export const THREAD_DIN13_REFERENCE_ROWS = [
  // M, P, DM_N, DM_CTF, E, DM_N_NOGO, DM_CTF_NOGO, E_NOGO
  { M: 3, P: 0.5, go: { dm_n: 2.675, dm_ctf: 2.681, e: 0.006 }, nogo: { dm_n: 2.775, dm_ctf: 2.7795, e: 0.0045 } },
  { M: 16, P: 1, go: { dm_n: 15.350, dm_ctf: 15.362, e: 0.012 }, nogo: { dm_n: 15.510, dm_ctf: 15.517, e: 0.007 } },
  { M: 24, P: 3, go: { dm_n: 22.051, dm_ctf: 22.067, e: 0.016 }, nogo: { dm_n: 22.316, dm_ctf: 22.323, e: 0.007 } },
  { M: 34, P: 1.5, go: { dm_n: 33.025, dm_ctf: 33.038, e: 0.013 }, nogo: { dm_n: null, dm_ctf: 33.2315, e: null } },
  { M: 36, P: 3, go: { dm_n: 34.050, dm_ctf: 34.067, e: 0.017 }, nogo: { dm_n: 34.316, dm_ctf: 34.323, e: 0.007 } },
  { M: 38, P: 1.5, go: { dm_n: 37.025, dm_ctf: 37.038, e: 0.013 }, nogo: { dm_n: null, dm_ctf: 37.2315, e: null } },
  { M: 50, P: 1.5, go: { dm_n: 49.025, dm_ctf: 49.042, e: 0.017 }, nogo: { dm_n: null, dm_ctf: 49.245, e: null } },
  { M: 55, P: 1.5, go: { dm_n: 54.025, dm_ctf: 54.042, e: 0.017 }, nogo: { dm_n: null, dm_ctf: 54.245, e: null } },
  { M: 100, P: 2, go: { dm_n: 98.700, dm_ctf: 98.717, e: 0.017 }, nogo: { dm_n: null, dm_ctf: 98.958, e: null } },
  { M: 127, P: 2, go: { dm_n: 125.700, dm_ctf: 125.717, e: 0.017 }, nogo: { dm_n: null, dm_ctf: 125.958, e: null } },
  { M: 132, P: 2, go: { dm_n: 130.700, dm_ctf: 130.717, e: 0.017 }, nogo: { dm_n: null, dm_ctf: 130.958, e: null } }
];

export const THREAD_TOLERANCE_OFFSET_TABLE = [
  // Td2/T_D2 range in micrometers. TR, TPL, TCP, z_m, ZR, ZPL in micrometers.
  { above: 0, upto: 50, TR: 8, TPL: 6, TCP: 6, z_m: 10, ZR: -4, ZPL: 0 },
  { above: 50, upto: 80, TR: 10, TPL: 7, TCP: 7, z_m: 12, ZR: -2, ZPL: 2 },
  { above: 80, upto: 125, TR: 14, TPL: 9, TCP: 8, z_m: 15, ZR: 2, ZPL: 6 },
  { above: 125, upto: 200, TR: 18, TPL: 11, TCP: 9, z_m: 18, ZR: 8, ZPL: 12 },
  { above: 200, upto: 315, TR: 23, TPL: 14, TCP: 12, z_m: 22, ZR: 12, ZPL: 16 },
  { above: 315, upto: 500, TR: 30, TPL: 18, TCP: 15, z_m: 27, ZR: 20, ZPL: 24 },
  { above: 500, upto: 670, TR: 38, TPL: 22, TCP: 18, z_m: 33, ZR: 28, ZPL: 32 }
];

export const THREAD_WEAR_TABLE = [
  // Td2/T_D2 range in micrometers.
  { above: 0, upto: 50, WGO_RING: 10, WGO_PLUG: 8, WNOGO_RING: 7, WNOGO_PLUG: 6 },
  { above: 50, upto: 80, WGO_RING: 12, WGO_PLUG: 9.5, WNOGO_RING: 9, WNOGO_PLUG: 7.5 },
  { above: 80, upto: 125, WGO_RING: 16, WGO_PLUG: 12.5, WNOGO_RING: 12, WNOGO_PLUG: 9.5 },
  { above: 125, upto: 200, WGO_RING: 21, WGO_PLUG: 17.5, WNOGO_RING: 15, WNOGO_PLUG: 11.5 },
  { above: 200, upto: 315, WGO_RING: 25.5, WGO_PLUG: 21, WNOGO_RING: 19.5, WNOGO_PLUG: 15 },
  { above: 315, upto: 500, WGO_RING: 33, WGO_PLUG: 27, WNOGO_RING: 25, WNOGO_PLUG: 19 },
  { above: 500, upto: 670, WGO_RING: 41, WGO_PLUG: 33, WNOGO_RING: 31, WNOGO_PLUG: 23 }
];

export function parseNum(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (v === null || v === undefined) return 0;
  const n = Number(String(v).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function findDin13Reference({ M, P }) {
  const m = parseNum(M);
  const p = parseNum(P);
  return THREAD_DIN13_REFERENCE_ROWS.find(row => Math.abs(row.M - m) < 0.0001 && Math.abs(row.P - p) < 0.0001) || null;
}

export function findToleranceOffsetByTd2(td2_um) {
  const t = parseNum(td2_um);
  return THREAD_TOLERANCE_OFFSET_TABLE.find(row => t > row.above && t <= row.upto) || null;
}

export function findWearByTd2(td2_um) {
  const t = parseNum(td2_um);
  return THREAD_WEAR_TABLE.find(row => t > row.above && t <= row.upto) || null;
}
