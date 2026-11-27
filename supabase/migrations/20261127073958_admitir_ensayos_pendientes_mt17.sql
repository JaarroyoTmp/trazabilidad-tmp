alter table public.calibraciones_mt17
  drop constraint calibraciones_mt17_resultado_check,
  drop constraint calibraciones_mt17_datos_check1,
  drop constraint calibraciones_mt17_check,
  add constraint calibraciones_mt17_resultado_check
    check (resultado in ('APTO', 'NO APTO', 'PENDIENTE')),
  add constraint calibraciones_mt17_dictamen_check check (
    case when resultado = 'PENDIENTE' then
      datos #>> '{evaluacion,resultado}' is null and
      coalesce(jsonb_array_length(datos->'pendientes'), 0) > 0 and
      coalesce(jsonb_array_length(datos #> '{recorrido,0}'), 0) = 11 and
      coalesce(jsonb_array_length(datos #> '{recorrido,1}'), 0) = 11 and
      coalesce(jsonb_array_length(datos #> '{repetibilidad,0}'), 0) = 6 and
      coalesce(jsonb_array_length(datos #> '{repetibilidad,1}'), 0) = 6
    else
      nullif(trim(datos #>> '{criterio,document}'), '') is not null and
      datos #>> '{evaluacion,resultado}' is not distinct from resultado
    end
  );
