alter table public.properties
  add column images text[] not null default '{}';

comment on column public.properties.images is 'Paths dos arquivos no bucket de Storage "Propertys" (não URLs — resolvidas via signed URL em runtime).';

-- Garante que o bucket existe (idempotente caso já tenha sido criado manualmente
-- pelo dashboard). Mantido privado: as imagens são servidas via signed URL.
insert into storage.buckets (id, name, public)
values ('Propertys', 'Propertys', false)
on conflict (id) do nothing;

-- Sem uma noção de "dono" no nível de storage.objects, a policy fica restrita
-- a "usuário autenticado" (qualquer membro de qualquer household deste app).
-- Suficiente para o modelo de ameaça atual (app privado de uso doméstico).
drop policy if exists "Propertys read" on storage.objects;
create policy "Propertys read"
  on storage.objects for select
  using (bucket_id = 'Propertys' and auth.role() = 'authenticated');

drop policy if exists "Propertys insert" on storage.objects;
create policy "Propertys insert"
  on storage.objects for insert
  with check (bucket_id = 'Propertys' and auth.role() = 'authenticated');

drop policy if exists "Propertys delete" on storage.objects;
create policy "Propertys delete"
  on storage.objects for delete
  using (bucket_id = 'Propertys' and auth.role() = 'authenticated');
