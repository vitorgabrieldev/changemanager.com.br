-- O índice parcial (household_id, position) where is_done = false nunca é
-- usado pela query real da tela: checklist/page.tsx busca TODOS os itens
-- (feitos ou não) ordenados por position, para o agrupamento por categoria.
-- Troca por um índice que cobre a tabela inteira.
drop index if exists public.checklist_items_household_pending_idx;

create index checklist_items_household_position_idx
  on public.checklist_items (household_id, position);

-- Evita duas criações simultâneas colidirem na mesma posição. O app calcula
-- position via select(max)+insert (não atômico) e agora tenta de novo uma
-- vez se cair aqui (ver createChecklistItem em actions.ts).
alter table public.checklist_items
  add constraint checklist_items_household_position_key
  unique (household_id, position);
