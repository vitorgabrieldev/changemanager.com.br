-- Habilita Supabase Realtime (postgres_changes) pras tabelas que os dois
-- moradores editam ao mesmo tempo — sem isso, quem está com a aba aberta só
-- vê a mudança do outro depois de recarregar/navegar. A autorização continua
-- sendo a RLS de cada tabela (o Realtime só encaminha uma mudança pro
-- client se a policy de select dela permitiria a mesma linha numa query).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'checklist_items'
  ) then
    alter publication supabase_realtime add table public.checklist_items;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'properties'
  ) then
    alter publication supabase_realtime add table public.properties;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'property_ratings'
  ) then
    alter publication supabase_realtime add table public.property_ratings;
  end if;
end $$;
