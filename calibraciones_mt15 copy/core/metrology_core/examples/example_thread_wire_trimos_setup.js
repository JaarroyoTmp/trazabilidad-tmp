/* TMP THREAD EXAMPLE - Wire + Trimos setup */

import { buildThreadTrimosSetup } from "../engines/thread_trimos_engine.js";

const cases = [
  "M33 x 2 H6",
  "M85 x 1.5 H6",
  "M18 x 1.5 - 6H",
  "M14 x 1.5 - 6H"
];

for (const rango of cases) {
  console.log(rango, buildThreadTrimosSetup({ rango }));
}
