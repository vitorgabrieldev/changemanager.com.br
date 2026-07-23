"use client";

import {
  PiCalendarBlank,
  PiDotsThreeVertical,
  PiPencilSimple,
  PiPlus,
  PiTrash,
} from "react-icons/pi";
import {
  App,
  Avatar,
  Button,
  Checkbox,
  Dropdown,
  Empty,
  Progress,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useMemo, useState, useTransition } from "react";
import { CHECKLIST_CATEGORIES } from "@/lib/constants/checklist";
import type { HouseholdMember } from "@/lib/data/household";
import type { ChecklistCategory, Database } from "@/lib/types/database";
import {
  createChecklistItem,
  deleteChecklistItem,
  toggleChecklistItem,
  updateChecklistItem,
} from "./actions";
import {
  ChecklistItemFormModal,
  type ChecklistItemFormValues,
} from "./item-form-modal";
import { ChecklistItemViewDrawer } from "./item-view-drawer";

const { Title, Text } = Typography;

type ChecklistItem = Database["public"]["Tables"]["checklist_items"]["Row"];

export function ChecklistView({
  initialItems,
  members,
}: {
  initialItems: ChecklistItem[];
  members: HouseholdMember[];
}) {
  const [items, setItems] = useState(initialItems);
  const [syncedItems, setSyncedItems] = useState(initialItems);
  const [, startTransition] = useTransition();
  const [modalState, setModalState] = useState<
    | { mode: "create" }
    | { mode: "edit"; item: ChecklistItem }
    | { mode: "view"; item: ChecklistItem }
    | null
  >(null);
  const { message, modal } = App.useApp();

  // Re-sincroniza o estado otimista quando o server component reenvia novos
  // props (após revalidatePath). Ajustar durante o render (em vez de useEffect)
  // evita o cascading render apontado pelo react-hooks/set-state-in-effect.
  if (initialItems !== syncedItems) {
    setSyncedItems(initialItems);
    setItems(initialItems);
  }

  const membersById = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members],
  );

  const total = items.length;
  const done = items.filter((i) => i.is_done).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  const grouped = useMemo(() => {
    return CHECKLIST_CATEGORIES.map((cat) => ({
      ...cat,
      items: items
        .filter((i) => i.category === cat.value)
        .sort((a, b) => a.position - b.position),
    })).filter((group) => group.items.length > 0);
  }, [items]);

  function handleToggle(item: ChecklistItem, checked: boolean) {
    const previous = items;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_done: checked } : i)),
    );
    startTransition(async () => {
      try {
        await toggleChecklistItem(item.id, checked);
      } catch {
        setItems(previous);
        message.error("Não foi possível atualizar o item.");
      }
    });
  }

  function handleDelete(item: ChecklistItem) {
    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    startTransition(async () => {
      try {
        await deleteChecklistItem(item.id);
      } catch {
        setItems(previous);
        message.error("Não foi possível excluir o item.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 rounded-sm border border-border bg-surface p-5 shadow-sm">
        <div className="min-w-0 flex-1">
          <Title level={4} className="!mb-1 !text-foreground-strong">
            Checklist
          </Title>
          <div className="flex items-center gap-3">
            <Progress
              percent={percent}
              strokeColor="#2aa198"
              showInfo={false}
              size="small"
              className="max-w-xs flex-1"
            />
            <Text className="text-xs whitespace-nowrap text-foreground-muted">
              {done}/{total} · {percent}%
            </Text>
          </div>
        </div>
        <Button
          type="primary"
          icon={<PiPlus size={16} />}
          onClick={() => setModalState({ mode: "create" })}
        >
          Novo item
        </Button>
      </div>

      {grouped.length === 0 && (
        <div className="rounded-sm border border-border bg-surface p-10 shadow-sm">
          <Empty description="Nenhum item ainda. Bora adicionar o primeiro." />
        </div>
      )}

      {grouped.map((group) => (
        <div
          key={group.value}
          className="rounded-sm border border-border bg-surface shadow-sm"
        >
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <Tag color={group.tagColor}>{group.label}</Tag>
            <Text className="text-foreground-muted text-xs">
              {group.items.filter((i) => i.is_done).length}/
              {group.items.length}
            </Text>
          </div>
          <div>
            {group.items.map((item) => {
              const assignee = item.assigned_to
                ? membersById.get(item.assigned_to)
                : undefined;

              return (
                <div
                  key={item.id}
                  onClick={() => setModalState({ mode: "view", item })}
                  className="flex cursor-pointer items-center gap-3 border-b border-border px-5 py-3 transition-colors last:border-b-0 hover:bg-surface-muted/60"
                >
                  <span onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={item.is_done}
                      onChange={(e) => handleToggle(item, e.target.checked)}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Text
                      className={
                        item.is_done
                          ? "text-foreground-muted line-through"
                          : "text-foreground-strong"
                      }
                    >
                      {item.title}
                    </Text>
                  </div>
                  {item.due_date && (
                    <DueDateTag date={item.due_date} done={item.is_done} />
                  )}
                  {assignee && (
                    <span onClick={(e) => e.stopPropagation()}>
                      <Tooltip title={assignee.display_name}>
                        <Avatar
                          size="small"
                          style={{ backgroundColor: assignee.color }}
                        >
                          {assignee.display_name[0]?.toUpperCase()}
                        </Avatar>
                      </Tooltip>
                    </span>
                  )}
                  <span onClick={(e) => e.stopPropagation()}>
                    <Dropdown
                      trigger={["click"]}
                      menu={{
                        items: [
                          {
                            key: "edit",
                            icon: <PiPencilSimple />,
                            label: "Editar",
                            onClick: () =>
                              setModalState({ mode: "edit", item }),
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
                      <Button
                        type="text"
                        size="small"
                        icon={<PiDotsThreeVertical size={16} />}
                      />
                    </Dropdown>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <ChecklistItemFormModal
        open={modalState?.mode === "create" || modalState?.mode === "edit"}
        title={modalState?.mode === "edit" ? "Editar" : "Criar"}
        members={members}
        initialValues={toInitialValues(modalState)}
        onClose={() => setModalState(null)}
        onSubmit={async (input) => {
          if (modalState?.mode === "edit") {
            await updateChecklistItem(modalState.item.id, input);
          } else {
            await createChecklistItem(input);
          }
        }}
      />

      <ChecklistItemViewDrawer
        open={modalState?.mode === "view"}
        item={modalState?.mode === "view" ? modalState.item : null}
        members={members}
        onClose={() => setModalState(null)}
        onEdit={() => {
          if (modalState?.mode === "view") {
            setModalState({ mode: "edit", item: modalState.item });
          }
        }}
      />
    </div>
  );
}

function DueDateTag({ date, done }: { date: string; done: boolean }) {
  const due = dayjs(date).startOf("day");
  const diffDays = due.diff(dayjs().startOf("day"), "day");
  const overdue = !done && diffDays < 0;
  const soon = !done && diffDays >= 0 && diffDays <= 2;

  const colorClass = overdue
    ? "bg-danger-soft text-danger"
    : soon
      ? "bg-warning-soft text-warning"
      : "bg-surface-muted text-foreground-muted";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium ${colorClass}`}
    >
      <PiCalendarBlank size={13} />
      {due.format("DD/MM")}
    </span>
  );
}

function toInitialValues(
  modalState:
    | { mode: "create" }
    | { mode: "edit"; item: ChecklistItem }
    | { mode: "view"; item: ChecklistItem }
    | null,
): Partial<ChecklistItemFormValues> | undefined {
  if (modalState?.mode !== "edit") return undefined;
  const { item } = modalState;
  return {
    title: item.title,
    category: item.category as ChecklistCategory,
    assignedTo: item.assigned_to ?? undefined,
    dueDate: item.due_date ? dayjs(item.due_date) : undefined,
    description: item.description ?? undefined,
  };
}
