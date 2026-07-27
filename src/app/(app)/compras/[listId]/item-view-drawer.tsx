"use client";

import { Avatar, Button, Checkbox, Drawer, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { PiLinkSimple, PiPencilSimple, PiX } from "react-icons/pi";
import { EntityImageCarousel } from "@/components/ui/entity-image-carousel";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { SkeletonBone } from "@/components/ui/skeleton-bone";
import { shoppingPriorityColor, shoppingPriorityLabel } from "@/lib/constants/shopping";
import type { HouseholdMember } from "@/lib/data/household";
import type { Database } from "@/lib/types/database";
import { getShoppingItemDescription } from "../actions";
import type { ShoppingItemImage } from "../shopping-item-image-manager";

const { Title, Text } = Typography;

export type ShoppingItemSummary = Omit<
  Database["public"]["Tables"]["shopping_items"]["Row"],
  "description"
>;

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function ShoppingItemViewDrawer({
  open,
  item,
  images,
  members,
  onClose,
  onEdit,
  onTogglePurchased,
}: {
  open: boolean;
  item: ShoppingItemSummary | null;
  images: ShoppingItemImage[];
  members: HouseholdMember[];
  onClose: () => void;
  onEdit: () => void;
  onTogglePurchased: (item: ShoppingItemSummary, purchased: boolean) => void;
}) {
  const [description, setDescription] = useState<string | null>(null);
  const [loadedItemId, setLoadedItemId] = useState<string | null>(null);
  const itemId = open ? (item?.id ?? null) : null;
  const descriptionLoading = itemId !== null && loadedItemId !== itemId;

  useEffect(() => {
    if (itemId === null || itemId === loadedItemId) return;
    let cancelled = false;
    getShoppingItemDescription(itemId)
      .then((value) => {
        if (cancelled) return;
        setDescription(value);
        setLoadedItemId(itemId);
      })
      .catch(() => {
        if (cancelled) return;
        setDescription(null);
        setLoadedItemId(itemId);
      });
    return () => {
      cancelled = true;
    };
  }, [itemId, loadedItemId]);

  const assignee = item?.assigned_to
    ? members.find((m) => m.id === item.assigned_to)
    : undefined;
  const purchasedBy = item?.purchased_by
    ? members.find((m) => m.id === item.purchased_by)
    : undefined;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      size="30%"
      closeIcon={<PiX size={18} />}
      title="Detalhes"
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Fechar</Button>
          <Button type="primary" icon={<PiPencilSimple size={14} />} onClick={onEdit}>
            Editar
          </Button>
        </div>
      }
    >
      {item && (
        <div className="flex flex-col gap-4">
          <EntityImageCarousel images={images} groupId={`shopping-item-view-${item.id}`} />

          <div className="flex items-start justify-between gap-2">
            <Title
              level={5}
              className={`!mb-0 ${item.purchased ? "!text-foreground-muted line-through" : "!text-foreground-strong"}`}
            >
              {item.title}
            </Title>
            {item.price !== null && (
              <Text strong className="shrink-0 text-foreground-strong">
                {currency.format(item.price)}
              </Text>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Tag color={shoppingPriorityColor(item.priority)}>
              {shoppingPriorityLabel(item.priority)}
            </Tag>
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <PiLinkSimple size={13} />
                Ver referência
              </a>
            )}
          </div>

          {assignee && (
            <div className="flex items-center gap-2">
              <Avatar size="small" style={{ backgroundColor: assignee.color }}>
                {assignee.display_name[0]?.toUpperCase()}
              </Avatar>
              <Text className="text-foreground-strong">{assignee.display_name} vai comprar</Text>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-sm border border-border bg-surface-muted px-3 py-2">
            <Checkbox
              checked={item.purchased}
              onChange={(e) => onTogglePurchased(item, e.target.checked)}
            />
            <Text className="text-foreground-strong">
              {item.purchased
                ? `Comprado${purchasedBy ? ` por ${purchasedBy.display_name}` : ""}${
                    item.purchased_at ? ` em ${dayjs(item.purchased_at).format("DD/MM/YYYY")}` : ""
                  }`
                : "Ainda não comprado"}
            </Text>
          </div>

          {descriptionLoading ? (
            <div>
              <Text className="mb-1 block text-xs font-medium text-foreground-muted uppercase">
                Descrição
              </Text>
              <SkeletonBone className="h-16 w-full" />
            </div>
          ) : (
            description && (
              <div>
                <Text className="mb-1 block text-xs font-medium text-foreground-muted uppercase">
                  Descrição
                </Text>
                <RichTextEditor value={description} editable={false} />
              </div>
            )
          )}
        </div>
      )}
    </Drawer>
  );
}
