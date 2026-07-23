-- Tabela raiz: cada "casa" (household) é o contêiner de tudo (checklist,
-- imóveis, membros). V1 tem uma única casa, mas o modelo já suporta várias.
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

comment on table public.households is 'Uma casa/república compartilhada entre moradores.';

alter table public.households enable row level security;

-- Sem política de select ainda: a policy depende de public.my_household_ids(),
-- criada na migration de household_members (que depende desta tabela via FK).
-- Até lá, RLS nega tudo por padrão para roles autenticadas; service_role
-- continua com acesso total para seed/administração.
