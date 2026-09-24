/* ===========================================================
   TMP KNOWLEDGE ENGINE V1
   -----------------------------------------------------------
   Capa de conocimiento guiado para calibraciones TMP.

   Objetivo:
   - Convertir un procedimiento existente en instrucciones claras.
   - No calcula metrología.
   - No sustituye decision_engine.
   - No sustituye calibration_execution_engine.
   - Traduce el procedimiento a una guía para operario.

   Ubicación:
   core/metrology_core/procedure_rules/knowledge_engine.js
   =========================================================== */

export const TMP_KNOWLEDGE_ENGINE_VERSION =
  "TMP_KNOWLEDGE_ENGINE_V1_20260630_GUIDED_OPERATOR_KNOWLEDGE";

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function hasValue(v) {
  return v !== null && v !== undefined && String(v).trim() !== "";
}

function normalizeText(v = "") {
  return String(v || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/,/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

function getProcedureFamily(procedure = {}) {
  return procedure.familia || procedure.family || procedure.tipo || "UNKNOWN";
}

function getProcedureNorms(procedure = {}) {
  const normas = procedure.norma || procedure.normas || procedure.applicable_norms || [];
  return safeArray(normas).map(n => {
    if (typeof n === "string") return { code: n, role: "" };
    return {
      code: n.code || n.norma || n.id || String(n),
      role: n.role || n.descripcion || n.description || ""
    };
  });
}

function getGuidedSteps(procedure = {}) {
  return procedure.pasos_guiados || procedure.wizard_steps || [];
}

function getOperatorInstructions(procedure = {}) {
  return procedure.instrucciones_operario || procedure.operator_instructions || [];
}

function extractRequiredItems(procedure = {}) {
  const items = [];

  const criterio = procedure.criterio_metrologico || {};
  if (criterio.patron_principal) {
    items.push({
      type: "PATRON_PRINCIPAL",
      label: criterio.patron_principal,
      required: true,
      blocks: true,
      role: "Aporta trazabilidad, corrección e incertidumbre."
    });
  }

  if (criterio.utiles_medicion) {
    items.push({
      type: "UTIL_MEDICION",
      label: criterio.utiles_medicion,
      required: true,
      blocks: false,
      role: "Necesario para realizar la medición, pero no es el patrón principal."
    });
  }

  const funciones = safeArray(procedure.funciones);
  for (const f of funciones) {
    if (f.patron_tipo || f.patron_principal) {
      items.push({
        type: f.patron_tipo || "PATRON",
        label: f.patron_principal || f.patron_tipo,
        required: true,
        blocks: true,
        role: "Patrón requerido por la función de calibración."
      });
    }

    if (f.patron_complementario) {
      items.push({
        type: f.patron_complementario,
        label: f.patron_complementario,
        required: true,
        blocks: Boolean(f.rodillos_bloquean_calibracion),
        role: f.rodillos_bloquean_calibracion
          ? "Elemento complementario obligatorio."
          : "Útil complementario necesario para medir, no bloquea por trazabilidad."
      });
    }
  }

  return items;
}

function buildThreadPlugExplanation(procedure = {}) {
  const datos = procedure.datos_rosca || {};
  const criterio = procedure.criterio_metrologico || {};
  const rodillo = datos.rodillo_recomendado;

  return {
    title: "Criterio aplicado para tampón roscado",
    summary:
      "El sistema aplica el método normativo para rosca y utiliza el banco Trimos como patrón trazable principal.",
    key_points: [
      "La norma define la geometría, límites y método de verificación.",
      "El banco Trimos certificado aporta corrección e incertidumbre.",
      "Los rodillos/hilos se calculan por norma para poder tomar la lectura.",
      "El operario no decide la conformidad; sólo ejecuta los pasos indicados.",
      "La decisión final se calcula con las lecturas y la regla ILAC-G8."
    ],
    thread_data: {
      tipo_rosca: datos.tipo_rosca,
      diametro_nominal: datos.diametro_nominal,
      paso: datos.paso,
      clase: datos.clase,
      angulo: datos.angulo,
      rodillo_recomendado: rodillo
    },
    metrological_rule:
      criterio.regla ||
      "El patrón principal es el banco Trimos certificado. Los rodillos son útiles de medición calculados por norma."
  };
}

function buildGenericExplanation(procedure = {}) {
  return {
    title: "Criterio aplicado",
    summary:
      "El sistema utiliza el procedimiento seleccionado para guiar al operario y preparar la evaluación metrológica.",
    key_points: [
      "El operario sigue instrucciones.",
      "El sistema selecciona método y patrón.",
      "El motor metrológico calcula el resultado.",
      "La decisión final no es manual."
    ],
    metrological_rule:
      procedure.criterio_metrologico?.regla ||
      procedure.metrological_principle?.key_rule ||
      "La decisión se realiza mediante el motor de decisión configurado."
  };
}

function buildRisks(procedure = {}) {
  const family = getProcedureFamily(procedure);
  const text = normalizeText(`${procedure.descripcion || ""} ${procedure.name || ""} ${family}`);

  if (text.includes("ROSC")) {
    return [
      {
        id: "ROSCA_SUCIA",
        severity: "MEDIA",
        message: "Rosca sucia o con rebabas puede alterar las lecturas.",
        action: "Limpiar rosca y verificar visualmente antes de medir."
      },
      {
        id: "RODILLOS_INCORRECTOS",
        severity: "ALTA",
        message: "Rodillos/hilos de diámetro incorrecto invalidan la lectura.",
        action: "Usar únicamente el diámetro indicado por el sistema."
      },
      {
        id: "BANCO_NO_TRAZADO",
        severity: "CRITICA",
        message: "Sin banco Trimos certificado no debe emitirse resultado metrológico válido.",
        action: "Bloquear calibración hasta resolver trazabilidad del banco."
      },
      {
        id: "LECTURAS_INESTABLES",
        severity: "MEDIA",
        message: "Alta dispersión entre lecturas puede indicar mal montaje o suciedad.",
        action: "Repetir montaje, limpiar y volver a medir si el sistema lo indica."
      }
    ];
  }

  return [
    {
      id: "PATRON_NO_TRAZADO",
      severity: "CRITICA",
      message: "Sin patrón certificado no debe emitirse resultado metrológico válido.",
      action: "Seleccionar patrón vigente."
    },
    {
      id: "LECTURAS_INESTABLES",
      severity: "MEDIA",
      message: "Alta dispersión entre lecturas puede indicar error de uso.",
      action: "Repetir la medición si el sistema lo indica."
    }
  ];
}

function buildDecisionPolicy(procedure = {}) {
  const policy = procedure.decision_policy || {};
  return {
    operator_can_decide:
      procedure.decision_operario_permitida ??
      policy.operator_decision_allowed ??
      false,
    allowed_results:
      procedure.resultado_permitido ||
      policy.allowed_results ||
      ["OK", "NOK", "INDETERMINADO"],
    rule:
      procedure.regla_global ||
      policy.rule ||
      "ILAC-G8",
    explanation_required:
      policy.explanation_required ?? true
  };
}

export function buildOperatorKnowledgePack({ procedure = {}, equipment = {}, normative = {}, traceability = {} } = {}) {
  const family = getProcedureFamily(procedure);
  const norms = getProcedureNorms(procedure);
  const steps = getGuidedSteps(procedure);
  const instructions = getOperatorInstructions(procedure);
  const required_items = extractRequiredItems(procedure);

  const isThread = normalizeText(family).includes("ROSC") ||
    normalizeText(procedure.descripcion || procedure.name || "").includes("ROSC");

  const explanation = isThread
    ? buildThreadPlugExplanation(procedure)
    : buildGenericExplanation(procedure);

  return {
    ok: true,
    version: TMP_KNOWLEDGE_ENGINE_VERSION,
    type: "OPERATOR_KNOWLEDGE_PACK",
    procedure: {
      id: procedure.procedimiento || procedure.id || null,
      version: procedure.version || null,
      family,
      description: procedure.descripcion || procedure.name || "",
      status: procedure.status || "ACTIVE"
    },
    equipment,
    norms,
    required_items,
    instructions,
    guided_steps: steps.map((s, idx) => ({
      step_no: idx + 1,
      id: s.id || `STEP_${idx + 1}`,
      title: s.titulo || s.title || `Paso ${idx + 1}`,
      type: s.tipo || s.type || "INSTRUCCION",
      text: s.texto || s.operator_text || "",
      point_id: s.punto_id || s.point_id || null,
      readings: s.lecturas || s.expected_readings || null,
      requires_confirmation: s.required_confirmation ?? s.requiere_confirmacion ?? false
    })),
    expected_values: {
      rodillo_recomendado:
        procedure.datos_rosca?.rodillo_recomendado ??
        normative?.summary?.rodillo_mm ??
        normative?.trimos?.wire?.selected_wire_mm ??
        null,
      pass_target_trimos_mm:
        normative?.summary?.pass_target_trimos_mm ??
        normative?.trimos?.plan?.points?.find?.(p => p.id === "PASA")?.target_trimos_mm ??
        null,
      no_pass_target_trimos_mm:
        normative?.summary?.no_pass_target_trimos_mm ??
        normative?.trimos?.plan?.points?.find?.(p => p.id === "NO_PASA")?.target_trimos_mm ??
        null
    },
    traceability: {
      main_pattern:
        procedure.criterio_metrologico?.patron_principal ||
        procedure.metrological_principle?.traceable_pattern ||
        null,
      bank_code:
        traceability?.selected_bank?.codigo ||
        traceability?.bank?.codigo ||
        null,
      bank_ok:
        traceability?.ok ??
        null,
      auxiliary_tools_do_not_block:
        required_items.some(x => x.type && String(x.type).includes("RODILLOS") && !x.blocks)
    },
    explanation,
    risks: buildRisks(procedure),
    decision_policy: buildDecisionPolicy(procedure),
    operator_summary: buildOperatorSummary({ procedure, explanation, steps, required_items }),
    warnings: buildKnowledgeWarnings({ procedure, steps, required_items })
  };
}

function buildOperatorSummary({ procedure = {}, explanation = {}, steps = [], required_items = [] } = {}) {
  const lines = [];

  lines.push(`Procedimiento: ${procedure.descripcion || procedure.name || procedure.procedimiento || "Sin descripción"}`);

  if (explanation.thread_data?.rodillo_recomendado) {
    lines.push(`Rodillos/hilos a montar: Ø ${explanation.thread_data.rodillo_recomendado} mm.`);
  }

  const pattern = required_items.find(x => x.type === "PATRON_PRINCIPAL" || x.blocks);
  if (pattern?.label) {
    lines.push(`Patrón principal: ${pattern.label}.`);
  }

  lines.push(`Pasos guiados: ${steps.length}.`);
  lines.push("El operario no decide OK/NOK; el sistema calcula la decisión.");

  return lines;
}

function buildKnowledgeWarnings({ procedure = {}, steps = [], required_items = [] } = {}) {
  const warnings = [];

  if (!procedure || Object.keys(procedure).length === 0) {
    warnings.push("No se recibió procedimiento.");
  }

  if (!steps.length) {
    warnings.push("El procedimiento no contiene pasos guiados.");
  }

  if (!required_items.length) {
    warnings.push("El procedimiento no declara patrón ni útiles requeridos.");
  }

  if (procedure.decision_operario_permitida === true) {
    warnings.push("El procedimiento permite decisión del operario; revisar criterio TMP.");
  }

  return warnings;
}

export default {
  TMP_KNOWLEDGE_ENGINE_VERSION,
  buildOperatorKnowledgePack
};
