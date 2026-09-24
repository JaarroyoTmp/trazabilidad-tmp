-- =============================================================
-- TMP · INVENTARIO Y VALORACIÓN
-- Migración incremental. No elimina datos ni objetos existentes.
-- Ejecutar en Supabase SQL Editor.
-- =============================================================

-- 1) Valor específico opcional por instrumento
ALTER TABLE public.instrumentos
ADD COLUMN IF NOT EXISTS valor_reposicion_especifico numeric(12,2);

-- 2) Valor orientativo por familia física
CREATE TABLE IF NOT EXISTS public.valoracion_familias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id uuid UNIQUE REFERENCES public.familias_instrumentos(id) ON DELETE CASCADE,
  valor_reposicion_orientativo numeric(12,2),
  moneda text NOT NULL DEFAULT 'EUR',
  fuente text,
  observaciones text,
  actualizado_en timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.valoracion_familias ENABLE ROW LEVEL SECURITY;

-- Lectura para la aplicación web actual.
DROP POLICY IF EXISTS valoracion_familias_select_anon ON public.valoracion_familias;
CREATE POLICY valoracion_familias_select_anon
ON public.valoracion_familias
FOR SELECT
TO anon, authenticated
USING (true);

-- Escritura para la herramienta de administración actual.
-- Si más adelante se implanta Auth/roles, sustituir estas políticas
-- por una política limitada a administradores/calidad.
DROP POLICY IF EXISTS valoracion_familias_insert_anon ON public.valoracion_familias;
CREATE POLICY valoracion_familias_insert_anon
ON public.valoracion_familias
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS valoracion_familias_update_anon ON public.valoracion_familias;
CREATE POLICY valoracion_familias_update_anon
ON public.valoracion_familias
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 3) Vista resumen propietario + familia
CREATE OR REPLACE VIEW public.v_inventario_por_propietario_familia AS
SELECT
  COALESCE(pe.nombre, 'SIN PROPIETARIO') AS propietario,
  COALESCE(fi.nombre, 'SIN FAMILIA') AS familia_instrumento,
  COUNT(*) AS cantidad,
  COUNT(*) FILTER (WHERE COALESCE(i.estado,'') = 'En laboratorio') AS en_laboratorio,
  COUNT(*) FILTER (WHERE COALESCE(i.estado,'') = 'En uso') AS en_uso,
  COUNT(*) FILTER (WHERE COALESCE(i.estado,'') = 'Baja definitiva') AS bajas,
  COUNT(*) FILTER (
    WHERE i.fecha_proxima_calibracion IS NULL
      AND i.proxima_calibracion IS NULL
  ) AS sin_fecha_calibracion
FROM public.instrumentos i
LEFT JOIN public.propietarios_equipos pe ON pe.id = i.propietario_id
LEFT JOIN public.familias_instrumentos fi ON fi.id = i.familia_id
GROUP BY 1,2
ORDER BY 1,2;

-- 4) Vista detallada
CREATE OR REPLACE VIEW public.v_inventario_equipos_detalle AS
SELECT
  i.id,i.codigo,i.descripcion,i.fabricante,i.rango,i.precision,
  COALESCE(pe.nombre,'SIN PROPIETARIO') AS propietario,
  COALESCE(fi.nombre,'SIN FAMILIA') AS familia_instrumento,
  COALESCE(fc.nombre,'SIN FAMILIA CALIBRACION') AS familia_calibracion,
  i.estado,i.ubicacion_actual,i.fecha_calibracion,
  COALESCE(i.fecha_proxima_calibracion,i.proxima_calibracion) AS fecha_proxima_calibracion,
  i.valor_reposicion_especifico,
  i.familia_id,i.propietario_id,i.creado_en,i.actualizado_en
FROM public.instrumentos i
LEFT JOIN public.propietarios_equipos pe ON pe.id=i.propietario_id
LEFT JOIN public.familias_instrumentos fi ON fi.id=i.familia_id
LEFT JOIN public.familias_calibracion fc ON fc.id=i.familia_calibracion_id;

-- 5) Vista valoración efectiva
CREATE OR REPLACE VIEW public.v_valor_laboratorio AS
SELECT
  i.id,i.codigo,i.descripcion,
  COALESCE(pe.nombre,'SIN PROPIETARIO') AS propietario,
  COALESCE(fi.nombre,'SIN FAMILIA') AS familia,
  COALESCE(i.valor_reposicion_especifico,vf.valor_reposicion_orientativo) AS valor_reposicion_estimado,
  CASE
    WHEN i.valor_reposicion_especifico IS NOT NULL THEN 'ESPECIFICO'
    WHEN vf.valor_reposicion_orientativo IS NOT NULL THEN 'FAMILIA'
    ELSE 'SIN VALORAR'
  END AS origen_valor
FROM public.instrumentos i
LEFT JOIN public.propietarios_equipos pe ON pe.id=i.propietario_id
LEFT JOIN public.familias_instrumentos fi ON fi.id=i.familia_id
LEFT JOIN public.valoracion_familias vf ON vf.familia_id=i.familia_id;
