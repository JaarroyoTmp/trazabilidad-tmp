/* TMP MT16 - CHECK RAPIDO v_patron_valores_activos */

select *
from public.v_patron_valores_activos
limit 100;

select
  codigo,
  descripcion,
  fabricante,
  modelo,
  familia,
  tipo_patron,
  patron_id,
  certificado_id,
  numero_certificado,
  fecha_calibracion,
  fecha_vencimiento,
  estado,
  activo,
  unidad,
  nominal_num,
  correccion_num,
  incertidumbre_us_num,
  incertidumbre_num,
  source_rule
from public.v_patron_valores_activos
where
  codigo = '1288'
  or upper(coalesce(descripcion,'')) like '%TRIMOS%'
  or upper(coalesce(fabricante,'')) like '%TRIMOS%'
  or upper(coalesce(descripcion,'')) like '%RODIL%'
  or upper(coalesce(descripcion,'')) like '%HILO%'
  or upper(coalesce(descripcion,'')) like '%WIRE%'
  or upper(coalesce(descripcion,'')) like '%ROSCA%'
  or upper(coalesce(descripcion,'')) like '%PATRON%'
  or upper(coalesce(descripcion,'')) like '%PATRÓN%'
  or upper(coalesce(rango,'')) like '%M12%'
  or cast(nominal_num as text) like '%0.895%'
order by codigo, nominal_num
limit 200;
