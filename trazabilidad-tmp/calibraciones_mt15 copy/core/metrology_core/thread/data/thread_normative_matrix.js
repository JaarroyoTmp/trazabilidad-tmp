/* ===========================================================
   TMP THREAD NORMATIVE MATRIX V1
   -----------------------------------------------------------
   Mapa maestro de normas para roscas.
   =========================================================== */

import normativeMatrix from "./thread_normative_matrix.json" assert { type: "json" };

export const TMP_THREAD_NORMATIVE_MATRIX_VERSION =
  "TMP_THREAD_NORMATIVE_MATRIX_V1";

export function getThreadNormativeFamily(family) {
  if (!family) return null;
  return normativeMatrix.families[String(family).trim()] || null;
}

export function getThreadStandards(family) {
  const f = getThreadNormativeFamily(family);

  if (!f) {
    return {
      ok: false,
      error: "FAMILIA_NORMATIVA_NO_ENCONTRADA",
      family
    };
  }

  return {
    ok: true,
    family,
    description_es: f.description_es,
    profile_standard: f.profile_standard,
    geometry_standard: f.geometry_standard,
    tolerance_standard: f.tolerance_standard,
    gauge_standard: f.gauge_standard,
    decision_standard: f.decision_standard,
    status: f.status,
    examples: f.examples || []
  };
}

export function isThreadFamilyNormativelyActive(family) {
  const s = getThreadStandards(family);
  return Boolean(s.ok && s.status === "ACTIVE");
}

export function listThreadNormativeFamilies() {
  return Object.entries(normativeMatrix.families).map(([key, value]) => ({
    key,
    description_es: value.description_es,
    status: value.status,
    profile_standard: value.profile_standard,
    geometry_standard: value.geometry_standard,
    tolerance_standard: value.tolerance_standard,
    gauge_standard: value.gauge_standard
  }));
}

export default normativeMatrix;
