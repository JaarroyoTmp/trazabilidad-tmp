create table public.calibraciones_mt17 (
  id uuid primary key,
  instrumento_id uuid not null references public.instrumentos(id),
  creado_por uuid not null default auth.uid() references auth.users(id),
  creado_en timestamptz not null default now(),
  fecha date not null,
  resultado text not null check (resultado in ('APTO', 'NO APTO')),
  equipo_snapshot jsonb not null,
  datos jsonb not null,
  check (nullif(trim(equipo_snapshot->>'codigo'), '') is not null),
  check (nullif(trim(datos->>'operario'), '') is not null),
  check (nullif(trim(datos #>> '{criterio,document}'), '') is not null),
  check (datos #>> '{evaluacion,resultado}' is not distinct from resultado)
);

alter table public.calibraciones_mt17 enable row level security;
revoke all on public.calibraciones_mt17 from public, anon, authenticated;
grant select on public.calibraciones_mt17 to authenticated;
grant insert (id, instrumento_id, fecha, resultado, equipo_snapshot, datos)
  on public.calibraciones_mt17 to authenticated;

create policy mt17_registrar on public.calibraciones_mt17
  for insert to authenticated with check ((select auth.uid()) = creado_por);

-- Same designated Quality account that sees all reports in the MT16 register.
create policy mt17_consultar on public.calibraciones_mt17
  for select to authenticated using (
    (select auth.uid()) = creado_por
    or (select auth.uid()) = '68395826-1ec1-4412-ba8d-76b6376b5af1'::uuid
  );

create index calibraciones_mt17_fecha_idx on public.calibraciones_mt17 (fecha desc, id);
create index calibraciones_mt17_creado_por_idx on public.calibraciones_mt17 (creado_por);
