"use client";

import { Avatar, Button, Drawer, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { PiCalendarBlank, PiPencilSimple, PiX } from "react-icons/pi";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { SkeletonBone } from "@/components/ui/skeleton-bone";
import {
  checklistCategoryColor,
  checklistCategoryLabel,
} from "@/lib/constants/checklist";
import type { HouseholdMember } from "@/lib/data/household";
import type { Database } from "@/lib/types/database";
import { getChecklistItemDescription } from "./actions";

const { Title, Text } = Typography;

export type ChecklistItemSummary = Omit<
  Database["public"]["Tables"]["checklist_items"]["Row"],
  "description"
>;

export function ChecklistItemViewDrawer({
  open,
  item,
  members,
  onClose,
  onEdit,
}: {
  open: boolean;
  item: ChecklistItemSummary | null;
  members: HouseholdMember[];
  onClose: () => void;
  onEdit: () => void;
}) {
  const [description, setDescription] = useState<string | null>(null);
  const [loadedItemId, setLoadedItemId] = useState<string | null>(null);
  const itemId = open ? (item?.id ?? null) : null;
  const descriptionLoading = itemId !== null && loadedItemId !== itemId;

  // A listagem não traz `description` — busca sob demanda ao abrir o drawer.
  // `descriptionLoading` é derivado (não é state setado no efeito) e o
  // setState de verdade só acontece dentro do .then/.catch, não direto no
  // corpo do efeito — react-hooks/set-state-in-effect não gosta do segundo caso.
  useEffect(() => {
    if (itemId === null || itemId === loadedItemId) return;
    let cancelled = false;
    getChecklistItemDescription(itemId)
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
          <Button
            type="primary"
            icon={<PiPencilSimple size={14} />}
            onClick={onEdit}
          >
            Editar
          </Button>
        </div>
      }
    >
      {item && (
        <div className="flex flex-col gap-4">
          <Title
            level={5}
            className={`!mb-0 ${
              item.is_done
                ? "!text-foreground-muted line-through"
                : "!text-foreground-strong"
            }`}
          >
            {item.title}
          </Title>

          <div className="flex flex-wrap items-center gap-2">
            <Tag color={checklistCategoryColor(item.category)}>
              {checklistCategoryLabel(item.category)}
            </Tag>
            {item.due_date && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-surface-muted px-2 py-1 text-xs font-medium text-foreground-muted">
                <PiCalendarBlank size={13} />
                {dayjs(item.due_date).format("DD/MM/YYYY")}
              </span>
            )}
          </div>

          {assignee && (
            <div className="flex items-center gap-2">
              <Avatar size="small" style={{ backgroundColor: assignee.color }}>
                {assignee.display_name[0]?.toUpperCase()}
              </Avatar>
              <Text className="text-foreground-strong">
                {assignee.display_name}
              </Text>
            </div>
          )}

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
