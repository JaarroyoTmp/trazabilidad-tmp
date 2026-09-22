-- TMP · MIGRACION: REPOSICIONES -> NECESIDADES DEL LABORATORIO
-- Ejecutar UNA VEZ en Supabase SQL Editor antes de subir los HTML.
-- No borra reposiciones existentes ni instrumentos, movimientos o certificados.

BEGIN;

-- La misma tabla se conserva para no romper la app ni el workflow n8n ya creado.
ALTER TABLE public.reposiciones ADD COLUMN IF NOT EXISTS origen text;
ALTER TABLE public.reposiciones ADD COLUMN IF NOT EXISTS tipo_necesidad text;
ALTER TABLE public.reposiciones ADD COLUMN IF NOT EXISTS solicitado_por text;
ALTER TABLE public.reposiciones ADD COLUMN IF NOT EXISTS justificacion text;

-- Las necesidades manuales no tienen por qué proceder de un instrumento existente.
ALTER TABLE public.reposiciones ALTER COLUMN instrumento_codigo DROP NOT NULL;

-- El modelo anterior obligaba a un único registro por código. Se sustituye por un
-- índice parcial: una baja concreta solo genera una reposición automática abierta.
ALTER TABLE public.reposiciones DROP CONSTRAINT IF EXISTS reposiciones_instrumento_codigo_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_reposicion_baja_instrumento
ON public.reposiciones(instrumento_codigo)
WHERE instrumento_codigo IS NOT NULL AND origen = 'Baja definitiva';

-- Ampliar estados sin perder los existentes.
ALTER TABLE public.reposiciones DROP CONSTRAINT IF EXISTS reposiciones_estado_check;
ALTER TABLE public.reposiciones ADD CONSTRAINT reposiciones_estado_check
CHECK (estado IN ('Pendiente','Solicitado','Aprobado','Pedido','Recibido','Cancelado'));

-- Normalizar los registros históricos ya existentes.
UPDATE public.reposiciones
SET origen = COALESCE(origen,'Baja definitiva'),
    tipo_necesidad = COALESCE(tipo_necesidad,'Reposición'),
    solicitado_por = COALESCE(solicitado_por,responsable_baja),
    justificacion = COALESCE(justificacion,motivo_baja)
WHERE origen IS NULL OR tipo_necesidad IS NULL OR solicitado_por IS NULL OR justificacion IS NULL;

ALTER TABLE public.reposiciones ALTER COLUMN origen SET DEFAULT 'Manual';
ALTER TABLE public.reposiciones ALTER COLUMN tipo_necesidad SET DEFAULT 'Nuevo equipo';

-- Mantener permisos para la arquitectura web actual.
GRANT SELECT, INSERT, UPDATE ON public.reposiciones TO anon, authenticated;

-- La vista conserva el nombre anterior para NO romper n8n. Ahora contiene todas
-- las necesidades abiertas pendientes de aviso, vengan de baja o sean manuales.
CREATE OR REPLACE VIEW public.reposiciones_pendientes_n8n AS
SELECT *
FROM public.reposiciones
WHERE estado NOT IN ('Recibido','Cancelado')
  AND notificacion_estado IN ('Pendiente','Error')
ORDER BY CASE prioridad WHEN 'Urgente' THEN 1 WHEN 'Alta' THEN 2 ELSE 3 END, creado_en;
GRANT SELECT ON public.reposiciones_pendientes_n8n TO anon, authenticated;

COMMIT;

-- Comprobación final
SELECT id, origen, tipo_necesidad, instrumento_codigo, descripcion, cantidad, prioridad, estado, solicitado_por, notificacion_estado
FROM public.reposiciones
ORDER BY creado_en DESC;
