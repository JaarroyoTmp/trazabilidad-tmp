/* TMP ISO724 EXAMPLE - Dimensiones básicas */

import { buildMetricBasicDimensions } from "../engines/thread_basic_dimensions_engine.js";

const cases = [
  { nominal_mm: 14, pitch_mm: 2 },
  { nominal_mm: 16, pitch_mm: 1.5 },
  { nominal_mm: 33, pitch_mm: 2 },
  { nominal_mm: 85, pitch_mm: 1.5 },
  { nominal_mm: 144, pitch_mm: 1.5 }
];

for (const c of cases) {
  console.log(`M${c.nominal_mm}x${c.pitch_mm}`, buildMetricBasicDimensions(c));
}
