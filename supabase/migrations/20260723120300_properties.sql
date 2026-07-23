create table public.properties (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  address text,
  listing_url text,
  rent_price numeric(10, 2),
  condo_fee numeric(10, 2),
  iptu numeric(10, 2),
  total_monthly_cost numeric(10, 2)
    generated always as (
      coalesce(rent_price, 0) + coalesce(condo_fee, 0) + coalesce(iptu, 0)
    ) stored,
  distance_work_km numeric(6, 2),
  distance_market_km numeric(6, 2),
  status text not null default 'candidato',
  notes text,
  created_by uuid references public.household_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint properties_status_check
    check (status in ('candidato', 'visitado', 'descartado', 'escolhido'))
);

comment on table public.properties is 'Imóveis cadastrados para comparação por uma casa.';
comment on column public.properties.total_monthly_cost is 'Coluna gerada: aluguel + condomínio + IPTU, usada para ordenar o comparador por custo total.';

create index properties_household_id_idx on public.properties (household_id);
create index properties_household_status_idx on public.properties (household_id, status);
-- Suporta "ordenar comparador por custo total" sem sort em memória.
create index properties_household_total_cost_idx on public.properties (household_id, total_monthly_cost);
create index properties_created_by_idx on public.properties (created_by) where created_by is not null;

create trigger properties_set_updated_at
  before update on public.properties
  for each row
  execute function public.set_updated_at();

alter table public.properties enable row level security;

create policy properties_select on public.properties
  for select
  using (household_id in (select public.my_household_ids()));

create policy properties_insert on public.properties
  for insert
  with check (household_id in (select public.my_household_ids()));

create policy properties_update on public.properties
  for update
  using (household_id in (select public.my_household_ids()))
  with check (household_id in (select public.my_household_ids()));

create policy properties_delete on public.properties
  for delete
  using (household_id in (select public.my_household_ids()));
