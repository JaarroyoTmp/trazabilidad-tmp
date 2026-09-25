/* ===========================================================
   TMP THREAD BASIC DIMENSIONS ENGINE V1
   -----------------------------------------------------------
   Motor de dimensiones básicas ISO724 para MT16.

   Este motor calcula D2/D1 por norma, no por históricos.
   =========================================================== */

import { calculateISO724BasicDimensions } from "../data/thread_iso724_database.js";

export const TMP_THREAD_BASIC_DIMENSIONS_ENGINE_VERSION =
  "TMP_THREAD_BASIC_DIMENSIONS_ENGINE_V1";

export function buildMetricBasicDimensions(input = {}) {
  const nominal_mm =
    input.nominal_mm ??
    input.nominal ??
    input.parsed?.nominal_mm ??
    input.parsed?.diameter_mm ??
    null;

  const pitch_mm =
    input.pitch_mm ??
    input.pitch ??
    input.parsed?.pitch_mm ??
    null;

  const result = calculateISO724BasicDimensions({
    nominal_mm,
    pitch_mm
  });

  return {
    ok: result.ok,
    source: "thread_basic_dimensions_engine",
    engine: TMP_THREAD_BASIC_DIMENSIONS_ENGINE_VERSION,
    input,
    result
  };
}
