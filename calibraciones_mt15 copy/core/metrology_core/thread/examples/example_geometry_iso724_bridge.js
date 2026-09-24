/* TMP EXAMPLE - Geometry usando ISO724 */

import { calculateThreadGeometry } from "../engines/thread_geometry_engine.js";

const cases = [
  "M14x2-6H",
  "M16x1.5-6H",
  "M33x2 H6",
  "M85x1.5 H6",
  "M144x1.5"
];

for (const rango of cases) {
  console.log(rango, calculateThreadGeometry({ rango }));
}
