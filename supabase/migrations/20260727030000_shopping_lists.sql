-- Listas de compras totalmente customizáveis (ex: "Pré mudança", "Cozinha",
-- "Decoração") — o morador cria quantas quiser, sem categoria fixa.
create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  created_by uuid references public.household_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.shopping_lists is 'Grupos de compras criados livremente por uma casa (ex: Pré mudança, Cozinha).';

create index shopping_lists_household_id_idx on public.shopping_lists (household_id);

create trigger shopping_lists_set_updated_at
  before update on public.shopping_lists
  for each row
  execute function public.set_updated_at();

alter table public.shopping_lists enable row level security;

create policy shopping_lists_select on public.shopping_lists
  for select
  using (household_id in (select public.my_household_ids()));

create policy shopping_lists_insert on public.shopping_lists
  for insert
  with check (household_id in (select public.my_household_ids()));

create policy shopping_lists_update on public.shopping_lists
  for update
  using (household_id in (select public.my_household_ids()))
  with check (household_id in (select public.my_household_ids()));

create policy shopping_lists_delete on public.shopping_lists
  for delete
  using (household_id in (select public.my_household_ids()));

-- Itens de uma lista de compras.
create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  title text not null,
  description text,
  price numeric(10, 2),
  link text,
  images text[] not null default '{}',
  priority text not null default 'desejavel',
  assigned_to uuid references public.household_members(id) on delete set null,
  purchased boolean not null default false,
  purchased_at timestamptz,
  purchased_by uuid references public.household_members(id) on delete set null,
  position integer not null default 0,
  created_by uuid references public.household_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shopping_items_priority_check
    check (priority in ('essencial', 'desejavel')),
  constraint shopping_items_purchased_consistency
    check (
      (purchased = false and purchased_at is null)
      or (purchased = true and purchased_at is not null)
    )
);

comment on table public.shopping_items is 'Itens de uma lista de compras — preço, link, foto, quem vai comprar.';
comment on column public.shopping_items.images is 'Paths no bucket "ShoppingItems" (não URLs — resolvidas via signed URL em runtime, igual properties.images).';

create index shopping_items_list_id_idx on public.shopping_items (list_id);
create index shopping_items_list_position_idx on public.shopping_items (list_id, position);
create index shopping_items_assigned_to_idx on public.shopping_items (assigned_to) where assigned_to is not null;

-- Evita duas criações simultâneas colidirem na mesma posição (mesma
-- estratégia do checklist_items: select(max)+insert com retry na app).
alter table public.shopping_items
  add constraint shopping_items_list_position_key
  unique (list_id, position);

create trigger shopping_items_set_updated_at
  before update on public.shopping_items
  for each row
  execute function public.set_updated_at();

alter table public.shopping_items enable row level security;

create policy shopping_items_select on public.shopping_items
  for select
  using (
    list_id in (
      select id from public.shopping_lists
      where household_id in (select public.my_household_ids())
    )
  );

create policy shopping_items_insert on public.shopping_items
  for insert
  with check (
    list_id in (
      select id from public.shopping_lists
      where household_id in (select public.my_household_ids())
    )
  );

create policy shopping_items_update on public.shopping_items
  for update
  using (
    list_id in (
      select id from public.shopping_lists
      where household_id in (select public.my_household_ids())
    )
  )
  with check (
    list_id in (
      select id from public.shopping_lists
      where household_id in (select public.my_household_ids())
    )
  );

create policy shopping_items_delete on public.shopping_items
  for delete
  using (
    list_id in (
      select id from public.shopping_lists
      where household_id in (select public.my_household_ids())
    )
  );

-- Bucket próprio (privado, servido via signed URL — mesmo padrão de "Propertys").
insert into storage.buckets (id, name, public)
values ('ShoppingItems', 'ShoppingItems', false)
on conflict (id) do nothing;

drop policy if exists "ShoppingItems read" on storage.objects;
create policy "ShoppingItems read"
  on storage.objects for select
  using (bucket_id = 'ShoppingItems' and auth.role() = 'authenticated');

drop policy if exists "ShoppingItems insert" on storage.objects;
create policy "ShoppingItems insert"
  on storage.objects for insert
  with check (bucket_id = 'ShoppingItems' and auth.role() = 'authenticated');

drop policy if exists "ShoppingItems delete" on storage.objects;
create policy "ShoppingItems delete"
  on storage.objects for delete
  using (bucket_id = 'ShoppingItems' and auth.role() = 'authenticated');

-- Realtime pros dois moradores verem mudanças ao vivo, mesmo padrão das
-- outras tabelas (ver 20260727020000_realtime_publication.sql).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'shopping_lists'
  ) then
    alter publication supabase_realtime add table public.shopping_lists;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'shopping_items'
  ) then
    alter publication supabase_realtime add table public.shopping_items;
  end if;
end $$;
