/* ===========================================================
   TMP ISO286 TEST RUNNER V1
   -----------------------------------------------------------
   Herramienta interna de diagnóstico para comprobar el motor
   ISO286 sin necesidad de tener equipos reales dados de alta.

   Ubicación recomendada:
   metrology_core/iso286_test_runner.js

   Uso desde consola/import:
   import { runISO286SelfTest } from "./metrology_core/iso286_test_runner.js";
   console.table(runISO286SelfTest().rows);

   No guarda datos.
   No modifica Supabase.
   No afecta a MT15.
   =========================================================== */

import {
  testPlainLimitDesignation,
  explainPlainLimitResult,
  resolvePlainPlugGoNoGo
} from "./plain_limit_gauge_engine.js";

export const ISO286_TEST_CASES = [
  "Ø8.5 H8",
  "Ø8 h6",
  "Ø8 JS7",
  "Ø8 js7",

  "Ø20 k6",
  "Ø25 m6",
  "Ø30 n6",
  "Ø40 p6",
  "Ø50 r6",
  "Ø60 s6",

  "Ø12 g6",
  "Ø16 f7",
  "Ø25 e8"
];

export function normalizeTestResult(designation, result) {
  const ok = Boolean(result?.ok);

  return {
    designacion: designation,
    ok,

    source:
      result?.limits?.source ||
      result?.limits?.system ||
      result?.source ||
      "-",

    engine_version:
      result?.engine_version ||
      "-",

    nominal:
      result?.parsed?.nominal ??
      null,

    tolerancia:
      result?.parsed?.tolerance ||
      "-",

    tipo:
      result?.parsed?.tipo ||
      "-",

    pasa:
      result?.nominal_pasa ??
      null,

    no_pasa:
      result?.nominal_no_pasa ??
      null,

    li:
      result?.limits?.limits_mm?.lower ??
      null,

    ls:
      result?.limits?.limits_mm?.upper ??
      null,

    desviacion_inf_um:
      result?.limits?.deviations_um?.lower ??
      null,

    desviacion_sup_um:
      result?.limits?.deviations_um?.upper ??
      null,

    formula:
      result?.audit?.formula_desviacion ||
      result?.limits?.audit_formula?.deviation ||
      "-",

    mensaje:
      ok ? "OK" : (result?.message || result?.error || "ERROR")
  };
}

export function runISO286SelfTest(testCases = ISO286_TEST_CASES) {
  const rows = [];

  for (const designation of testCases) {
    const result = resolvePlainPlugGoNoGo({
      designacion: designation
    });

    rows.push(normalizeTestResult(designation, result));
  }

  return {
    ok: true,
    total: rows.length,
    ok_count: rows.filter((r) => r.ok).length,
    error_count: rows.filter((r) => !r.ok).length,
    rows
  };
}

export function runISO286QuickTest(text = "Ø8.5 H8") {
  const result = resolvePlainPlugGoNoGo({
    designacion: text
  });

  return {
    input: text,
    row: normalizeTestResult(text, result),
    raw: result
  };
}

export function explainISO286Test(text = "Ø8.5 H8") {
  return explainPlainLimitResult({
    designacion: text
  });
}

export function printISO286SelfTest(testCases = ISO286_TEST_CASES) {
  const result = runISO286SelfTest(testCases);

  console.table(result.rows);

  return result;
}

export function getISO286TestCases() {
  return [...ISO286_TEST_CASES];
}
