-- TMP - Sincronización puntual del estado operativo con el último movimiento registrado.
-- No elimina movimientos ni instrumentos.

WITH ultimo_movimiento AS (
  SELECT DISTINCT ON (codigo_instrumento)
    codigo_instrumento,
    tipo_movimiento,
    destino,
    fecha
  FROM public.movimientos
  WHERE codigo_instrumento IS NOT NULL
  ORDER BY codigo_instrumento, fecha DESC
), estados AS (
  SELECT
    codigo_instrumento,
    CASE
      WHEN tipo_movimiento = 'Entrada' THEN 'En laboratorio'
      WHEN tipo_movimiento = 'Salida' THEN 'En uso'
      WHEN tipo_movimiento = 'Préstamo externo' THEN 'Préstamo externo'
      WHEN tipo_movimiento = 'Revisión / reparación' THEN 'Revisión / reparación'
      WHEN tipo_movimiento = 'Envío a calibración externa' THEN 'Calibración externa'
      ELSE NULL
    END AS estado_correcto
  FROM ultimo_movimiento
)
UPDATE public.instrumentos i
SET estado = e.estado_correcto
FROM estados e
WHERE i.codigo = e.codigo_instrumento
  AND e.estado_correcto IS NOT NULL
  AND i.estado IS DISTINCT FROM e.estado_correcto;

-- Comprobación de posibles incoherencias restantes.
SELECT codigo, descripcion, ubicacion_actual, estado
FROM public.instrumentos
WHERE
  (LOWER(COALESCE(ubicacion_actual,'')) = 'laboratorio' AND estado = 'En uso')
  OR
  (LOWER(COALESCE(ubicacion_actual,'')) <> 'laboratorio' AND estado = 'En laboratorio')
ORDER BY ubicacion_actual, codigo;
