"use client";

import {
  PiCheckCircle,
  PiDotsThreeVertical,
  PiImage,
  PiLink,
  PiPencilSimple,
  PiPlus,
  PiTrash,
} from "react-icons/pi";
import { App, Avatar, Button, Checkbox, Dropdown, Empty, Progress, Tag, Tooltip, Typography } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { shoppingPriorityColor, shoppingPriorityLabel } from "@/lib/constants/shopping";
import type { HouseholdMember } from "@/lib/data/household";
import { createClient } from "@/lib/supabase/client";
import {
  createShoppingItem,
  deleteShoppingItem,
  toggleShoppingItemPurchased,
  updateShoppingItem,
} from "../actions";
import {
  ShoppingItemFormModal,
  type ShoppingItemFormValues,
} from "./item-form-modal";
import type { ShoppingItemImage } from "../shopping-item-image-manager";
import { ShoppingItemViewDrawer, type ShoppingItemSummary } from "./item-view-drawer";

const { Title, Text } = Typography;

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function ShoppingItemsView({
  list,
  initialItems,
  members,
  currentMemberId,
  imageUrls,
}: {
  list: { id: string; name: string };
  initialItems: ShoppingItemSummary[];
  members: HouseholdMember[];
  currentMemberId: string;
  imageUrls: Record<string, string>;
}) {
  const [items, setItems] = useState(initialItems);
  const [syncedItems, setSyncedItems] = useState(initialItems);
  const [, startTransition] = useTransition();
  const [modalState, setModalState] = useState<
    | { mode: "create" }
    | { mode: "edit"; item: ShoppingItemSummary }
    | { mode: "view"; item: ShoppingItemSummary }
    | null
  >(null);
  const { message, modal } = App.useApp();

  if (initialItems !== syncedItems) {
    setSyncedItems(initialItems);
    setItems(initialItems);
  }

  // Sem isso, quem está com a aba aberta só vê o item criado/comprado pelo
  // outro morador depois de recarregar/navegar. `description` fica de fora
  // do merge (mesmo motivo do select da página) — só quem abriu precisa dela.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`shopping-items-${list.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_items", filter: `list_id=eq.${list.id}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { id?: string }).id;
            if (!oldId) return;
            setItems((prev) => prev.filter((i) => i.id !== oldId));
            return;
          }

          // eslint-disable-next-line @typescript-eslint/no-unused-vars -- descartado de propósito
          const { description: _description, ...summary } = payload.new as ShoppingItemSummary & {
            description?: string | null;
          };
          setItems((prev) => {
            const exists = prev.some((i) => i.id === summary.id);
            return exists
              ? prev.map((i) => (i.id === summary.id ? { ...i, ...summary } : i))
              : [...prev, summary];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [list.id]);

  const membersById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const stats = useMemo(() => {
    const total = items.reduce((sum, i) => sum + (i.price ?? 0), 0);
    const purchased = items.reduce((sum, i) => sum + (i.purchased ? (i.price ?? 0) : 0), 0);
    return { total, purchased, percent: total === 0 ? 0 : Math.round((purchased / total) * 100) };
  }, [items]);

  const imagesFor = useCallback(
    (item: ShoppingItemSummary): ShoppingItemImage[] =>
      (item.images ?? [])
        .map((path) => ({ path, url: imageUrls[path] }))
        .filter((img): img is ShoppingItemImage => Boolean(img.url)),
    [imageUrls],
  );

  const formImages = useMemo(
    () => (modalState?.mode === "edit" ? imagesFor(modalState.item) : []),
    [modalState, imagesFor],
  );

  const handleDelete = useCallback(
    (item: ShoppingItemSummary) => {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      startTransition(async () => {
        try {
          await deleteShoppingItem(item.id, list.id);
        } catch {
          setItems((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item]));
          message.error("Não foi possível excluir o item.");
        }
      });
    },
    [list.id, message],
  );

  const handleTogglePurchased = useCallback(
    (item: ShoppingItemSummary, purchased: boolean) => {
      const previous = item;
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                purchased,
                purchased_at: purchased ? new Date().toISOString() : null,
                purchased_by: purchased ? currentMemberId : null,
              }
            : i,
        ),
      );
      startTransition(async () => {
        try {
          await toggleShoppingItemPurchased(item.id, list.id, purchased);
        } catch {
          setItems((prev) => prev.map((i) => (i.id === item.id ? previous : i)));
          message.error("Não foi possível atualizar o item.");
        }
      });
    },
    [list.id, currentMemberId, message],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/compras" className="text-xs text-foreground-muted hover:text-accent">
          ← Compras
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-sm border border-border bg-surface p-5 shadow-sm">
        <div className="min-w-0 flex-1">
          <Title level={4} className="!mb-1 !text-foreground-strong">
            {list.name}
          </Title>
          {stats.total > 0 ? (
            <div className="flex items-center gap-3">
              <Progress
                percent={stats.percent}
                strokeColor="#2aa198"
                showInfo={false}
                size="small"
                className="max-w-xs flex-1"
              />
              <Text className="text-xs whitespace-nowrap text-foreground-muted">
                {currency.format(stats.purchased)} de {currency.format(stats.total)}
              </Text>
            </div>
          ) : (
            <Text className="text-foreground-muted">{items.length} itens</Text>
          )}
        </div>
        <Button
          type="primary"
          icon={<PiPlus size={16} />}
          onClick={() => setModalState({ mode: "create" })}
        >
          Novo item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-sm border border-border bg-surface p-10 shadow-sm">
          <Empty description="Nenhum item ainda. Bora adicionar o primeiro." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const thumb = imagesFor(item)[0];
            const assignee = item.assigned_to ? membersById.get(item.assigned_to) : undefined;

            return (
              <div
                key={item.id}
                onClick={() => setModalState({ mode: "view", item })}
                className="cursor-pointer overflow-hidden rounded-sm border border-border bg-surface shadow-sm transition hover:border-accent hover:shadow-md"
              >
                <div className="relative aspect-video w-full bg-surface-muted">
                  {thumb ? (
                    <Image
                      src={thumb.url}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 50vw, 280px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-foreground-muted">
                      <PiImage size={28} />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Text
                      strong
                      ellipsis={{ tooltip: item.title }}
                      className={`min-w-0 ${item.purchased ? "text-foreground-muted line-through" : "text-foreground-strong"}`}
                    >
                      {item.title}
                    </Text>
                    <span onClick={(e) => e.stopPropagation()}>
                      <Dropdown
                        trigger={["click"]}
                        menu={{
                          items: [
                            {
                              key: "edit",
                              icon: <PiPencilSimple />,
                              label: "Editar",
                              onClick: () => setModalState({ mode: "edit", item }),
                            },
                            {
                              key: "delete",
                              danger: true,
                              icon: <PiTrash />,
                              label: "Excluir",
                              onClick: () => {
                                modal.confirm({
                                  title: "Excluir item?",
                                  content: `"${item.title}" vai ser removido e não dá pra desfazer.`,
                                  okText: "Excluir",
                                  okButtonProps: { danger: true },
                                  cancelText: "Cancelar",
                                  onOk: () => handleDelete(item),
                                });
                              },
                            },
                          ],
                        }}
                      >
                        <Button type="text" size="small" icon={<PiDotsThreeVertical size={16} />} />
                      </Dropdown>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Tag color={shoppingPriorityColor(item.priority)}>
                      {shoppingPriorityLabel(item.priority)}
                    </Tag>
                    {item.price !== null && (
                      <Text strong className="text-xs text-foreground-strong">
                        {currency.format(item.price)}
                      </Text>
                    )}
                    {item.link && (
                      <Tooltip title="Tem link salvo">
                        <PiLink className="text-foreground-muted" size={13} />
                      </Tooltip>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5">
                      <Checkbox
                        checked={item.purchased}
                        onChange={(e) => handleTogglePurchased(item, e.target.checked)}
                      />
                      <Text className="text-xs text-foreground-muted">
                        {item.purchased ? (
                          <span className="inline-flex items-center gap-1 text-success">
                            <PiCheckCircle size={13} /> Comprado
                          </span>
                        ) : (
                          "A comprar"
                        )}
                      </Text>
                    </span>
                    {assignee && (
                      <Tooltip title={`${assignee.display_name} vai comprar`}>
                        <Avatar size="small" style={{ backgroundColor: assignee.color }}>
                          {assignee.display_name[0]?.toUpperCase()}
                        </Avatar>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ShoppingItemFormModal
        open={modalState?.mode === "create" || modalState?.mode === "edit"}
        title={modalState?.mode === "edit" ? "Editar" : "Criar"}
        members={members}
        initialValues={toInitialValues(modalState)}
        itemId={modalState?.mode === "edit" ? modalState.item.id : null}
        images={formImages}
        onClose={() => setModalState(null)}
        onSubmit={async (input) => {
          if (modalState?.mode === "edit") {
            await updateShoppingItem(modalState.item.id, list.id, input);
            return modalState.item.id;
          }
          return createShoppingItem(list.id, input);
        }}
      />

      <ShoppingItemViewDrawer
        open={modalState?.mode === "view"}
        item={modalState?.mode === "view" ? modalState.item : null}
        images={modalState?.mode === "view" ? imagesFor(modalState.item) : []}
        members={members}
        onClose={() => setModalState(null)}
        onEdit={() => {
          if (modalState?.mode === "view") {
            setModalState({ mode: "edit", item: modalState.item });
          }
        }}
        onTogglePurchased={handleTogglePurchased}
      />
    </div>
  );
}

function toInitialValues(
  modalState:
    | { mode: "create" }
    | { mode: "edit"; item: ShoppingItemSummary }
    | { mode: "view"; item: ShoppingItemSummary }
    | null,
): Partial<ShoppingItemFormValues> | undefined {
  if (modalState?.mode !== "edit") return undefined;
  const { item } = modalState;
  return {
    title: item.title,
    price: item.price ?? undefined,
    link: item.link ?? undefined,
    priority: item.priority as ShoppingItemFormValues["priority"],
    assignedTo: item.assigned_to ?? undefined,
    // description não vem na listagem — o form busca sob demanda.
  };
}
