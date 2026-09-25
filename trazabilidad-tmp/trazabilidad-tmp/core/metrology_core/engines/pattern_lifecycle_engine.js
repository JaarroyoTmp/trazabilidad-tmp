const VALID_USABLE_STATES = new Set(['VIGENTE', 'PROXIMO_A_VENCER']);
const n = value => value === '' || value === null || value === undefined ? null : Number(value);
const isoDate = value => value ? new Date(value).toISOString().slice(0, 10) : null;

export function derivePatternState({ active = true, result = 'CONFORME', approval = 'APROBADA', nextCalibration, blockedReason = null }, now = new Date()) {
  if (!active) return 'BAJA';
  if (blockedReason) return 'BLOQUEADO';
  if (result === 'NO_CONFORME') return 'NO_CONFORME';
  if (approval !== 'APROBADA') return approval === 'PENDIENTE_REVISION' ? 'PENDIENTE_REVISION' : 'PENDIENTE_CONFIGURACION';
  if (!nextCalibration) return 'VIGENTE';
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(`${nextCalibration}T00:00:00`);
  if (due < today) return 'CADUCADO';
  const warning = new Date(today); warning.setDate(warning.getDate() + 30);
  return due <= warning ? 'PROXIMO_A_VENCER' : 'VIGENTE';
}

export async function canUsePattern(sb, { patternId, useDate = new Date() }) {
  const { data: pattern, error } = await sb.from('mc_patrones').select('*').eq('id', patternId).single();
  if (error || !pattern) return { ok: false, code: 'PATTERN_NOT_FOUND', message: error?.message || 'Patrón no encontrado.' };
  if (!pattern.activo || pattern.estado_metrologico === 'BAJA') return { ok: false, code: 'PATTERN_INACTIVE', message: 'Patrón dado de baja.' };
  if (!VALID_USABLE_STATES.has(pattern.estado_metrologico)) return { ok: false, code: `PATTERN_${pattern.estado_metrologico}`, message: `Patrón no utilizable: ${pattern.estado_metrologico}.` };
  if (!pattern.version_metrologica_vigente_id) return { ok: false, code: 'VERSION_NOT_APPROVED', message: 'No existe versión metrológica aprobada y vigente.' };
  const { data: version, error: vError } = await sb.from('mc_patron_versiones_metrologicas').select('*').eq('id', pattern.version_metrologica_vigente_id).single();
  if (vError || !version) return { ok: false, code: 'VERSION_NOT_FOUND', message: vError?.message || 'Versión vigente no encontrada.' };
  const date = isoDate(useDate);
  if (version.fecha_desde && date < version.fecha_desde) return { ok: false, code: 'VERSION_NOT_STARTED', message: 'La versión aún no era vigente en la fecha de uso.' };
  if (version.fecha_hasta && date > version.fecha_hasta) return { ok: false, code: 'VERSION_EXPIRED', message: 'La versión no era vigente en la fecha de uso.' };
  return { ok: true, pattern, version };
}

export async function nextVersionNumber(sb, patternId) {
  const { data, error } = await sb.from('mc_patron_versiones_metrologicas').select('numero_version').eq('patron_id', patternId).order('numero_version', { ascending: false }).limit(1);
  if (error) throw error;
  return (data?.[0]?.numero_version || 0) + 1;
}

export async function createDraftVersion(sb, payload) {
  const number = await nextVersionNumber(sb, payload.patternId);
  const row = {
    patron_id: payload.patternId,
    numero_version: number,
    estado_aprobacion: payload.submitForReview ? 'PENDIENTE_REVISION' : 'BORRADOR',
    resultado_calibracion: payload.result || 'NO_DECLARADO',
    fecha_calibracion: payload.calibrationDate || null,
    fecha_emision: payload.issueDate || null,
    fecha_desde: payload.validFrom || payload.calibrationDate || null,
    fecha_proxima_calibracion: payload.nextCalibration || null,
    laboratorio: payload.laboratory || null,
    acreditacion: payload.accreditation || null,
    numero_certificado: payload.certificateNumber || null,
    norma_aplicada: payload.standard || null,
    procedimiento_aplicado: payload.procedure || null,
    factor_k: n(payload.coverageFactor) ?? 2,
    observaciones: payload.notes || null,
    creado_por: payload.user || null,
    resumen_metrologico: payload.summary || {}
  };
  const { data, error } = await sb.from('mc_patron_versiones_metrologicas').insert(row).select().single();
  if (error) throw error;
  await audit(sb, { patternId: payload.patternId, versionId: data.id, action: 'VERSION_CREADA', entity: 'VERSION_METROLOGICA', newData: data, user: payload.user });
  return data;
}

export async function replaceVersionResults(sb, { versionId, patternId, results = [] }) {
  const { error: deleteError } = await sb.from('mc_patron_resultados_version').delete().eq('version_id', versionId);
  if (deleteError) throw deleteError;
  if (!results.length) return [];
  const rows = results.map(r => ({
    version_id: versionId,
    patron_id: patternId,
    componente_id: r.componentId || null,
    codigo_punto: r.code || null,
    tipo_resultado: r.type || 'PUNTO',
    nominal: n(r.nominal),
    unidad: r.unit || 'mm',
    valor_certificado: n(r.certifiedValue),
    correccion: n(r.correction),
    incertidumbre_expandida: n(r.expandedUncertainty),
    factor_k: n(r.coverageFactor) ?? 2,
    incertidumbre_estandar: n(r.expandedUncertainty) !== null ? n(r.expandedUncertainty) / (n(r.coverageFactor) || 2) : null,
    desde: n(r.from),
    hasta: n(r.to),
    posicion: r.position || null,
    ensayo: r.test || null,
    resultado: r.result || null,
    datos_extra: r.extra || {}
  }));
  const { data, error } = await sb.from('mc_patron_resultados_version').insert(rows).select();
  if (error) throw error;
  return data || [];
}

export async function approveVersion(sb, { versionId, user, reason = null }) {
  const { data: version, error } = await sb.from('mc_patron_versiones_metrologicas').select('*').eq('id', versionId).single();
  if (error) throw error;
  if (!version.fecha_calibracion || !version.numero_certificado) throw new Error('Faltan fecha de calibración o número de certificado.');
  const state = derivePatternState({ result: version.resultado_calibracion, approval: 'APROBADA', nextCalibration: version.fecha_proxima_calibracion });

  const { data: oldVersions } = await sb.from('mc_patron_versiones_metrologicas').select('id').eq('patron_id', version.patron_id).eq('estado_aprobacion', 'APROBADA').neq('id', version.id);
  if (oldVersions?.length) {
    await sb.from('mc_patron_versiones_metrologicas').update({ estado_aprobacion: 'HISTORICA', fecha_hasta: version.fecha_desde || version.fecha_calibracion }).in('id', oldVersions.map(v => v.id));
  }

  const { error: updateVersionError } = await sb.from('mc_patron_versiones_metrologicas').update({ estado_aprobacion: 'APROBADA', aprobado_por: user, aprobado_at: new Date().toISOString() }).eq('id', versionId);
  if (updateVersionError) throw updateVersionError;
  const patternUpdate = {
    version_metrologica_vigente_id: versionId,
    estado_metrologico: state,
    fecha_ultima_calibracion: version.fecha_calibracion,
    fecha_proxima_calibracion: version.fecha_proxima_calibracion,
    bloqueado_motivo: state === 'NO_CONFORME' ? 'Resultado NO CONFORME en calibración externa.' : null,
    updated_at: new Date().toISOString()
  };
  const { error: pError } = await sb.from('mc_patrones').update(patternUpdate).eq('id', version.patron_id);
  if (pError) throw pError;
  await audit(sb, { patternId: version.patron_id, versionId, action: 'VERSION_APROBADA', entity: 'VERSION_METROLOGICA', newData: patternUpdate, reason, user });
  return { ...version, estado_aprobacion: 'APROBADA', patternState: state };
}

export async function registerImport(sb, payload) {
  const row = {
    patron_id: payload.patternId,
    version_id: payload.versionId || null,
    tipo_archivo: payload.fileType || null,
    nombre_archivo: payload.fileName || null,
    storage_path: payload.storagePath || null,
    hash_archivo: payload.hash || null,
    estado: payload.state || 'SUBIDO',
    datos_extraidos: payload.extractedData || {},
    advertencias: payload.warnings || [],
    subido_por: payload.user || null
  };
  const { data, error } = await sb.from('mc_patron_importaciones').insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function audit(sb, { patternId, versionId = null, action, entity = null, entityId = null, oldData = null, newData = null, reason = null, user = null }) {
  const { error } = await sb.from('mc_patron_auditoria').insert({
    patron_id: patternId, version_id: versionId, accion: action, entidad: entity, entidad_id: entityId,
    datos_anteriores: oldData, datos_nuevos: newData, motivo: reason, usuario: user
  });
  if (error) throw error;
}
