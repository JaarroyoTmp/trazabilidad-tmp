select 'mc_patrones' as tabla, count(*) from public.mc_patrones
union all select 'mc_patron_certificados', count(*) from public.mc_patron_certificados
union all select 'mc_patron_componentes', count(*) from public.mc_patron_componentes
union all select 'mc_patron_metodos', count(*) from public.mc_patron_metodos
union all select 'mc_patron_uso_historial', count(*) from public.mc_patron_uso_historial;

select codigo, descripcion, familia, tipo_patron, estado, fecha_proxima_calibracion
from public.mc_patrones
order by codigo
limit 100;
