/* TMP - CONSULTAS BASE HISTORICO CALIBRACIONES */

SELECT
  c.id,
  c.codigo AS codigo_calibracion,
  i.codigo AS codigo_equipo,
  i.descripcion,
  i.rango,
  c.fecha_ultima,
  c.fecha_proxima,
  c.resultado,
  c.estado_final,
  c.decision_global,
  c.operador,
  c.procedimiento_codigo,
  c.familia_equipo,
  c.estado_guardado,
  c.certificado_url,
  c.creado_en
FROM calibraciones c
LEFT JOIN instrumentos i ON i.id = c.instrumento_id
ORDER BY c.creado_en DESC
LIMIT 100;

SELECT
  c.id,
  c.codigo AS codigo_calibracion,
  i.codigo AS codigo_equipo,
  i.descripcion,
  c.fecha_ultima,
  c.resultado,
  c.estado_guardado,
  c.certificado_url
FROM calibraciones c
LEFT JOIN instrumentos i ON i.id = c.instrumento_id
WHERE c.certificado_url IS NULL
ORDER BY c.creado_en DESC;

SELECT
  COALESCE(c.resultado, c.estado_final, c.decision_global, 'SIN_RESULTADO') AS resultado,
  COUNT(*) AS cantidad
FROM calibraciones c
GROUP BY COALESCE(c.resultado, c.estado_final, c.decision_global, 'SIN_RESULTADO')
ORDER BY cantidad DESC;
