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
