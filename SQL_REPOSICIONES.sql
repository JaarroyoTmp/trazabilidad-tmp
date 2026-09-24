-- TMP · Lista de compra / reposición
-- Ejecutar una sola vez en Supabase SQL Editor.
-- No borra ni modifica datos existentes de instrumentos/movimientos.

CREATE TABLE IF NOT EXISTS public.reposiciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrumento_codigo text NOT NULL,
  descripcion text,
  familia_id uuid,
  motivo_baja text,
  responsable_baja text,
  observaciones text,
  cantidad integer NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  prioridad text NOT NULL DEFAULT 'Normal' CHECK (prioridad IN ('Normal','Alta','Urgente')),
  estado text NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','Solicitado','Pedido','Recibido','Cancelado')),
  fecha_baja timestamptz,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  notificacion_estado text NOT NULL DEFAULT 'Pendiente' CHECK (notificacion_estado IN ('Pendiente','Notificada','Cerrada','Error')),
  notificado_en timestamptz,
  notificacion_ultimo_error text,
  CONSTRAINT reposiciones_instrumento_codigo_key UNIQUE (instrumento_codigo)
);

CREATE INDEX IF NOT EXISTS idx_reposiciones_estado ON public.reposiciones(estado);
CREATE INDEX IF NOT EXISTS idx_reposiciones_notificacion ON public.reposiciones(notificacion_estado, creado_en);

GRANT SELECT, INSERT, UPDATE ON public.reposiciones TO anon, authenticated;

-- Si RLS estuviera activado manualmente en el futuro, crear políticas antes de usar la app.
-- Por compatibilidad con la arquitectura actual se deja la tabla sin RLS forzado desde este script.

-- Incorporar a reposición las bajas definitivas que ya existan y aún no estén registradas.
INSERT INTO public.reposiciones (
  instrumento_codigo, descripcion, familia_id, motivo_baja, responsable_baja,
  observaciones, cantidad, prioridad, estado, fecha_baja, notificacion_estado
)
SELECT
  i.codigo,
  i.descripcion,
  i.familia_id,
  COALESCE(NULLIF(substring(m.observaciones from 'Motivo baja: ([^\\n]+)'),''),'Baja definitiva'),
  m.responsable,
  m.observaciones,
  1,
  'Normal',
  'Pendiente',
  m.fecha,
  'Pendiente'
FROM public.instrumentos i
LEFT JOIN LATERAL (
  SELECT fecha,responsable,observaciones
  FROM public.movimientos mm
  WHERE mm.codigo_instrumento=i.codigo
    AND mm.tipo_movimiento='Baja definitiva'
  ORDER BY mm.fecha DESC
  LIMIT 1
) m ON true
WHERE (upper(coalesce(i.estado,'')) IN ('BAJA DEFINITIVA','BAJA TÉCNICA','RETIRADO') OR upper(coalesce(i.ubicacion_actual,''))='RETIRADO')
ON CONFLICT (instrumento_codigo) DO NOTHING;

-- Vista simple para n8n: solo elementos abiertos que necesitan aviso.
CREATE OR REPLACE VIEW public.reposiciones_pendientes_n8n AS
SELECT *
FROM public.reposiciones
WHERE estado NOT IN ('Recibido','Cancelado')
  AND notificacion_estado IN ('Pendiente','Error')
ORDER BY
  CASE prioridad WHEN 'Urgente' THEN 1 WHEN 'Alta' THEN 2 ELSE 3 END,
  creado_en;

GRANT SELECT ON public.reposiciones_pendientes_n8n TO anon, authenticated;

SELECT instrumento_codigo, descripcion, prioridad, estado, notificacion_estado, creado_en
FROM public.reposiciones
ORDER BY creado_en DESC;
