/* ============================================================
   TMP METROLOGY CORE - THREAD GAUGE ENGINE V1
   Motor inicial para tampones roscados PASA / NO PASA.
   No toca interfaz. Devuelve pauta, rodillos, referencias y decision.
   ============================================================ */

import { selectThreadWire } from './thread_wire_selector.js';
import {
  mean,
  sampleStd,
  pitchDiameterFromMeasurementOverWiresMetric60,
  evaluateLimit,
  parseNum
} from './thread_reference_calculator.js';
import {
  findDin13Reference,
  findToleranceOffsetByTd2,
  findWearByTd2
} from './thread_tolerance_tables.js';

export function parseMetricThreadDesignation(text = '') {
  const raw = String(text || '').toUpperCase().replace(',', '.').replace(/\s+/g, '');
  const re = /M\s*(\d+(?:\.\d+)?)\s*[Xx×]\s*(\d+(?:\.\d+)?)(?:.*?(\d+H|\d+G|\d+E|\d+D|\d+C|\d+B|\d+A|H\d|G\d))?/i;
  const m = raw.match(re);
  if (!m) return null;
  return {
    standard: 'METRIC_ISO_DIN13',
    nominal_mm: parseNum(m[1]),
    pitch_mm: parseNum(m[2]),
    tolerance_class: m[3] || null,
    raw
  };
}

function buildLimitsFromReference({ referenceRow, gaugeKind = 'PLUG', td2_um = null }) {
  const td2 = td2_um ?? null;
  const offset = td2 ? findToleranceOffsetByTd2(td2) : null;
  const wear = td2 ? findWearByTd2(td2) : null;

  const result = {
    source: referenceRow ? 'DIN13_REFERENCE_ROW_TMP' : 'MANUAL_OR_PENDING_TABLE',
    offset,
    wear,
    go: null,
    nogo: null
  };

  if (referenceRow) {
    result.go = {
      min: referenceRow.go.dm_n,
      max: referenceRow.go.dm_ctf,
      e: referenceRow.go.e
    };
    result.nogo = {
      min: referenceRow.nogo.dm_n,
      max: referenceRow.nogo.dm_ctf,
      e: referenceRow.nogo.e
    };
  }

  if (wear) {
    result.wear_um = {
      go: gaugeKind === 'RING' ? wear.WGO_RING : wear.WGO_PLUG,
      nogo: gaugeKind === 'RING' ? wear.WNOGO_RING : wear.WNOGO_PLUG
    };
  }

  return result;
}

function calculateSide({ side, readings = [], wireDiameter, pitch, correction = 0, limits = null }) {
  const clean = readings.map(parseNum).filter(Number.isFinite);
  const mOverWires = mean(clean);
  const sOverWires = sampleStd(clean);
  const pitchDiameter = pitchDiameterFromMeasurementOverWiresMetric60({
    measurementOverWires: mOverWires,
    wireDiameter,
    pitch,
    correction
  });

  let decision = 'SIN_LIMITES';
  if (limits && limits.min !== null && limits.max !== null) {
    decision = evaluateLimit(pitchDiameter, limits.min, limits.max);
  }

  return {
    side,
    readings: clean,
    n: clean.length,
    mean_measurement_over_wires_mm: mOverWires,
    sample_std_mm: sOverWires,
    wire_diameter_mm: parseNum(wireDiameter),
    pitch_mm: parseNum(pitch),
    correction_mm: parseNum(correction),
    pitch_diameter_mm: pitchDiameter,
    limits,
    decision
  };
}

export function buildThreadGaugePlan({ designation, gaugeKind = 'PLUG', td2_um = null, standard = 'METRIC_ISO' } = {}) {
  const parsed = typeof designation === 'string' ? parseMetricThreadDesignation(designation) : designation;
  if (!parsed) {
    return {
      ok: false,
      error: 'NO_SE_PUDO_INTERPRETAR_DESIGNACION_ROSCA',
      designation
    };
  }

  const wire = selectThreadWire({ standard, pitch: parsed.pitch_mm });
  const referenceRow = findDin13Reference({ M: parsed.nominal_mm, P: parsed.pitch_mm });
  const limits = buildLimitsFromReference({ referenceRow, gaugeKind, td2_um });

  return {
    ok: true,
    procedure: 'PT-ROSCA-001',
    title: 'Calibracion de tampones roscados PASA / NO PASA',
    standard: parsed.standard,
    norm_reference: ['DIN 13', 'ISO metric thread', 'ISO 1502 pendiente de completar'],
    gauge_kind: gaugeKind,
    parsed_thread: parsed,
    wire,
    required_pattern_types: ['BANCO_HORIZONTAL', 'VARILLAS_RODILLOS_ROSCA'],
    repetitions_per_side: 5,
    sides: ['PASA', 'NO_PASA'],
    magnitude: 'Diametro medio / diametro entre flancos',
    method: 'Medicion sobre varillas en banco horizontal',
    limits,
    warnings: [
      !referenceRow ? 'No existe fila DIN13 cargada para esta combinacion M/P. Se requiere tabla completa o entrada manual.' : null,
      !wire ? 'No se pudo seleccionar varilla automaticamente.' : null,
      !td2_um ? 'No se ha informado Td2/T_D2; no se pueden calcular ZPL/TPL/desgaste por tabla.' : null
    ].filter(Boolean)
  };
}

export function calculateThreadGaugeCalibration({
  designation,
  gaugeKind = 'PLUG',
  td2_um = null,
  wireDiameter = null,
  correction = 0,
  readingsGo = [],
  readingsNoGo = []
} = {}) {
  const plan = buildThreadGaugePlan({ designation, gaugeKind, td2_um });
  if (!plan.ok) return plan;

  const selectedWire = wireDiameter ? { wire_mm: parseNum(wireDiameter), match: 'MANUAL' } : plan.wire;
  if (!selectedWire) {
    return { ok: false, error: 'SIN_VARILLA_RODILLO', plan };
  }

  const go = calculateSide({
    side: 'PASA',
    readings: readingsGo,
    wireDiameter: selectedWire.wire_mm,
    pitch: plan.parsed_thread.pitch_mm,
    correction,
    limits: plan.limits.go
  });

  const nogo = calculateSide({
    side: 'NO_PASA',
    readings: readingsNoGo,
    wireDiameter: selectedWire.wire_mm,
    pitch: plan.parsed_thread.pitch_mm,
    correction,
    limits: plan.limits.nogo
  });

  const decisions = [go.decision, nogo.decision];
  const globalDecision = decisions.every(d => d === 'APTO') ? 'APTO' : 'NO_APTO';

  return {
    ok: true,
    plan: { ...plan, wire: selectedWire },
    results: { go, nogo },
    decision_global: globalDecision,
    decision_rule: 'PASA_Y_NO_PASA_DEBEN_SER_APTOS'
  };
}
