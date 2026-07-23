alter table public.checklist_items
  drop constraint checklist_items_category_check;

alter table public.checklist_items
  add constraint checklist_items_category_check
    check (
      category in (
        'documentacao',
        'casa',
        'contas',
        'compras',
        'moveis',
        'transporte',
        'limpeza',
        'servicos',
        'saude',
        'escola',
        'geral'
      )
    );
