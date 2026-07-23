alter table public.checklist_items
  add column description text;

comment on column public.checklist_items.description is 'Descrição rica (HTML) do item, editada via TipTap.';
