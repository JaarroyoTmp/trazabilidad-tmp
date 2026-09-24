/* ===========================================================
   TMP AUDIT KNOWLEDGE BRIDGE V1
   -----------------------------------------------------------
   Une metrology_rules_repository con audit_trace_engine.

   Objetivo:
   Mejorar el informe de auditoría con:
   - requisitos documentales por familia
   - textos de certificado
   - criterio TMP
   =========================================================== */

import {
  getAuditRequirements,
  getMetrologyRules
} from "./metrology_rules_repository.js";

export function enrichAuditWithKnowledge(audit = {}) {
  const family = audit.instrumento?.familia_motor || audit.family || audit.familia;
  const req = getAuditRequirements(family);
  const rules = getMetrologyRules(family);

  return {
    ...audit,
    conocimiento_tmp: {
      family,
      procedimiento_tmp: req.procedimiento_tmp,
      documentos_base: req.documentos_base,
      debe_documentar: req.debe_documentar,
      texto_certificado_base: req.texto_certificado,
      criterio_tmp: req.criterio_tmp,
      reglas_completas: rules,
      warnings: req.warnings
    },
    resumen_auditoria: {
      ...(audit.resumen_auditoria || {}),
      texto_certificado_base: req.texto_certificado,
      requisitos_documentales: req.debe_documentar,
      criterio_tmp: req.criterio_tmp,
      advertencias: [
        ...(audit.resumen_auditoria?.advertencias || []),
        ...(req.warnings || [])
      ]
    }
  };
}

export function buildKnowledgeCertificateSection(familyKey) {
  const req = getAuditRequirements(familyKey);

  return {
    procedimiento: req.procedimiento_tmp,
    documentos_base: req.documentos_base,
    criterio_tmp: req.criterio_tmp,
    texto: req.texto_certificado,
    requisitos_documentales: req.debe_documentar
  };
}
