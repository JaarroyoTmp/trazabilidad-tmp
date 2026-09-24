-- MC-01 v5 - Migracion prudente desde public.patrones hacia public.mc_patrones
-- No borra datos. No toca MT15/MT16/MT17. Inserta solo patrones que no existan en mc_patrones.

begin;

insert into public.mc_patrones (
  codigo,
  descripcion,
  familia,
  tipo_patron,
  magnitud,
  unidad,
  fabricante,
  modelo,
  numero_serie,
  ubicacion,
  estado,
  activo,
  frecuencia_calibracion_meses,
  fecha_ultima_calibracion,
  fecha_proxima_calibracion,
  requiere_calibracion_externa,
  laboratorio_preferente,
  observaciones
)
select
  coalesce(nullif(trim(p.codigo), ''), 'PATRON-' || p.id::text) as codigo,
  coalesce(nullif(trim(p.descripcion), ''), nullif(trim(p.nombre), ''), 'Patron sin descripcion') as descripcion,
  case
    when lower(coalesce(p.familia,'') || ' ' || coalesce(p.tipo_patron,'') || ' ' || coalesce(p.descripcion,'') || ' ' || coalesce(p.nombre,'')) like any(array['%bloque%','%cala%','%johansson%']) then 'Longitud'
    when lower(coalesce(p.familia,'') || ' ' || coalesce(p.tipo_patron,'') || ' ' || coalesce(p.descripcion,'') || ' ' || coalesce(p.nombre,'')) like any(array['%anillo%']) then 'Longitud'
    when lower(coalesce(p.familia,'') || ' ' || coalesce(p.tipo_patron,'') || ' ' || coalesce(p.descripcion,'') || ' ' || coalesce(p.nombre,'')) like any(array['%trimos%','%banco%','%telma%']) then 'Longitud'
    when lower(coalesce(p.familia,'') || ' ' || coalesce(p.tipo_patron,'') || ' ' || coalesce(p.descripcion,'') || ' ' || coalesce(p.nombre,'')) like any(array['%dureza%','%brinell%','%rockwell%','%hrc%','%hbw%']) then 'Dureza'
    when lower(coalesce(p.familia,'') || ' ' || coalesce(p.tipo_patron,'') || ' ' || coalesce(p.descripcion,'') || ' ' || coalesce(p.nombre,'')) like any(array['%pesa%','%masa%','%balanza%']) then 'Masa'
    else coalesce(nullif(trim(p.familia), ''), 'Sin clasificar')
  end as familia,
  coalesce(nullif(trim(p.tipo_patron), ''),
    case
      when lower(coalesce(p.descripcion,'') || ' ' || coalesce(p.nombre,'')) like any(array['%bloque%','%cala%','%johansson%']) then 'Juego de bloques patron'
      when lower(coalesce(p.descripcion,'') || ' ' || coalesce(p.nombre,'')) like any(array['%anillo%']) then 'Anillo patron'
      when lower(coalesce(p.descripcion,'') || ' ' || coalesce(p.nombre,'')) like any(array['%trimos%','%banco%','%telma%']) then 'Banco patron'
      else 'Patron'
    end
  ) as tipo_patron,
  coalesce(nullif(trim(p.magnitud), ''),
    case
      when lower(coalesce(p.descripcion,'') || ' ' || coalesce(p.nombre,'') || ' ' || coalesce(p.familia,'')) like any(array['%dureza%','%brinell%','%rockwell%','%hrc%','%hbw%']) then 'Dureza'
      when lower(coalesce(p.descripcion,'') || ' ' || coalesce(p.nombre,'') || ' ' || coalesce(p.familia,'')) like any(array['%pesa%','%masa%']) then 'Masa'
      else 'Longitud'
    end
  ) as magnitud,
  coalesce(nullif(trim(p.unidad), ''), 'mm') as unidad,
  p.fabricante,
  p.modelo,
  p.numero_serie,
  'Laboratorio' as ubicacion,
  case when coalesce(p.activo, true) then 'ACTIVO' else 'BAJA' end as estado,
  coalesce(p.activo, true) as activo,
  24 as frecuencia_calibracion_meses,
  p.fecha_ultima_cal,
  p.fecha_proxima_cal,
  true,
  coalesce(nullif(trim(p.laboratorio), ''), nullif(trim(p.trazabilidad), '')),
  concat_ws(' | ', 'Migrado desde tabla public.patrones', p.observaciones, p.certificado_url)
from public.patrones p
where not exists (
  select 1 from public.mc_patrones mp where mp.codigo = coalesce(nullif(trim(p.codigo), ''), 'PATRON-' || p.id::text)
);

-- Certificado basico desde la tabla clasica cuando exista informacion suficiente.
insert into public.mc_patron_certificados (
  patron_id,
  numero_certificado,
  laboratorio,
  fecha_calibracion,
  fecha_proxima_calibracion,
  url_pdf,
  trazabilidad,
  observaciones,
  vigente
)
select
  mp.id,
  coalesce(nullif(trim(p.certificado_url), ''), 'CERTIFICADO-PENDIENTE-' || mp.codigo),
  coalesce(nullif(trim(p.laboratorio), ''), 'Pendiente'),
  p.fecha_ultima_cal,
  p.fecha_proxima_cal,
  p.certificado_url,
  p.trazabilidad,
  'Certificado creado automaticamente durante migracion MC-01 v5. Revisar datos.',
  true
from public.patrones p
join public.mc_patrones mp on mp.codigo = coalesce(nullif(trim(p.codigo), ''), 'PATRON-' || p.id::text)
where not exists (
  select 1 from public.mc_patron_certificados c where c.patron_id = mp.id
)
and (p.certificado_url is not null or p.fecha_ultima_cal is not null or p.fecha_proxima_cal is not null);

commit;
