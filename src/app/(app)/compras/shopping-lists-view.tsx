"use client";

import {
  PiDotsThreeVertical,
  PiPencilSimple,
  PiPlus,
  PiShoppingCartSimple,
  PiTrash,
} from "react-icons/pi";
import { App, Button, Dropdown, Empty, Progress, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createShoppingList,
  deleteShoppingList,
  renameShoppingList,
} from "./actions";
import { ListFormModal } from "./list-form-modal";

const { Title, Text } = Typography;

type ShoppingList = { id: string; name: string; created_at: string };
type ItemSummary = { list_id: string; price: number | null; purchased: boolean };

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function ShoppingListsView({
  initialLists,
  initialItems,
  householdId,
}: {
  initialLists: ShoppingList[];
  initialItems: ItemSummary[];
  householdId: string;
}) {
  const router = useRouter();
  const [lists, setLists] = useState(initialLists);
  const [syncedLists, setSyncedLists] = useState(initialLists);
  const [items] = useState(initialItems);
  const [syncedItems, setSyncedItems] = useState(initialItems);
  const [, startTransition] = useTransition();
  const [modalState, setModalState] = useState<
    { mode: "create" } | { mode: "rename"; list: ShoppingList } | null
  >(null);
  const { message, modal } = App.useApp();

  if (initialLists !== syncedLists) {
    setSyncedLists(initialLists);
    setLists(initialLists);
  }
  if (initialItems !== syncedItems) {
    setSyncedItems(initialItems);
  }

  // Sem isso, quem está com a aba aberta só vê a lista criada/renomeada pelo
  // outro morador depois de recarregar/navegar.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`shopping-lists-${householdId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shopping_lists",
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { id?: string }).id;
            if (!oldId) return;
            setLists((prev) => prev.filter((l) => l.id !== oldId));
            return;
          }

          const row = payload.new as ShoppingList;
          setLists((prev) => {
            const exists = prev.some((l) => l.id === row.id);
            return exists
              ? prev.map((l) => (l.id === row.id ? { ...l, ...row } : l))
              : [...prev, row];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId]);

  const statsByList = useMemo(() => {
    const map = new Map<string, { count: number; total: number; purchased: number }>();
    for (const item of items) {
      const stat = map.get(item.list_id) ?? { count: 0, total: 0, purchased: 0 };
      stat.count += 1;
      stat.total += item.price ?? 0;
      if (item.purchased) stat.purchased += item.price ?? 0;
      map.set(item.list_id, stat);
    }
    return map;
  }, [items]);

  function handleDelete(list: ShoppingList) {
    setLists((prev) => prev.filter((l) => l.id !== list.id));
    startTransition(async () => {
      try {
        await deleteShoppingList(list.id);
      } catch {
        setLists((prev) =>
          prev.some((l) => l.id === list.id) ? prev : [...prev, list],
        );
        message.error("Não foi possível excluir a lista.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 rounded-sm border border-border bg-surface p-5 shadow-sm">
        <div>
          <Title level={4} className="!mb-1 !text-foreground-strong">
            Compras
          </Title>
          <Text className="text-foreground-muted">
            {lists.length} lista{lists.length === 1 ? "" : "s"}
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PiPlus size={16} />}
          onClick={() => setModalState({ mode: "create" })}
        >
          Nova lista
        </Button>
      </div>

      {lists.length === 0 ? (
        <div className="rounded-sm border border-border bg-surface p-10 shadow-sm">
          <Empty description='Nenhuma lista ainda. Crie a primeira, tipo "Pré mudança".' />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => {
            const stat = statsByList.get(list.id) ?? { count: 0, total: 0, purchased: 0 };
            const percent = stat.total === 0 ? 0 : Math.round((stat.purchased / stat.total) * 100);

            return (
              <div
                key={list.id}
                onClick={() => router.push(`/compras/${list.id}`)}
                className="cursor-pointer rounded-sm border border-border bg-surface p-5 shadow-sm transition hover:border-accent hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-accent-soft text-accent">
                      <PiShoppingCartSimple size={18} />
                    </div>
                    <Text
                      strong
                      ellipsis={{ tooltip: list.name }}
                      className="min-w-0 text-foreground-strong"
                    >
                      {list.name}
                    </Text>
                  </div>
                  <span onClick={(e) => e.stopPropagation()}>
                    <Dropdown
                      trigger={["click"]}
                      menu={{
                        items: [
                          {
                            key: "rename",
                            icon: <PiPencilSimple />,
                            label: "Renomear",
                            onClick: () => setModalState({ mode: "rename", list }),
                          },
                          {
                            key: "delete",
                            danger: true,
                            icon: <PiTrash />,
                            label: "Excluir",
                            onClick: () => {
                              modal.confirm({
                                title: "Excluir lista?",
                                content: `"${list.name}" e todos os itens dela vão ser removidos. Não dá pra desfazer.`,
                                okText: "Excluir",
                                okButtonProps: { danger: true },
                                cancelText: "Cancelar",
                                onOk: () => handleDelete(list),
                              });
                            },
                          },
                        ],
                      }}
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<PiDotsThreeVertical size={16} />}
                      />
                    </Dropdown>
                  </span>
                </div>

                <Text className="mb-2 block text-xs text-foreground-muted">
                  {stat.count} ite{stat.count === 1 ? "m" : "ns"}
                </Text>

                {stat.total > 0 && (
                  <>
                    <Progress
                      percent={percent}
                      strokeColor="#2aa198"
                      showInfo={false}
                      size="small"
                    />
                    <Text className="text-xs text-foreground-muted">
                      {currency.format(stat.purchased)} de {currency.format(stat.total)} já comprado
                    </Text>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ListFormModal
        open={modalState !== null}
        title={modalState?.mode === "rename" ? "Renomear lista" : "Nova lista"}
        initialName={modalState?.mode === "rename" ? modalState.list.name : undefined}
        onClose={() => setModalState(null)}
        onSubmit={async (name) => {
          if (modalState?.mode === "rename") {
            await renameShoppingList(modalState.list.id, name);
          } else {
            const id = await createShoppingList(name);
            router.push(`/compras/${id}`);
          }
        }}
      />
    </div>
  );
}
