-- Nota individual de cada morador para um imóvel (1 a 5), para comparar lado
-- a lado quem gostou de qual opção.
create table public.property_ratings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  household_member_id uuid not null references public.household_members(id) on delete cascade,
  score smallint not null,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint property_ratings_score_check check (score between 1 and 5),
  -- um morador só tem uma nota por imóvel (upsert na aplicação)
  constraint property_ratings_property_member_key unique (property_id, household_member_id)
);

comment on table public.property_ratings is 'Nota (1-5) de cada morador para um imóvel candidato.';

-- unique index acima já cobre buscas por property_id isolado (coluna líder);
-- indexamos household_member_id separadamente por ser FK com on delete cascade.
create index property_ratings_household_member_id_idx
  on public.property_ratings (household_member_id);

create trigger property_ratings_set_updated_at
  before update on public.property_ratings
  for each row
  execute function public.set_updated_at();

alter table public.property_ratings enable row level security;

create policy property_ratings_select on public.property_ratings
  for select
  using (
    property_id in (
      select id from public.properties
      where household_id in (select public.my_household_ids())
    )
  );

-- Só posso criar/editar/apagar a MINHA própria nota (household_member_id
-- precisa ser um dos meus), nunca a nota do outro morador.
create policy property_ratings_insert on public.property_ratings
  for insert
  with check (
    household_member_id in (select public.my_member_ids())
    and property_id in (
      select id from public.properties
      where household_id in (select public.my_household_ids())
    )
  );

create policy property_ratings_update on public.property_ratings
  for update
  using (household_member_id in (select public.my_member_ids()))
  with check (household_member_id in (select public.my_member_ids()));

create policy property_ratings_delete on public.property_ratings
  for delete
  using (household_member_id in (select public.my_member_ids()));
