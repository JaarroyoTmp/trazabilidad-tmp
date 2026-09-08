/* TMP THREAD EXAMPLE - M85x1.5 H6 */

import { resolveThreadTolerance } from "../engines/thread_tolerance_engine.js";

const result = resolveThreadTolerance({
  rango: "M85 x 1.5 H6"
});

console.log("TMP example M85x1.5 H6 =", result);

export default result;
