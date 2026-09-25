-- MC-01 v8 · Ciclo de vida, versionado metrológico y actualización externa
-- Migración aditiva. No elimina ni sobrescribe históricos existentes.

begin;

alter table public.mc_patrones
  add column if not exists estado_metrologico text default 'PENDIENTE_CONFIGURACION',
  add column if not exists fecha_ultima_calibracion date,
  add column if not exists fecha_proxima_calibracion date,
  add column if not exists frecuencia_calibracion_meses integer default 12,
  add column if not exists bloqueado_motivo text,
  add column if not exists version_metrologica_vigente_id uuid,
  add column if not exists updated_at timestamptz default now();

create table if not exists public.mc_patron_versiones_metrologicas (
  id uuid primary key default gen_random_uuid(),
  patron_id uuid not null references public.mc_patrones(id) on delete cascade,
  numero_version integer not null,
  certificado_id uuid references public.mc_patron_certificados(id) on delete set null,
  modelo_codigo text,
  estado_aprobacion text not null default 'BORRADOR' check (estado_aprobacion in (
    'BORRADOR','PENDIENTE_REVISION','APROBADA','RECHAZADA','HISTORICA'
  )),
  resultado_calibracion text not null default 'PENDIENTE' check (resultado_calibracion in (
    'PENDIENTE','CONFORME','NO_CONFORME','NO_DECLARADO'
  )),
  fecha_calibracion date,
  fecha_emision date,
  fecha_desde date,
  fecha_hasta date,
  fecha_proxima_calibracion date,
  laboratorio text,
  acreditacion text,
  numero_certificado text,
  norma_aplicada text,
  procedimiento_aplicado text,
  factor_k numeric default 2,
  condiciones_ambientales jsonb default '{}'::jsonb,
  trazabilidad jsonb default '{}'::jsonb,
  resumen_metrologico jsonb default '{}'::jsonb,
  observaciones text,
  creado_por text,
  revisado_por text,
  aprobado_por text,
  created_at timestamptz not null default now(),
  revisado_at timestamptz,
  aprobado_at timestamptz,
  unique (patron_id, numero_version)
);

create index if not exists idx_mc_versiones_patron_estado
  on public.mc_patron_versiones_metrologicas(patron_id, estado_aprobacion, fecha_desde desc);

create table if not exists public.mc_patron_resultados_version (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.mc_patron_versiones_metrologicas(id) on delete cascade,
  patron_id uuid not null references public.mc_patrones(id) on delete cascade,
  componente_id uuid references public.mc_patron_componentes(id) on delete set null,
  codigo_punto text,
  tipo_resultado text not null default 'PUNTO',
  nominal numeric,
  unidad text default 'mm',
  valor_certificado numeric,
  correccion numeric,
  incertidumbre_expandida numeric,
  factor_k numeric default 2,
  incertidumbre_estandar numeric,
  desde numeric,
  hasta numeric,
  posicion text,
  ensayo text,
  resultado text,
  datos_extra jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_mc_resultados_version_nominal
  on public.mc_patron_resultados_version(version_id, nominal, tipo_resultado);

create table if not exists public.mc_patron_importaciones (
  id uuid primary key default gen_random_uuid(),
  patron_id uuid not null references public.mc_patrones(id) on delete cascade,
  version_id uuid references public.mc_patron_versiones_metrologicas(id) on delete set null,
  tipo_archivo text,
  nombre_archivo text,
  storage_path text,
  hash_archivo text,
  estado text not null default 'SUBIDO' check (estado in (
    'SUBIDO','EXTRAIDO','PENDIENTE_REVISION','APLICADO','RECHAZADO','ERROR'
  )),
  datos_extraidos jsonb default '{}'::jsonb,
  advertencias jsonb default '[]'::jsonb,
  error_detalle text,
  subido_por text,
  revisado_por text,
  created_at timestamptz not null default now(),
  revisado_at timestamptz
);

create table if not exists public.mc_patron_auditoria (
  id bigint generated always as identity primary key,
  patron_id uuid references public.mc_patrones(id) on delete set null,
  version_id uuid references public.mc_patron_versiones_metrologicas(id) on delete set null,
  accion text not null,
  entidad text,
  entidad_id text,
  datos_anteriores jsonb,
  datos_nuevos jsonb,
  motivo text,
  usuario text,
  created_at timestamptz not null default now()
);

create index if not exists idx_mc_auditoria_patron_fecha
  on public.mc_patron_auditoria(patron_id, created_at desc);

-- Relación opcional entre certificado y versión metrológica.
alter table public.mc_patron_certificados
  add column if not exists version_metrologica_id uuid references public.mc_patron_versiones_metrologicas(id) on delete set null,
  add column if not exists resultado_calibracion text default 'NO_DECLARADO',
  add column if not exists archivo_path text,
  add column if not exists aprobado_por text,
  add column if not exists aprobado_at timestamptz;

-- FK diferida para la versión vigente del patrón.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'mc_patrones_version_vigente_fk'
  ) then
    alter table public.mc_patrones
      add constraint mc_patrones_version_vigente_fk
      foreign key (version_metrologica_vigente_id)
      references public.mc_patron_versiones_metrologicas(id)
      on delete set null;
  end if;
end $$;

-- Estados iniciales conservadores a partir del histórico existente.
update public.mc_patrones
set estado_metrologico = case
  when coalesce(activo,false)=false or estado='BAJA' then 'BAJA'
  when fecha_proxima_calibracion is not null and fecha_proxima_calibracion < current_date then 'CADUCADO'
  when fecha_proxima_calibracion is not null and fecha_proxima_calibracion <= current_date + 30 then 'PROXIMO_A_VENCER'
  else 'VIGENTE'
end
where estado_metrologico is null or estado_metrologico='PENDIENTE_CONFIGURACION';

-- RLS coherente con el resto del prototipo actual.
alter table public.mc_patron_versiones_metrologicas enable row level security;
alter table public.mc_patron_resultados_version enable row level security;
alter table public.mc_patron_importaciones enable row level security;
alter table public.mc_patron_auditoria enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array['mc_patron_versiones_metrologicas','mc_patron_resultados_version','mc_patron_importaciones','mc_patron_auditoria'] loop
    execute format('drop policy if exists %I on public.%I', tbl || '_all', tbl);
    execute format('create policy %I on public.%I for all to anon, authenticated using (true) with check (true)', tbl || '_all', tbl);
  end loop;
end $$;

-- Bucket privado para certificados. La aplicación usa URL firmada para consulta.
insert into storage.buckets (id, name, public)
values ('mc-patron-certificados','mc-patron-certificados',false)
on conflict (id) do nothing;

drop policy if exists "mc_patron_certificados_select" on storage.objects;
create policy "mc_patron_certificados_select" on storage.objects
for select to anon, authenticated
using (bucket_id='mc-patron-certificados');

drop policy if exists "mc_patron_certificados_insert" on storage.objects;
create policy "mc_patron_certificados_insert" on storage.objects
for insert to anon, authenticated
with check (bucket_id='mc-patron-certificados');

drop policy if exists "mc_patron_certificados_update" on storage.objects;
create policy "mc_patron_certificados_update" on storage.objects
for update to anon, authenticated
using (bucket_id='mc-patron-certificados')
with check (bucket_id='mc-patron-certificados');

create or replace view public.vw_mc_patrones_ciclo_vida as
select
  p.id,
  p.codigo,
  p.descripcion,
  p.estado_metrologico,
  p.fecha_ultima_calibracion,
  p.fecha_proxima_calibracion,
  p.frecuencia_calibracion_meses,
  p.version_metrologica_vigente_id,
  v.numero_version,
  v.numero_certificado,
  v.resultado_calibracion,
  v.estado_aprobacion,
  v.fecha_desde,
  v.fecha_hasta,
  v.laboratorio,
  v.aprobado_por,
  v.aprobado_at
from public.mc_patrones p
left join public.mc_patron_versiones_metrologicas v
  on v.id=p.version_metrologica_vigente_id;

commit;
