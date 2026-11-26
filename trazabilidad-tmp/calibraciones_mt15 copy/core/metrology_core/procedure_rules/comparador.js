import { createPoint, rangePoints } from "./shared.js";
import { trimos1288GeneralU } from "../pattern_correction_resolver.js";

export const COMPARADOR_TRIAL_REPETITIONS = 5;

export const COMPARADOR_TRIAL_PROFILES = {
  centesimal: { points: [0.05, 0.1, 1], max: 10, scaleDivisionMm: 0.01 },
  milesimal: { points: [0.005, 0.05, 0.5], max: 10, scaleDivisionMm: 0.001 }
};

export function summarizeComparadorTrial({ nominal, reference, readings, scaleDivisionMm, independentReadings }) {
  if (!Number.isFinite(nominal) || readings.length !== COMPARADOR_TRIAL_REPETITIONS || !readings.every(Number.isFinite)) return null;

  const mean = readings.reduce((sum, reading) => sum + reading, 0) / readings.length;
  const bank = reference === undefined ? trimos1288GeneralU(nominal) : null;
  const displacement = bank ? nominal : reference;
  const budget = bank && independentReadings === true && Number.isFinite(scaleDivisionMm) && scaleDivisionMm > 0
    ? estimatePartialUncertainty(readings, mean, scaleDivisionMm, bank)
    : null;
  return {
    mean,
    nominalDifference: mean - nominal,
    spread: Math.max(...readings) - Math.min(...readings),
    correction: Number.isFinite(displacement) ? displacement - mean : null,
    bankUncertaintyMm: bank?.U_mm ?? null,
    partialBudget: budget
  };
}

// Pilot estimate for the mean of five independent approaches at one point.
// Adapter, alignment, drift, temperature and reversal effects are not modelled here.
function estimatePartialUncertainty(readings, mean, scaleDivisionMm, bank) {
  const n = readings.length;
  const sumSquares = readings.reduce((sum, reading) => sum + (reading - mean) ** 2, 0);
  const standardBankMm = bank.U_mm / bank.k;
  const standardResolutionMm = scaleDivisionMm / Math.sqrt(12);
  const standardRepeatabilityMm = Math.sqrt(sumSquares / (n * (n - 1)));
  const k = 2;
  return {
    standardBankMm,
    standardResolutionMm,
    standardRepeatabilityMm,
    expandedMm: k * Math.hypot(standardBankMm, standardResolutionMm, standardRepeatabilityMm),
    k
  };
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
