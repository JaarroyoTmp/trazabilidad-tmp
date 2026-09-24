-- MC-01 v6 · Modelo metrológico dinámico por nominal
-- Aditivo: no elimina tablas ni datos existentes.

begin;

create table if not exists public.mc_patron_modelos_resolucion (
  id uuid primary key default gen_random_uuid(),
  patron_id uuid not null references public.mc_patrones(id) on delete cascade,
  certificado_id uuid references public.mc_patron_certificados(id) on delete set null,

  codigo_modelo text not null,
  nombre_modelo text not null,
  tipo_modelo text not null check (tipo_modelo in (
    'DISCRETO_EXACTO',
    'DISCRETO_COMBINACION',
    'PUNTOS_CERTIFICADOS',
    'TRAMOS',
    'ECUACION',
    'REVISION_TECNICA'
  )),

  funcion_medicion text,
  orientacion text,
  ensayo text,
  unidad text default 'mm',
  rango_min numeric,
  rango_max numeric,

  regla_punto text default 'EXACTO' check (regla_punto in (
    'EXACTO',
    'MAS_CERCANO',
    'CONSERVADOR_SUPERIOR',
    'CONSERVADOR_MAXIMO',
    'INTERPOLACION_LINEAL',
    'SIN_RESOLUCION_AUTOMATICA'
  )),

  permite_combinacion boolean default false,
  permite_interpolacion boolean default false,
  tolerancia_busqueda numeric default 0.0005,

  ecuacion_correccion text,
  ecuacion_incertidumbre text,
  incertidumbre_fija numeric,
  factor_k numeric default 2,

  prioridad integer default 10,
  estado text default 'ACTIVO',
  aprobado_por text,
  fecha_aprobacion date,
  observaciones text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique (patron_id, codigo_modelo)
);

create index if not exists idx_mc_modelos_patron
  on public.mc_patron_modelos_resolucion(patron_id, estado, prioridad);

create table if not exists public.mc_patron_tramos (
  id uuid primary key default gen_random_uuid(),
  modelo_id uuid not null references public.mc_patron_modelos_resolucion(id) on delete cascade,
  desde numeric not null,
  hasta numeric not null,
  correccion numeric,
  incertidumbre numeric,
  factor_k numeric default 2,
  unidad text default 'mm',
  orden integer default 10,
  observaciones text,
  created_at timestamptz default now(),
  check (hasta >= desde)
);

create index if not exists idx_mc_tramos_modelo_rango
  on public.mc_patron_tramos(modelo_id, desde, hasta);

create table if not exists public.mc_patron_resoluciones_uso (
  id uuid primary key default gen_random_uuid(),
  patron_id uuid not null references public.mc_patrones(id) on delete restrict,
  certificado_id uuid references public.mc_patron_certificados(id) on delete restrict,
  modelo_id uuid references public.mc_patron_modelos_resolucion(id) on delete restrict,
  calibracion_id uuid,
  modulo text,
  punto_codigo text,
  nominal_solicitado numeric not null,
  nominal_resuelto numeric,
  valor_patron numeric,
  correccion numeric,
  incertidumbre_expandida numeric,
  factor_k numeric,
  unidad text,
  metodo_resolucion text,
  fuente_datos text,
  elementos jsonb default '[]'::jsonb,
  advertencias jsonb default '[]'::jsonb,
  operador text,
  fecha_uso timestamptz default now()
);

create index if not exists idx_mc_resoluciones_calibracion
  on public.mc_patron_resoluciones_uso(calibracion_id, patron_id);

alter table public.mc_patron_modelos_resolucion enable row level security;
alter table public.mc_patron_tramos enable row level security;
alter table public.mc_patron_resoluciones_uso enable row level security;

drop policy if exists "mc_modelos_all" on public.mc_patron_modelos_resolucion;
create policy "mc_modelos_all" on public.mc_patron_modelos_resolucion
for all to anon, authenticated using (true) with check (true);

drop policy if exists "mc_tramos_all" on public.mc_patron_tramos;
create policy "mc_tramos_all" on public.mc_patron_tramos
for all to anon, authenticated using (true) with check (true);

drop policy if exists "mc_resoluciones_all" on public.mc_patron_resoluciones_uso;
create policy "mc_resoluciones_all" on public.mc_patron_resoluciones_uso
for all to anon, authenticated using (true) with check (true);

-- Juego de bloques 180456: resolución exacta y combinación autorizada.
insert into public.mc_patron_modelos_resolucion (
  patron_id, certificado_id, codigo_modelo, nombre_modelo, tipo_modelo,
  funcion_medicion, unidad, rango_min, rango_max, regla_punto,
  permite_combinacion, tolerancia_busqueda, prioridad, estado, observaciones
)
select
  p.id,
  c.id,
  'BLOQUES_EXACTOS_Y_COMBINACION',
  'Elementos certificados y combinaciones de bloques patrón',
  'DISCRETO_COMBINACION',
  'Longitud',
  'mm',
  min(pc.nominal),
  sum(pc.nominal),
  'EXACTO',
  true,
  0.0005,
  1,
  'ACTIVO',
  'Coincidencia exacta o combinación de elementos certificados. La corrección total es la suma de correcciones; U se combina por raíz de suma de cuadrados.'
from public.mc_patrones p
join public.mc_patron_componentes pc on pc.patron_id=p.id and pc.estado='ACTIVO'
left join public.mc_patron_certificados c on c.patron_id=p.id and c.vigente=true
where p.codigo='180456'
group by p.id,c.id
on conflict (patron_id,codigo_modelo) do update set
  certificado_id=excluded.certificado_id,
  rango_min=excluded.rango_min,
  rango_max=excluded.rango_max,
  updated_at=now();

-- CMM: queda preparada, pero deliberadamente en revisión técnica.
insert into public.mc_patron_modelos_resolucion (
  patron_id, certificado_id, codigo_modelo, nombre_modelo, tipo_modelo,
  funcion_medicion, unidad, rango_min, rango_max, regla_punto,
  permite_combinacion, permite_interpolacion, prioridad, estado, observaciones
)
select
  p.id,
  c.id,
  'CMM_RESULTADOS_CERTIFICADO',
  'Resultados E0/E150 del certificado',
  'REVISION_TECNICA',
  'Longitud y geometría',
  'mm',
  min(r.nominal),
  max(r.nominal),
  'SIN_RESOLUCION_AUTOMATICA',
  false,
  false,
  20,
  'ACTIVO',
  'Los resultados del certificado están disponibles, pero no se aplican automáticamente como corrección de uso hasta aprobar orientación, ensayo y regla conservadora/interpolación.'
from public.mc_patrones p
join public.mc_patron_certificados c on c.patron_id=p.id and c.vigente=true
join public.mc_patron_resultados_certificado r on r.patron_id=p.id and r.certificado_id=c.id
where p.codigo in ('CMM-EVO-GLCI000975IA','CMM-GLOBALF-GLOF000030')
group by p.id,c.id
on conflict (patron_id,codigo_modelo) do update set
  certificado_id=excluded.certificado_id,
  rango_min=excluded.rango_min,
  rango_max=excluded.rango_max,
  updated_at=now();

-- Banco Trimos: preparado como revisión técnica hasta cargar su curva/puntos reales.
insert into public.mc_patron_modelos_resolucion (
  patron_id, codigo_modelo, nombre_modelo, tipo_modelo,
  funcion_medicion, unidad, regla_punto, permite_interpolacion,
  prioridad, estado, observaciones
)
select
  p.id,
  'TRIMOS_CURVA_PENDIENTE',
  'Curva metrológica por nominal del banco Trimos',
  'REVISION_TECNICA',
  'Longitud',
  'mm',
  'SIN_RESOLUCION_AUTOMATICA',
  false,
  5,
  'ACTIVO',
  'Cargar puntos, tramos o ecuación del certificado antes de permitir resolución automática.'
from public.mc_patrones p
where p.codigo='1288'
on conflict (patron_id,codigo_modelo) do nothing;

create or replace view public.vw_mc_patrones_modelo as
select
  p.id as patron_id,
  p.codigo,
  p.descripcion,
  p.estado as patron_estado,
  p.activo,
  p.fecha_proxima_calibracion,
  m.id as modelo_id,
  m.codigo_modelo,
  m.nombre_modelo,
  m.tipo_modelo,
  m.funcion_medicion,
  m.orientacion,
  m.ensayo,
  m.rango_min,
  m.rango_max,
  m.unidad,
  m.regla_punto,
  m.permite_combinacion,
  m.permite_interpolacion,
  m.estado as modelo_estado,
  m.prioridad,
  m.observaciones
from public.mc_patrones p
left join public.mc_patron_modelos_resolucion m on m.patron_id=p.id;

commit;

select codigo, codigo_modelo, tipo_modelo, regla_punto, rango_min, rango_max
from public.vw_mc_patrones_modelo
where codigo in ('180456','1288','CMM-EVO-GLCI000975IA','CMM-GLOBALF-GLOF000030')
order by codigo, prioridad;
