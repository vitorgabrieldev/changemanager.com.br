"use client";

import { App, Button, DatePicker, Drawer, Form, Input, Select } from "antd";
import dayjs from "dayjs";
import { useEffect, useState, useTransition } from "react";
import { PiX } from "react-icons/pi";
import { CHECKLIST_CATEGORIES } from "@/lib/constants/checklist";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { SkeletonBone } from "@/components/ui/skeleton-bone";
import type { HouseholdMember } from "@/lib/data/household";
import type { ChecklistCategory } from "@/lib/types/database";
import { getChecklistItemDescription, type ChecklistItemInput } from "./actions";

function isEmptyRichText(html?: string) {
  if (!html) return true;
  return html.replace(/<[^>]*>/g, "").trim().length === 0;
}

export type ChecklistItemFormValues = {
  title: string;
  category: ChecklistCategory;
  assignedTo?: string;
  dueDate?: dayjs.Dayjs;
  description?: string;
};

export function ChecklistItemFormModal({
  open,
  onClose,
  onSubmit,
  members,
  initialValues,
  title,
  editingItemId,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: ChecklistItemInput) => Promise<void>;
  members: HouseholdMember[];
  initialValues?: Partial<ChecklistItemFormValues>;
  title: string;
  /** Id do item em edição — busca a description sob demanda (a listagem não
   * traz esse campo). `null` no modo criar. */
  editingItemId: string | null;
}) {
  const [form] = Form.useForm<ChecklistItemFormValues>();
  const [pending, startTransition] = useTransition();
  const [loadedItemId, setLoadedItemId] = useState<string | null>(null);
  // Derivado, não setado no efeito — só o resultado (via .then/.catch) seta
  // state de verdade, o que react-hooks/set-state-in-effect exige.
  const descriptionLoading = editingItemId !== null && loadedItemId !== editingItemId;
  const { message } = App.useApp();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({
      title: "",
      category: "geral",
      description: "",
      ...initialValues,
    });
  }, [open, initialValues, form]);

  useEffect(() => {
    if (!open || !editingItemId || editingItemId === loadedItemId) return;

    let cancelled = false;
    getChecklistItemDescription(editingItemId)
      .then((description) => {
        if (cancelled) return;
        form.setFieldsValue({ description: description ?? "" });
        setLoadedItemId(editingItemId);
      })
      .catch(() => {
        if (cancelled) return;
        message.error("Não foi possível carregar a descrição.");
        setLoadedItemId(editingItemId);
      });

    return () => {
      cancelled = true;
    };
  }, [open, editingItemId, loadedItemId, form, message]);

  function handleFinish(values: ChecklistItemFormValues) {
    startTransition(async () => {
      try {
        await onSubmit({
          title: values.title,
          category: values.category,
          assignedTo: values.assignedTo ?? null,
          dueDate: values.dueDate ? values.dueDate.format("YYYY-MM-DD") : null,
          description: isEmptyRichText(values.description)
            ? null
            : values.description!,
        });
        onClose();
      } catch {
        message.error("Não foi possível salvar o item.");
      }
    });
  }

  return (
    <Drawer
      open={open}
      title={title}
      onClose={onClose}
      placement="right"
      size="30%"
      closeIcon={<PiX size={18} />}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" loading={pending} onClick={() => form.submit()}>
            Salvar
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="title"
          label="Título"
          rules={[{ required: true, message: "Dá um nome pro item" }]}
        >
          <Input placeholder="Ex: Comprar geladeira" autoFocus />
        </Form.Item>

        <Form.Item name="category" label="Categoria">
          <Select
            options={CHECKLIST_CATEGORIES.map((c) => ({
              value: c.value,
              label: c.label,
            }))}
          />
        </Form.Item>

        <Form.Item name="assignedTo" label="Responsável">
          <Select
            allowClear
            placeholder="Sem responsável definido"
            options={members.map((m) => ({ value: m.id, label: m.display_name }))}
          />
        </Form.Item>

        <Form.Item name="dueDate" label="Prazo">
          <DatePicker className="w-full" format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item name="description" label="Descrição">
          {descriptionLoading ? (
            <SkeletonBone className="h-24 w-full" />
          ) : (
            <RichTextEditor />
          )}
        </Form.Item>
      </Form>
    </Drawer>
  );
}
