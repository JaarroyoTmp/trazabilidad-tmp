/* TMP THREAD EXAMPLE - M33x2 H6 */

import { resolveThreadTolerance } from "../engines/thread_tolerance_engine.js";

const result = resolveThreadTolerance({
  rango: "M33 x 2 H6"
});

console.log("TMP example M33x2 H6 =", result);

export default result;
