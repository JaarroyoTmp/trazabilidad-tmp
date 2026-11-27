import { createPoint, rangePoints } from "./shared.js";
import { trimos1288GeneralU } from "../pattern_correction_resolver.js";

// CEM DI-010, §§5.7 and 5.9. The targets span 95% of the instrument range.
export const COMPARADOR_DI010_REPEAT_COUNT = 6;

export function isMechanicalComparatorRecord(equipment) {
  const description = String(equipment?.descripcion ?? "").normalize("NFD").replace(/\p{M}/gu, "");
  return /\breloj\b.*\bcomparador\b/i.test(description) && !/\bdigital\b|\belectronico\b|\bpalanca\b|\binteriores\b|\bpupitast\b/i.test(description);
}

export function comparadorDI010Plan(equipment) {
  if (!isMechanicalComparatorRecord(equipment)) return null;

  const scale = String(equipment.precision ?? "").trim().replace(",", ".").replace(/\s*mm$/i, "");
  const scaleDivisionMm = Number(scale);
  const range = String(equipment.rango ?? "").trim().match(/^0\s*[-–—/÷]\s*(\d+(?:[.,]\d+)?)\s*(?:mm)?$/i);
  const max = Number(range?.[1].replace(",", "."));
  if (![0.001, 0.01].includes(scaleDivisionMm) || !(max > 0 && max <= 300)) return null;

  const points = Array.from({length: 11}, (_, i) => Number((i * max * 0.095).toFixed(6)));
  const toleranceMm = Number((points.at(-1) / (points.length - 1) / 10).toFixed(9));
  return { points, toleranceMm, max, scaleDivisionMm, bankUAtTopMm: trimos1288GeneralU(points.at(-1)).U_mm };
}

export function comparadorDI010Pair({ target, toleranceMm, bank, indicator }) {
  if (!Number.isFinite(indicator) || !Number.isFinite(bank)) return null;
  if (!(Math.abs(bank - target) < toleranceMm - 1e-12)) return null;

  return { deviationMm: indicator - bank, bankExpandedMm: trimos1288GeneralU(Math.abs(bank))?.U_mm ?? null };
}

export function comparadorDI010Repeatability(low, high) {
  if (![low, high].every(series =>
    series.length === COMPARADOR_DI010_REPEAT_COUNT && series.every(Number.isFinite)
  )) return null;

  const variances = [low, high].map(series => {
    const mean = series.reduce((sum, value) => sum + value, 0) / series.length;
    return series.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (series.length - 1);
  });
  return Math.sqrt((variances[0] + variances[1]) / 2);
}

// One-time technical configuration by certificate and instrument code, reviewed in Git.
const APPROVED_MT17 = { equipos: {}, presupuesto: null };

const CALIBRATOR_LIMITS = {
  '1A8881': { divisionMm: 0.01, limitMm: 0.020, maxExpandedMm: 0.020, document: 'Calibrator 2026/00153 · equipo 1A8881' },
  JZF962: { divisionMm: 0.001, limitMm: 0.002, maxExpandedMm: 0.003, document: 'Calibrator 2009/00193 · equipo JZF962' }
};

export function resolveComparadorCriterion(equipment, plan, approved = APPROVED_MT17) {
  const code = String(equipment.codigo).trim().toUpperCase();
  const registered = approved?.equipos?.[code];
  if (registered?.divisionMm === plan.scaleDivisionMm && registered.document?.trim() &&
      Number.isFinite(registered.limitMm) && registered.limitMm > 0 &&
      (registered.maxExpandedMm === null || (Number.isFinite(registered.maxExpandedMm) && registered.maxExpandedMm > 0))) {
    return { limitMm: registered.limitMm, maxExpandedMm: registered.maxExpandedMm, document: registered.document };
  }
  const legacy = Object.hasOwn(CALIBRATOR_LIMITS, code) ? CALIBRATOR_LIMITS[code] : null;
  return legacy?.divisionMm === plan.scaleDivisionMm ? legacy : null;
}

export function resolveComparadorBudget(certificate, approved = APPROVED_MT17) {
  const budget = approved?.presupuesto;
  if (budget?.certificado !== certificate || !budget?.document?.trim() ||
      !Number.isFinite(budget.driftMaxMm) || budget.driftMaxMm < 0 ||
      !Number.isFinite(budget.alignmentMaxDegrees) || budget.alignmentMaxDegrees < 0 ||
      budget.alignmentMaxDegrees > 90) return null;
  return budget;
}

// Rounded-up 97.5th percentile of Student t at the lower tabulated degree of freedom.
function coverageFactor(degrees) {
  if (degrees >= 120) return 2;
  if (degrees >= 60) return 2.01;
  if (degrees >= 30) return 2.05;
  if (degrees >= 20) return 2.09;
  if (degrees >= 14) return 2.15;
  return 2.23;
}

export function evaluateComparadorDI010({ plan, sweeps, repeatability, criterion, budget }) {
  if (!Number.isFinite(repeatability) || repeatability < 0 || sweeps.length !== 2 ||
      !sweeps.every(sweep => sweep.length === plan.points.length && sweep.every(pair =>
        Number.isFinite(pair?.deviationMm) && Number.isFinite(pair?.bankExpandedMm) && pair.bankExpandedMm > 0 &&
        Number.isFinite(pair?.bank)))) return null;

  const zero = sweeps[0][0];
  const resolution = plan.scaleDivisionMm / Math.sqrt(12);
  const repeatContribution = Math.SQRT2 * repeatability;
  const repeatDegrees = 2 * (COMPARADOR_DI010_REPEAT_COUNT - 1);
  const driftStandardMm = budget ? budget.driftMaxMm / Math.sqrt(3) : 0;
  const alignmentPerMm = budget ? 2 * Math.sin(budget.alignmentMaxDegrees * Math.PI / 360) ** 2 / Math.sqrt(3) : 0;

  const points = sweeps.map(sweep => sweep.map(pair => {
    const correctionMm = zero.deviationMm - pair.deviationMm;
    const displacement = Math.abs(pair.bank - zero.bank);
    const bankStandardMm = pair.bankExpandedMm / 2;
    const thermalStandardMm = 2.8e-5 * displacement; // CEM DI-010, tabla 12, E ≥ 0,001 mm.
    const alignmentStandardMm = alignmentPerMm * displacement;
    const combined = Math.hypot(bankStandardMm, resolution, repeatContribution, thermalStandardMm,
      alignmentStandardMm, driftStandardMm);
    const degrees = repeatContribution ? repeatDegrees * (combined / repeatContribution) ** 4 : Infinity;
    const k = coverageFactor(degrees);
    const calculatedExpandedMm = k * combined;
    // CEM DI-010 §6.1.6, round the reported U up to the instrument division.
    const expandedMm = Math.ceil(calculatedExpandedMm / plan.scaleDivisionMm - 1e-12) * plan.scaleDivisionMm;
    const guardedErrorMm = Math.abs(correctionMm) + expandedMm;
    const failures = criterion && budget ? [
      ...(guardedErrorMm > criterion.limitMm + 1e-12 ? ['Límite de corrección con banda de guarda'] : []),
      ...(criterion.maxExpandedMm !== null && expandedMm > criterion.maxExpandedMm + 1e-12
        ? ['Incertidumbre máxima admitida'] : [])
    ] : null;
    const accepted = failures ? failures.length === 0 : null;
    return { correctionMm, expandedMm, calculatedExpandedMm, guardedErrorMm, accepted, failures, k,
      bankStandardMm, thermalStandardMm, alignmentStandardMm: budget ? alignmentStandardMm : null,
      combinedStandardMm: combined, effectiveDegrees: Number.isFinite(degrees) ? degrees : null };
  }));
  const all = points.flat();
  if (all.some(p => !Number.isFinite(p.guardedErrorMm))) return null;
  // Compare the two directions only when the reference position is the same.
  const descending = [...sweeps[1]].reverse();
  const differences = sweeps[0].flatMap((ascending, i) => Math.abs(ascending.bank - descending[i].bank) <= 1e-12
    ? [Math.abs(ascending.deviationMm - descending[i].deviationMm)] : []);
  return {
    comparablePoints: differences.length,
    maxHysteresisMm: differences.length ? Math.max(...differences) : null,
    resultado: criterion && budget ? (all.every(p => p.accepted) ? 'APTO' : 'NO APTO') : null,
    points, maxCorrectionMm: Math.max(...all.map(p => Math.abs(p.correctionMm))),
    maxGuardedMm: Math.max(...all.map(p => p.guardedErrorMm)),
    maxExpandedMm: Math.max(...all.map(p => p.expandedMm)),
    maxCalculatedExpandedMm: Math.max(...all.map(p => p.calculatedExpandedMm)),
    repeatabilityMm: repeatability, scaleStandardMm: resolution, repeatStandardMm: repeatContribution, driftStandardMm: budget ? driftStandardMm : null
  };
}

const CALIBRATOR_CENTESIMAL = {
  points: [0.05, 0.1, 1], divisionMm: 0.01, limitMm: 0.020, maxExpandedMm: 0.020,
  document: 'MT-15 caps. 1 y 5 rev. 04 · pauta centesimal Calibrator 2026/00153'
};
const CALIBRATOR_PROFILES = new Map([
  ['1A8881', CALIBRATOR_CENTESIMAL],
  ['RC005', {...CALIBRATOR_CENTESIMAL, document: CALIBRATOR_CENTESIMAL.document + ' · aplicada a RC005 por indicación de TMP'}],
  ['JZF962', {points:[0.005,0.05,0.5], divisionMm:0.001, limitMm:0.002, maxExpandedMm:0.003,
    document:'MT-15 caps. 1 y 5 rev. 04 · pauta Calibrator 2009/00193 · equipo JZF962'}]
]);

export const CALIBRATOR_COUNT = 5;

export function comparadorCalibratorProfile(equipment, plan) {
  const profile = CALIBRATOR_PROFILES.get(String(equipment.codigo).trim().toUpperCase());
  return profile?.divisionMm === plan.scaleDivisionMm && profile.points.at(-1) <= plan.max ? profile : null;
}

export function evaluateComparadorCalibrator({profile, readings, certificate = trimos1288GeneralU}) {
  if (!profile || profile.points.length !== readings.length ||
      readings.some(series => series.length !== CALIBRATOR_COUNT || series.some(value => !Number.isFinite(value)))) return null;
  // MT-15 cap. 1, rev. 04, table for νef = n − 1 = 4.
  const k = 2.87;
  const points = readings.map((series, i) => {
    const nominalMm = profile.points[i];
    const reference = certificate(nominalMm);
    if (!Number.isFinite(reference?.U_mm) || reference.U_mm <= 0 ||
        !Number.isFinite(reference.k) || reference.k <= 0) return null;
    const meanMm = series.reduce((sum, value) => sum + value, 0) / series.length;
    const deviationMm = Math.sqrt(series.reduce((sum, value) => sum + (value - meanMm) ** 2, 0) / (series.length - 1));
    // C-11377.00002 declares the Us envelope for a global correction of zero.
    const referenceCorrectionMm = reference.correctionMm ?? 0;
    const correctionMm = meanMm - (nominalMm + referenceCorrectionMm);
    const bankStandardMm = reference.U_mm / reference.k;
    const resolutionStandardMm = profile.divisionMm / Math.sqrt(3);
    const repeatStandardMm = deviationMm / Math.sqrt(series.length);
    const expandedMm = k * Math.hypot(bankStandardMm, resolutionStandardMm, repeatStandardMm);
    return {nominalMm, meanMm, deviationMm, correctionMm, expandedMm, bankStandardMm, resolutionStandardMm, repeatStandardMm,
      referenceCorrectionMm, bankExpandedMm:reference.U_mm, bankK:reference.k,
      correctionAccepted:Math.abs(correctionMm) <= profile.limitMm + 1e-12,
      uncertaintyAccepted:expandedMm <= profile.maxExpandedMm + 1e-12};
  });
  if (points.some(point => !point || !Number.isFinite(point.correctionMm) || !Number.isFinite(point.expandedMm))) return null;
  return {k, points, resultado:points.every(p => p.correctionAccepted && p.uncertaintyAccepted) ? 'APTO' : 'NO APTO',
    maxCorrectionMm:Math.max(...points.map(p => Math.abs(p.correctionMm))),
    maxExpandedMm:Math.max(...points.map(p => p.expandedMm))};
}

export function buildComparadorProcedure(ctx = {}) {
  const max = ctx.rango_max || 10;
  const rep = ctx.repeticiones || 5;
  const puntos = rangePoints(max, [0.1, 0.25, 0.5, 0.75, 1.0]);

  return {
    procedimiento: "MT15-CAP-05",
    norma: ["MT-15 Cap.5", "ILAC-G8", "ISO 14253"],
    descripcion: "Pauta automatica reloj comparador",
    funciones: [
      {
        id: "SUBIDA",
        nombre: "Carrera ascendente",
        patron_tipo: "BANCO_HORIZONTAL",
        puntos: puntos.map((p, i) => createPoint({
          id: `SUBIDA_${i + 1}`,
          etiqueta: `Subida ${p} mm`,
          funcion: "SUBIDA",
          nominal: p,
          patron_tipo: "BANCO_HORIZONTAL",
          repeticiones: rep
        }))
      },
      {
        id: "BAJADA",
        nombre: "Carrera descendente",
        patron_tipo: "BANCO_HORIZONTAL",
        puntos: [...puntos].reverse().map((p, i) => createPoint({
          id: `BAJADA_${i + 1}`,
          etiqueta: `Bajada ${p} mm`,
          funcion: "BAJADA",
          nominal: p,
          patron_tipo: "BANCO_HORIZONTAL",
          repeticiones: rep
        }))
      }
    ],
    regla_global: "PEOR_PUNTO"
  };
}
