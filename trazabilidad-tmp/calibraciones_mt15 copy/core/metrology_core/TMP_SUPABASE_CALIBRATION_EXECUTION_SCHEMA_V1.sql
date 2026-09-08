-- ============================================================
-- TMP_SUPABASE_CALIBRATION_EXECUTION_SCHEMA_V1.sql
-- Refuerzo seguro para guardar ejecuciones completas de calibracion
-- ------------------------------------------------------------
-- NO borra tablas.
-- NO elimina columnas.
-- NO cambia datos existentes.
-- Añade columnas auxiliares si faltan.
-- Crea vistas utiles para revisar historico.
-- ============================================================

-- ============================================================
-- 1. Refuerzo tabla calibraciones
-- ============================================================

alter table calibraciones
add column if not exists execution_id text;

alter table calibraciones
add column if not exists familia_equipo text;

alter table calibraciones
add column if not exists procedimiento_codigo text;

alter table calibraciones
add column if not exists norma_aplicada text;

alter table calibraciones
add column if not exists regla_decision text;

alter table calibraciones
add column if not exists decision_global text;

alter table calibraciones
add column if not exists datos_motor jsonb default '{}'::jsonb;

alter table calibraciones
add column if not exists payload_completo jsonb default '{}'::jsonb;

alter table calibraciones
add column if not exists estado_guardado text default 'BORRADOR';

create index if not exists idx_calibraciones_execution_id
on calibraciones(execution_id);

create index if not exists idx_calibraciones_instrumento_id
on calibraciones(instrumento_id);

create index if not exists idx_calibraciones_fecha_calibracion
on calibraciones(fecha_calibracion);

create index if not exists idx_calibraciones_estado_final
on calibraciones(estado_final);


-- ============================================================
-- 2. Refuerzo tabla calibracion_puntos
-- ============================================================

alter table calibracion_puntos
add column if not exists funcion text;

alter table calibracion_puntos
add column if not exists etiqueta text;

alter table calibracion_puntos
add column if not exists valor_referencia numeric;

alter table calibracion_puntos
add column if not exists incertidumbre_expandida numeric;

alter table calibracion_puntos
add column if not exists k numeric default 2;

alter table calibracion_puntos
add column if not exists decision text;

alter table calibracion_puntos
add column if not exists motivo_decision text;

alter table calibracion_puntos
add column if not exists patron_id uuid references patrones(id) on delete set null;

alter table calibracion_puntos
add column if not exists patron_codigo text;

alter table calibracion_puntos
add column if not exists datos_referencia jsonb default '{}'::jsonb;

alter table calibracion_puntos
add column if not exists datos_incertidumbre jsonb default '{}'::jsonb;

alter table calibracion_puntos
add column if not exists datos_decision jsonb default '{}'::jsonb;

create index if not exists idx_calibracion_puntos_calibracion_id
on calibracion_puntos(calibracion_id);

create index if not exists idx_calibracion_puntos_patron_id
on calibracion_puntos(patron_id);

create index if not exists idx_calibracion_puntos_decision
on calibracion_puntos(decision);


-- ============================================================
-- 3. Refuerzo tabla calibracion_lecturas
-- ============================================================

alter table calibracion_lecturas
add column if not exists funcion text;

alter table calibracion_lecturas
add column if not exists etiqueta_punto text;

alter table calibracion_lecturas
add column if not exists unidad text;

alter table calibracion_lecturas
add column if not exists registrado_por text;

alter table calibracion_lecturas
add column if not exists registrado_en timestamp without time zone default now();

alter table calibracion_lecturas
add column if not exists datos jsonb default '{}'::jsonb;

create index if not exists idx_calibracion_lecturas_punto_id
on calibracion_lecturas(punto_id);

create index if not exists idx_calibracion_lecturas_ordinal
on calibracion_lecturas(lectura_ordinal);


-- ============================================================
-- 4. Refuerzo tabla calibracion_patrones
-- ============================================================

alter table calibracion_patrones
add column if not exists funcion text;

alter table calibracion_patrones
add column if not exists punto_id uuid references calibracion_puntos(id) on delete set null;

alter table calibracion_patrones
add column if not exists patron_codigo text;

alter table calibracion_patrones
add column if not exists patron_descripcion text;

alter table calibracion_patrones
add column if not exists certificado_id uuid references patron_certificados(id) on delete set null;

alter table calibracion_patrones
add column if not exists certificado_numero text;

alter table calibracion_patrones
add column if not exists fecha_vencimiento date;

alter table calibracion_patrones
add column if not exists seleccionado_por text;

alter table calibracion_patrones
add column if not exists seleccionado_en timestamp without time zone default now();

alter table calibracion_patrones
add column if not exists datos_seleccion jsonb default '{}'::jsonb;

create index if not exists idx_calibracion_patrones_calibracion_id
on calibracion_patrones(calibracion_id);

create index if not exists idx_calibracion_patrones_patron_id
on calibracion_patrones(patron_id);

create index if not exists idx_calibracion_patrones_punto_id
on calibracion_patrones(punto_id);


-- ============================================================
-- 5. Refuerzo tabla certificados
-- ============================================================

alter table certificados
add column if not exists execution_id text;

alter table certificados
add column if not exists estado_final text;

alter table certificados
add column if not exists conforme boolean;

alter table certificados
add column if not exists generado_en timestamp without time zone default now();

alter table certificados
add column if not exists version_motor text;

create index if not exists idx_certificados_calibracion_id
on certificados(calibracion_id);

create index if not exists idx_certificados_execution_id
on certificados(execution_id);


-- ============================================================
-- 6. Vista resumen calibracion completa TMP
-- ============================================================

create or replace view v_tmp_calibracion_ejecucion_resumen as
select
  c.id as calibracion_id,
  c.execution_id,
  c.instrumento_id,
  i.codigo as instrumento_codigo,
  i.descripcion as instrumento_descripcion,
  i.familia as instrumento_familia,
  c.familia_equipo,
  c.procedimiento_codigo,
  c.norma_aplicada,
  c.fecha_calibracion,
  c.operador,
  c.resultado,
  c.estado_final,
  c.decision_global,
  c.conforme,
  c.regla_decision,
  c.certificado_url,
  count(cp.id) as total_puntos,
  count(cp.id) filter (where cp.decision = 'APTO') as puntos_aptos,
  count(cp.id) filter (where cp.decision = 'NO_APTO') as puntos_no_aptos,
  count(cp.id) filter (where cp.decision = 'INDETERMINADO') as puntos_indeterminados,
  count(cp.id) filter (where cp.decision = 'NO_EVALUABLE') as puntos_no_evaluables
from calibraciones c
left join instrumentos i on i.id = c.instrumento_id
left join calibracion_puntos cp on cp.calibracion_id = c.id
group by
  c.id,
  i.codigo,
  i.descripcion,
  i.familia;


-- ============================================================
-- 7. Vista detalle puntos con patrones
-- ============================================================

create or replace view v_tmp_calibracion_puntos_detalle as
select
  c.id as calibracion_id,
  c.execution_id,
  c.fecha_calibracion,
  i.codigo as instrumento_codigo,
  i.descripcion as instrumento_descripcion,
  cp.id as punto_id,
  cp.punto_ordinal,
  cp.funcion,
  cp.etiqueta,
  cp.nominal,
  cp.valor_referencia,
  cp.unidad,
  cp.media,
  cp.error,
  cp.incertidumbre_expandida,
  cp.k,
  cp.tolerancia_min,
  cp.tolerancia_max,
  cp.decision,
  cp.motivo_decision,
  cp.conforme,
  cp.patron_codigo,
  p.descripcion as patron_descripcion
from calibracion_puntos cp
left join calibraciones c on c.id = cp.calibracion_id
left join instrumentos i on i.id = c.instrumento_id
left join patrones p on p.id = cp.patron_id;


-- ============================================================
-- 8. Funcion opcional para comprobar estructura
-- ============================================================

create or replace view v_tmp_schema_check_calibracion as
select
  table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'calibraciones',
    'calibracion_puntos',
    'calibracion_lecturas',
    'calibracion_patrones',
    'certificados'
  )
order by table_name, ordinal_position;


-- ============================================================
-- 9. Consultas recomendadas tras ejecutar
-- ============================================================

-- select * from v_tmp_schema_check_calibracion;
-- select * from v_tmp_calibracion_ejecucion_resumen limit 10;
-- select * from v_tmp_calibracion_puntos_detalle limit 10;

-- ============================================================
-- FIN
-- ============================================================
