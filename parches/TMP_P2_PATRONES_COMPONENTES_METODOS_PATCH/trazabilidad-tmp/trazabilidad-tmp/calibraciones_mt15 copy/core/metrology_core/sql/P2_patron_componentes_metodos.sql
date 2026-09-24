-- P2 - Patrones reales TMP
-- Capa nueva compatible. NO modifica tablas existentes usadas por MT15/MT16.
-- Ejecutar en Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.patron_componentes (
  id uuid primary key default gen_random_uuid(),
  patron_id uuid not null references public.patrones(id) on delete cascade,
  codigo text,
  tipo_componente text not null,
  descripcion text,
  nominal numeric,
  valor_real numeric,
  correccion numeric,
  incertidumbre numeric,
  k numeric default 2,
  unidad text default 'mm',
  certificado text,
  fecha_calibracion date,
  fecha_proxima_calibracion date,
  estado text default 'VIGENTE',
  grado text,
  serie text,
  datos jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_patron_componentes_patron_id on public.patron_componentes(patron_id);
create index if not exists idx_patron_componentes_tipo on public.patron_componentes(tipo_componente);
create index if not exists idx_patron_componentes_nominal on public.patron_componentes(nominal);
create index if not exists idx_patron_componentes_estado on public.patron_componentes(estado);

create table if not exists public.patron_metodos (
  id uuid primary key default gen_random_uuid(),
  patron_id uuid not null references public.patrones(id) on delete cascade,
  metodo text not null,
  familia text,
  funcion text,
  prioridad integer default 100,
  rango_min numeric,
  rango_max numeric,
  unidad text default 'mm',
  requiere_componentes boolean default false,
  permite_combinacion boolean default false,
  estado text default 'ACTIVO',
  observaciones text,
  datos jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_patron_metodos_patron_id on public.patron_metodos(patron_id);
create index if not exists idx_patron_metodos_metodo on public.patron_metodos(metodo);
create index if not exists idx_patron_metodos_familia_funcion on public.patron_metodos(familia, funcion);
create index if not exists idx_patron_metodos_estado on public.patron_metodos(estado);

-- Vista de apoyo para que los motores consulten patrones/componentes sin afectar MT15/MT16.
create or replace view public.v_patrones_metrologia as
select
  p.id as patron_id,
  p.codigo,
  p.descripcion,
  p.estado,
  p.fecha_proxima_calibracion,
  p.certificado,
  pm.id as metodo_id,
  pm.metodo,
  pm.familia,
  pm.funcion,
  pm.prioridad,
  pm.rango_min,
  pm.rango_max,
  pm.requiere_componentes,
  pm.permite_combinacion,
  pc.id as componente_id,
  pc.tipo_componente,
  pc.codigo as componente_codigo,
  pc.descripcion as componente_descripcion,
  pc.nominal,
  pc.valor_real,
  pc.correccion,
  pc.incertidumbre,
  pc.unidad as componente_unidad,
  pc.estado as componente_estado,
  pc.fecha_proxima_calibracion as componente_fecha_proxima_calibracion
from public.patrones p
left join public.patron_metodos pm on pm.patron_id = p.id
left join public.patron_componentes pc on pc.patron_id = p.id;
