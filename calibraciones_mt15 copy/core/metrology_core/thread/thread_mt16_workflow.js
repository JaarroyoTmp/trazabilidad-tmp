/* ===========================================================
   TMP THREAD MT16 WORKFLOW V3
   -----------------------------------------------------------
   Flujo técnico MT16 - Tampón roscado P/NP.

   V3:
   - Parser rosca.
   - Geometría ISO724.
   - Límites ISO965.
   - Plan Trimos.
   - ISO1502 beta.
   - Inyecta límites PASA / NO PASA en el plan Trimos.
   - Sigue bloqueando certificado final hasta validación ISO1502
     completa + incertidumbre.

   ISO1502:
   - Para roscas interiores se usan GO / NOT GO screw plug gauges.
   - El GO controla el límite mínimo del diámetro medio virtual.
   - El NOT GO controla si el diámetro medio real supera el máximo.
   =========================================================== */

import { parseThreadGaugeDesignation } from "./engines/thread_parser_engine.js";
import { calculateThreadGeometry } from "./engines/thread_geometry_engine.js";
import { getISO965Data } from "./data/thread_iso965_database.js";

import {
  buildTrimosPlanForMetricThread
} from "./engines/thread_trimos_engine.js";

import {
  calculateISO1502InternalPlugGaugeLimits,
  canISO1502EmitFinalDecision
} from "./engines/thread_iso1502_engine.js";

export const TMP_MT16_WORKFLOW_VERSION = "TMP_THREAD_MT16_WORKFLOW_V3";

export function normalizeText(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export function normalizeThreadDesignationForISO965(value = "") {
  return String(value || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/,/g, ".")
    .replace("X", "x")
    .replace("-H6", "-6H")
    .replace("H6", "6H")
    .replace(/--+/g, "-")
    .trim();
}

export function buildThreadInputFromEquipment(equipo = {}) {
  const designation =
    equipo.rango ||
    equipo.descripcion ||
    equipo.observaciones ||
    "";

  return {
    codigo: equipo.codigo || null,
    descripcion: equipo.descripcion || null,
    rango: equipo.rango || null,
    designation: normalizeText(designation),
    raw_equipment: equipo
  };
}

export function safeCall(fn, fallback) {
  try {
    return fn();
  } catch (err) {
    return {
      ok: false,
      error: err?.message || String(err),
      exception: true,
      fallback
    };
  }
}

export function resolveISO965LimitsFromParsed(parsed = {}) {
  const nominal = parsed.nominal_mm || parsed.diameter_mm || null;
  const pitch = parsed.pitch_mm || parsed.pitch || null;
  const cls = parsed.tolerance_class || parsed.class || "6H";

  if (!nominal || !pitch) {
    return {
      ok: false,
      error: "DATOS_INSUFICIENTES_ISO965",
      message: "Faltan nominal o paso para buscar límites ISO965."
    };
  }

  const key = normalizeThreadDesignationForISO965(`M${nominal}x${pitch}-${cls}`);
  const data = getISO965Data(key);

  if (!data) {
    return {
      ok: false,
      error: "ISO965_NO_CARGADO_PARA_DESIGNACION",
      designation: key,
      message:
        "La rosca se reconoce, pero aún no existe esta designación en thread_iso965_database.js."
    };
  }

  const hasNull =
    data.pitch_diameter_max === null ||
    data.pitch_diameter_min === null ||
    data.minor_diameter_max === null ||
    data.minor_diameter_min === null;

  return {
    ok: !hasNull,
    warning: hasNull ? "ISO965_DESIGNACION_PARCIAL" : null,
    designation: key,
    data,
    message: hasNull
      ? "La designación existe, pero aún tiene límites nulos pendientes de cargar."
      : "Límites ISO965 encontrados."
  };
}

export function applyISO1502LimitsToTrimosPlan(trimosPlan, iso1502) {
  if (!trimosPlan?.ok || !iso1502?.ok) return trimosPlan;

  const cloned = structuredClone(trimosPlan);

  cloned.limits_loaded = true;
  cloned.iso1502_loaded = true;
  cloned.iso1502_status = iso1502.status;
  cloned.iso1502_warning = iso1502.warning;
  cloned.limits = {
    source: iso1502.source,
    pass: iso1502.pass,
    no_pass: iso1502.no_pass
  };

  cloned.points = [
    {
      id: "PASA",
      lado: "PASA",
      etiqueta: `Lado PASA D2 ${iso1502.pass.d2_nominal} mm`,
      d2_nominal_mm: iso1502.pass.d2_nominal,
      target_trimos_mm: round(
        iso1502.pass.d2_nominal + cloned.setup.correction_mm,
        6
      ),
      limits_d2_mm: {
        min: iso1502.pass.min,
        max: iso1502.pass.max,
        wear_max: iso1502.pass.wear_max
      },
      repetitions: 5
    },
    {
      id: "NO_PASA",
      lado: "NO_PASA",
      etiqueta: `Lado NO PASA D2 ${iso1502.no_pass.d2_nominal} mm`,
      d2_nominal_mm: iso1502.no_pass.d2_nominal,
      target_trimos_mm: round(
        iso1502.no_pass.d2_nominal + cloned.setup.correction_mm,
        6
      ),
      limits_d2_mm: {
        min: iso1502.no_pass.min,
        max: iso1502.no_pass.max,
        wear_max: iso1502.no_pass.wear_max
      },
      repetitions: 5
    }
  ];

  cloned.warnings = [
    ...(cloned.warnings || []),
    iso1502.warning
  ].filter(Boolean);

  return cloned;
}

export function parseNum(value, fallback = null) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function round(value, decimals = 6) {
  const n = parseNum(value, NaN);
  if (!Number.isFinite(n)) return null;
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

export function buildMT16OperatorInstructions({
  parsed,
  geometry,
  iso965,
  iso1502,
  trimos
}) {
  const lines = [];

  lines.push("MT16 - Tampón roscado P/NP");
  lines.push("");

  if (parsed?.ok) {
    lines.push(`Rosca detectada: ${parsed.designation || parsed.normalized || "-"}`);
    lines.push(`Nominal: ${parsed.nominal_mm || parsed.diameter_mm || "-"} mm`);
    lines.push(`Paso: ${parsed.pitch_mm || "-"} mm`);
    lines.push(`Clase: ${parsed.tolerance_class || "-"}`);
  } else {
    lines.push("Rosca no detectada correctamente.");
  }

  lines.push("");

  if (geometry?.ok && geometry.geometry?.ok) {
    const g = geometry.geometry;
    lines.push("Geometría ISO724:");
    lines.push(`- Diámetro mayor básico: ${g.basic_mm?.major_diameter ?? "-"} mm`);
    lines.push(`- Diámetro medio básico: ${g.basic_mm?.pitch_diameter ?? "-"} mm`);
    lines.push(`- Diámetro menor básico: ${g.basic_mm?.minor_diameter ?? "-"} mm`);
  } else {
    lines.push("Geometría ISO724 no calculada.");
  }

  lines.push("");

  if (iso965?.ok) {
    lines.push("Límites ISO965:");
    lines.push(`- D2 máx: ${iso965.data.pitch_diameter_max} mm`);
    lines.push(`- D2 mín: ${iso965.data.pitch_diameter_min} mm`);
    lines.push(`- D1 máx: ${iso965.data.minor_diameter_max} mm`);
    lines.push(`- D1 mín: ${iso965.data.minor_diameter_min} mm`);
  } else {
    lines.push("Límites ISO965:");
    lines.push(`- ${iso965?.message || "No disponibles todavía."}`);
  }

  lines.push("");

  if (iso1502?.ok) {
    lines.push("Límites ISO1502 beta:");
    lines.push(`- PASA nominal D2: ${iso1502.pass.d2_nominal} mm`);
    lines.push(`- PASA mín/máx: ${iso1502.pass.min} / ${iso1502.pass.max} mm`);
    lines.push(`- NO PASA nominal D2: ${iso1502.no_pass.d2_nominal} mm`);
    lines.push(`- NO PASA mín/máx: ${iso1502.no_pass.min} / ${iso1502.no_pass.max} mm`);
    lines.push(`- Estado: ${iso1502.status}`);
  } else {
    lines.push("Límites ISO1502:");
    lines.push(`- ${iso1502?.message || "No calculados todavía."}`);
  }

  lines.push("");

  if (trimos?.ok) {
    lines.push("Banco Trimos:");
    lines.push(`- Banco: ${trimos.setup?.banco || "TRIMOS"}`);
    lines.push(`- Rodillo calculado: Ø${trimos.setup?.wire_mm ?? "-"} mm`);
    lines.push(`- Paso: ${trimos.setup?.pitch_mm ?? "-"} mm`);
    lines.push(`- Corrección C: ${trimos.setup?.correction_mm ?? "-"} mm`);
    lines.push(`- Ángulo: ${trimos.setup?.angle_deg ?? "-"}°`);
    lines.push(`- Instrucción: ${trimos.setup?.instruction || "-"}`);

    if (trimos.points?.length) {
      lines.push("");
      lines.push("Puntos de medición:");
      for (const p of trimos.points) {
        lines.push(`- ${p.lado}: ${p.etiqueta}`);
        lines.push(`  Objetivo Trimos: ${p.target_trimos_mm ?? "pendiente"} mm`);
        lines.push(`  Repeticiones: ${p.repetitions}`);
      }
    }
  } else {
    lines.push("Banco Trimos:");
    lines.push(`- ${trimos?.message || "No se ha podido generar plan Trimos."}`);
  }

  lines.push("");
  lines.push("Instrucción operario:");
  lines.push("- NO elegir rodillos manualmente.");
  lines.push("- Montar únicamente el rodillo indicado por TMP.");
  lines.push("- Montar adaptadores de rosca en banco Trimos.");
  lines.push("- Poner a cero según pauta.");
  lines.push("- Introducir lecturas únicamente cuando el flujo MT16 lo solicite.");
  lines.push("- No emitir certificado final hasta completar ISO1502 validado e incertidumbre.");

  return lines.join("\n");
}

export function buildMT16Workflow(equipo = {}) {
  const input = buildThreadInputFromEquipment(equipo);

  const parsed = safeCall(
    () => parseThreadGaugeDesignation({
      rango: input.designation,
      descripcion: equipo.descripcion,
      codigo: equipo.codigo
    }),
    "parseThreadGaugeDesignation"
  );

  const geometry = parsed?.ok
    ? safeCall(
        () => calculateThreadGeometry({
          rango: input.designation,
          parsed
        }),
        "calculateThreadGeometry"
      )
    : {
        ok: false,
        error: "PARSER_NO_OK",
        message: "No se calcula geometría porque el parser no resolvió la rosca."
      };

  const iso965 = parsed?.ok
    ? resolveISO965LimitsFromParsed(parsed)
    : {
        ok: false,
        error: "PARSER_NO_OK",
        message: "No se buscan límites ISO965 porque el parser no resolvió la rosca."
      };

  const iso1502 = iso965?.ok
    ? safeCall(
        () => calculateISO1502InternalPlugGaugeLimits({
          designation: iso965.designation,
          iso965: iso965.data
        }),
        "calculateISO1502InternalPlugGaugeLimits"
      )
    : {
        ok: false,
        error: "ISO965_NO_OK",
        message: "No se calcula ISO1502 porque ISO965 no está completo."
      };

  const trimosRaw = parsed?.ok
    ? safeCall(
        () => buildTrimosPlanForMetricThread({
          rango: input.designation,
          descripcion: equipo.descripcion,
          codigo: equipo.codigo,
          parsed
        }),
        "buildTrimosPlanForMetricThread"
      )
    : {
        ok: false,
        error: "PARSER_NO_OK",
        message: "No se genera plan Trimos porque el parser no resolvió la rosca."
      };

  const trimos = applyISO1502LimitsToTrimosPlan(trimosRaw, iso1502);
  const iso1502DecisionPermission = canISO1502EmitFinalDecision(iso1502);

  const readyForReadings =
    Boolean(parsed?.ok) &&
    Boolean(geometry?.ok) &&
    Boolean(geometry?.geometry?.ok) &&
    Boolean(trimos?.ok);

  const betaEvaluable =
    readyForReadings &&
    Boolean(iso965?.ok) &&
    Boolean(iso1502?.ok) &&
    Boolean(trimos?.limits_loaded);

  const workflow = {
    ok: Boolean(parsed?.ok),
    source: "thread_mt16_workflow",
    version: TMP_MT16_WORKFLOW_VERSION,

    status: betaEvaluable
      ? "READY_FOR_BETA_EVALUATION"
      : readyForReadings
        ? "READY_FOR_TRIMOS_WITH_LIMITS_PENDING"
        : "BETA_INCOMPLETO",

    can_save: false,
    can_emit_certificate: false,

    input,
    parsed,
    geometry,
    iso965,
    iso1502,
    iso1502_decision_permission: iso1502DecisionPermission,
    trimos,

    decision: {
      ok: false,
      status: "NO_FINAL_DECISION",
      message:
        "No emitir OK/NOK final hasta completar ISO1502 validado, incertidumbre y regla de decisión."
    },

    operator_instructions: "",

    next_steps: [
      "Validar tabla ISO1502 contra norma completa",
      "Integrar incertidumbre del banco Trimos, patrón, rodillos, resolución y repetibilidad",
      "Definir regla de decisión final",
      "Crear pantalla MT16 definitiva",
      "Guardar calibración y PDF"
    ]
  };

  workflow.operator_instructions = buildMT16OperatorInstructions({
    parsed,
    geometry,
    iso965,
    iso1502,
    trimos
  });

  return workflow;
}

export default buildMT16Workflow;