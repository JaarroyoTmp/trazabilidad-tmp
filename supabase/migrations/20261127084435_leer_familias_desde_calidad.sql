-- Alta / Edición uses the same client before and after Calidad signs in.
create policy familias_instrumentos_catalogo_autenticado
  on public.familias_instrumentos for select to authenticated using (true);

create policy familias_calibracion_catalogo_activo
  on public.familias_calibracion for select to anon, authenticated using (activo is true);
