-- Vínculo entre auth.users e households. Como não há fluxo de signup (v1),
-- moradores são "convidados" por e-mail direto na tabela (user_id nulo) e o
-- vínculo com o auth.users real é feito automaticamente no primeiro login
-- via Google, pelo trigger public.handle_new_user() no fim deste arquivo.
create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text not null,
  display_name text not null,
  color text not null default '#2aa198',
  joined_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.household_members is 'Moradores de uma casa. user_id fica nulo até o primeiro login com o e-mail convidado.';
comment on column public.household_members.invited_email is 'E-mail Google usado para vincular automaticamente ao auth.users no primeiro login.';
comment on column public.household_members.color is 'Cor usada na UI para identificar o morador (avatar, tags, gráficos).';

-- Um e-mail só pode ser convidado uma vez por casa.
create unique index household_members_household_email_key
  on public.household_members (household_id, lower(invited_email));

-- Um usuário autenticado só pode ocupar uma vaga por casa (permite múltiplos
-- NULLs, ou seja, vários convites ainda não aceitos na mesma casa).
create unique index household_members_household_user_key
  on public.household_members (household_id, user_id)
  where user_id is not null;

-- Índices de suporte: toda policy de RLS do projeto filtra por user_id aqui
-- (via my_household_ids/my_member_ids) ou por household_id, então esses são
-- os dois acessos mais quentes do banco inteiro.
create index household_members_user_id_idx on public.household_members (user_id);
create index household_members_household_id_idx on public.household_members (household_id);

alter table public.household_members enable row level security;

-- Helpers de autorização, reaproveitados nas policies de TODAS as tabelas.
-- SECURITY DEFINER + dono da função (postgres) contorna a própria RLS de
-- household_members ao resolver "quais casas/membros são meus", evitando o
-- erro clássico de "infinite recursion detected in policy" que aconteceria
-- se a policy de household_members consultasse a si mesma diretamente.
create or replace function public.my_household_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select household_id
  from public.household_members
  where user_id = auth.uid()
$$;

comment on function public.my_household_ids() is 'IDs das casas do usuário autenticado. Usado por todas as policies de RLS do projeto.';

create or replace function public.my_member_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select id
  from public.household_members
  where user_id = auth.uid()
$$;

comment on function public.my_member_ids() is 'IDs de household_members do usuário autenticado (pode ser mais de um se pertencer a mais de uma casa).';

-- households: agora que my_household_ids() existe, fecha a policy que ficou
-- pendente na migration anterior.
create policy households_select on public.households
  for select
  using (id in (select public.my_household_ids()));

-- household_members: cada morador enxerga todas as linhas (inclusive
-- convites ainda pendentes, sem user_id) das casas a que pertence.
create policy household_members_select on public.household_members
  for select
  using (household_id in (select public.my_household_ids()));

-- Sem policy de insert/update/delete para authenticated em v1: não há tela
-- de "convidar morador" ainda, então essa gestão é feita manualmente via
-- SQL/dashboard (service_role ignora RLS).

-- Vincula automaticamente um convite pendente ao usuário que acabou de logar
-- pela primeira vez, casando por e-mail (case-insensitive).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.household_members
  set user_id = new.id,
      joined_at = now()
  where user_id is null
    and lower(invited_email) = lower(new.email);

  return new;
end;
$$;

comment on function public.handle_new_user() is 'Vincula um novo auth.users a um convite pendente em household_members pelo e-mail.';

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
