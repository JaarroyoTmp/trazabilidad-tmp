-- MC-01 v7 · Catálogo controlado de combinaciones físicas
-- Aditivo: no elimina tablas ni datos existentes.

begin;

create table if not exists public.mc_patron_combinaciones (
  id uuid primary key default gen_random_uuid(),
  patron_id uuid not null references public.mc_patrones(id) on delete cascade,
  certificado_id uuid references public.mc_patron_certificados(id) on delete cascade,
  modelo_id uuid references public.mc_patron_modelos_resolucion(id) on delete cascade,

  nominal_objetivo numeric not null,
  valor_certificado_total numeric,
  correccion_total numeric,
  incertidumbre_expandida numeric,
  factor_k numeric default 2,
  numero_elementos integer not null,
  elementos jsonb not null default '[]'::jsonb,
  ranking integer not null default 1,
  estado text not null default 'ACTIVO',
  calculado_en timestamptz not null default now(),

  check (nominal_objetivo > 0),
  check (numero_elementos > 0),
  check (ranking > 0)
);

create index if not exists idx_mc_combinaciones_patron_nominal
  on public.mc_patron_combinaciones(patron_id, nominal_objetivo, ranking);

create index if not exists idx_mc_combinaciones_certificado
  on public.mc_patron_combinaciones(certificado_id, estado);

alter table public.mc_patron_combinaciones enable row level security;

drop policy if exists "mc_patron_combinaciones_all" on public.mc_patron_combinaciones;
create policy "mc_patron_combinaciones_all"
on public.mc_patron_combinaciones
for all to anon, authenticated
using (true)
with check (true);

-- Configuración práctica del juego 180456.
alter table public.mc_patron_modelos_resolucion
  add column if not exists max_elementos_combinacion integer default 6,
  add column if not exists max_alternativas_nominal integer default 5,
  add column if not exists resolucion_catalogo numeric default 0.001;

update public.mc_patron_modelos_resolucion
set max_elementos_combinacion = 6,
    max_alternativas_nominal = 5,
    resolucion_catalogo = 0.001,
    observaciones = concat_ws(' | ', observaciones,
      'Catálogo de nominales disponibles: prioriza menor número de elementos, menor U y menor corrección absoluta. No reutiliza un mismo elemento físico.')
where patron_id = (select id from public.mc_patrones where codigo='180456')
  and codigo_modelo='BLOQUES_EXACTOS_Y_COMBINACION';

commit;

select p.codigo, m.codigo_modelo, m.max_elementos_combinacion,
       m.max_alternativas_nominal, m.resolucion_catalogo
from public.mc_patrones p
join public.mc_patron_modelos_resolucion m on m.patron_id=p.id
where p.codigo='180456';
