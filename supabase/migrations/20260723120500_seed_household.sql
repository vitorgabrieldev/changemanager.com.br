-- Seed da única casa da v1 + os dois moradores convidados por e-mail.
--
-- >>> ANTES DE APLICAR: troque 'amigo@gmail.com' pelo e-mail Google real do
-- segundo morador. O seu já está preenchido. <<<
--
-- Ninguém precisa existir em auth.users ainda: o trigger
-- public.handle_new_user() (migration de household_members) faz o vínculo
-- sozinho no primeiro login de cada um via Google.
with nova_casa as (
  insert into public.households (name)
  values ('Nossa casa')
  returning id
)
insert into public.household_members (household_id, invited_email, display_name, color)
select id, v.email, v.display_name, v.color
from nova_casa
cross join (
  values
    ('joaovictorfariasdev@gmail.com', 'João Victor', '#2aa198'),
    ('amigo@gmail.com', 'Amigo', '#268bd2')
) as v(email, display_name, color);

-- Checklist inicial de mudança, já populado para a casa recém-criada.
with casa as (
  select id from public.households order by created_at limit 1
)
insert into public.checklist_items (household_id, title, category, position)
select casa.id, item.title, item.category, item.position
from casa
cross join (
  values
    ('Assinar contrato de aluguel', 'documentacao', 1),
    ('Fazer vistoria de entrada com fotos', 'documentacao', 2),
    ('Guardar cópia do contrato e comprovantes', 'documentacao', 3),
    ('Comprar colchão', 'casa', 4),
    ('Comprar geladeira', 'casa', 5),
    ('Comprar fogão', 'casa', 6),
    ('Verificar chaves e fazer cópias', 'casa', 7),
    ('Contratar internet', 'casa', 8),
    ('Transferir/ligar energia elétrica', 'contas', 9),
    ('Transferir/ligar água', 'contas', 10),
    ('Contratar/transferir gás', 'contas', 11),
    ('Comprar itens básicos de limpeza', 'compras', 12),
    ('Comprar itens básicos de cozinha', 'compras', 13)
) as item(title, category, position);
