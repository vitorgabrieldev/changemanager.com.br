-- Trigger genérico de updated_at, reaproveitado por checklist_items,
-- properties e property_ratings.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  category text not null default 'geral',
  is_done boolean not null default false,
  position integer not null default 0,
  due_date date,
  assigned_to uuid references public.household_members(id) on delete set null,
  created_by uuid references public.household_members(id) on delete set null,
  done_by uuid references public.household_members(id) on delete set null,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checklist_items_category_check
    check (category in ('documentacao', 'casa', 'contas', 'compras', 'geral')),
  constraint checklist_items_done_consistency
    check (
      (is_done = false and done_at is null)
      or (is_done = true and done_at is not null)
    )
);

comment on table public.checklist_items is 'Itens do checklist de mudança de uma casa.';

create index checklist_items_household_id_idx on public.checklist_items (household_id);
-- Consulta mais comum da tela: pendentes de uma casa, ordenados por posição.
create index checklist_items_household_pending_idx
  on public.checklist_items (household_id, position)
  where is_done = false;
create index checklist_items_assigned_to_idx on public.checklist_items (assigned_to) where assigned_to is not null;
create index checklist_items_created_by_idx on public.checklist_items (created_by) where created_by is not null;
create index checklist_items_done_by_idx on public.checklist_items (done_by) where done_by is not null;

create trigger checklist_items_set_updated_at
  before update on public.checklist_items
  for each row
  execute function public.set_updated_at();

alter table public.checklist_items enable row level security;

create policy checklist_items_select on public.checklist_items
  for select
  using (household_id in (select public.my_household_ids()));

create policy checklist_items_insert on public.checklist_items
  for insert
  with check (household_id in (select public.my_household_ids()));

create policy checklist_items_update on public.checklist_items
  for update
  using (household_id in (select public.my_household_ids()))
  with check (household_id in (select public.my_household_ids()));

create policy checklist_items_delete on public.checklist_items
  for delete
  using (household_id in (select public.my_household_ids()));
