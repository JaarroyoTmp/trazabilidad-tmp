/* TMP EXAMPLE - Thread Normative Matrix */

import {
  getThreadStandards,
  listThreadNormativeFamilies
} from "../data/thread_normative_matrix.js";

console.log("Familias normativas:", listThreadNormativeFamilies());
console.log("Metrica interna:", getThreadStandards("METRIC_ISO_INTERNAL"));
console.log("UNC/UNF:", getThreadStandards("UNC_UNF_UNEF_INTERNAL"));
