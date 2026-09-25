-- TMP · FIX PRE-MT16 · NECESIDADES DE LABORATORIO / FUERA DE USO
-- Seguro e incremental. No elimina instrumentos ni necesidades existentes.

BEGIN;

-- 1) Incorporar equipos que YA están marcados operativamente como Fuera de uso
-- y no tienen una necesidad abierta. No se confunde con "fuera de calibración":
-- aquí se mira exclusivamente instrumentos.estado.
INSERT INTO public.reposiciones (
  instrumento_codigo, descripcion, familia_id, motivo_baja, responsable_baja,
  observaciones, cantidad, prioridad, estado, fecha_baja, notificacion_estado,
  origen, tipo_necesidad, solicitado_por, justificacion
)
SELECT
  i.codigo,
  i.descripcion,
  i.familia_id,
  'Equipo marcado operativamente como Fuera de uso',
  'Sistema',
  'Revisar reparación, sustitución o reposición antes de volver a poner el equipo en servicio.',
  1,
  'Alta',
  'Pendiente',
  now(),
  'Pendiente',
  'Fuera de uso',
  'Reposición',
  'Sistema',
  'Equipo marcado operativamente como Fuera de uso. Revisar reparación, sustitución o reposición.'
FROM public.instrumentos i
WHERE upper(trim(coalesce(i.estado,''))) IN ('FUERA DE USO','FUERA USO')
  AND NOT EXISTS (
    SELECT 1 FROM public.reposiciones r
    WHERE r.instrumento_codigo = i.codigo
      AND r.estado NOT IN ('Recibido','Cancelado')
  );

-- 2) Sincronizar en adelante cuando un equipo ENTRE en estado Fuera de uso.
CREATE OR REPLACE FUNCTION public.sync_necesidad_fuera_uso()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF upper(trim(coalesce(NEW.estado,''))) IN ('FUERA DE USO','FUERA USO')
     AND (TG_OP = 'INSERT' OR OLD.estado IS DISTINCT FROM NEW.estado) THEN

    IF NOT EXISTS (
      SELECT 1 FROM public.reposiciones r
      WHERE r.instrumento_codigo = NEW.codigo
        AND r.estado NOT IN ('Recibido','Cancelado')
    ) THEN
      INSERT INTO public.reposiciones (
        instrumento_codigo, descripcion, familia_id, motivo_baja, responsable_baja,
        observaciones, cantidad, prioridad, estado, fecha_baja, notificacion_estado,
        origen, tipo_necesidad, solicitado_por, justificacion
      ) VALUES (
        NEW.codigo, NEW.descripcion, NEW.familia_id,
        'Equipo marcado operativamente como Fuera de uso', 'Sistema',
        'Revisar reparación, sustitución o reposición antes de volver a poner el equipo en servicio.',
        1, 'Alta', 'Pendiente', now(), 'Pendiente',
        'Fuera de uso', 'Reposición', 'Sistema',
        'Equipo marcado operativamente como Fuera de uso. Revisar reparación, sustitución o reposición.'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_necesidad_fuera_uso ON public.instrumentos;
CREATE TRIGGER trg_sync_necesidad_fuera_uso
AFTER INSERT OR UPDATE OF estado ON public.instrumentos
FOR EACH ROW EXECUTE FUNCTION public.sync_necesidad_fuera_uso();

COMMIT;

-- Comprobación: deben aparecer aquí los equipos Fuera de uso y su necesidad abierta.
SELECT
  i.codigo, i.descripcion, i.estado,
  r.id AS necesidad_id, r.origen, r.tipo_necesidad, r.prioridad, r.estado AS estado_necesidad
FROM public.instrumentos i
LEFT JOIN public.reposiciones r
  ON r.instrumento_codigo=i.codigo
 AND r.estado NOT IN ('Recibido','Cancelado')
WHERE upper(trim(coalesce(i.estado,''))) IN ('FUERA DE USO','FUERA USO')
ORDER BY i.codigo;
