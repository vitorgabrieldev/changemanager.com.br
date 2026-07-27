"use client";

import { App, Button, Drawer, Form, Input, Select } from "antd";
import { useEffect, useRef, useState, useTransition } from "react";
import { PiX } from "react-icons/pi";
import { CurrencyInput } from "@/components/ui/currency-input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { SkeletonBone } from "@/components/ui/skeleton-bone";
import { SHOPPING_PRIORITIES } from "@/lib/constants/shopping";
import type { HouseholdMember } from "@/lib/data/household";
import type { ShoppingItemPriority } from "@/lib/types/database";
import { getShoppingItemDescription, type ShoppingItemInput } from "../actions";
import {
  ShoppingItemImageManager,
  type ShoppingItemImage,
  type ShoppingItemImageManagerHandle,
} from "../shopping-item-image-manager";

export type ShoppingItemFormValues = {
  title: string;
  price?: number;
  link?: string;
  priority: ShoppingItemPriority;
  assignedTo?: string;
  description?: string;
};

function isEmptyRichText(html?: string) {
  if (!html) return true;
  return html.replace(/<[^>]*>/g, "").trim().length === 0;
}

export function ShoppingItemFormModal({
  open,
  onClose,
  onSubmit,
  members,
  initialValues,
  title,
  itemId,
  images,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: ShoppingItemInput) => Promise<string>;
  members: HouseholdMember[];
  initialValues?: Partial<ShoppingItemFormValues>;
  title: string;
  itemId: string | null;
  images: ShoppingItemImage[];
}) {
  const [form] = Form.useForm<ShoppingItemFormValues>();
  const [pending, startTransition] = useTransition();
  const [loadedItemId, setLoadedItemId] = useState<string | null>(null);
  // Derivado, não setado no efeito — só o resultado (via .then/.catch) seta
  // state de verdade, o que react-hooks/set-state-in-effect exige.
  const descriptionLoading = itemId !== null && loadedItemId !== itemId;
  const { message } = App.useApp();
  const imageManagerRef = useRef<ShoppingItemImageManagerHandle>(null);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({
      title: "",
      priority: "desejavel",
      description: "",
      ...initialValues,
    });
  }, [open, initialValues, form]);

  useEffect(() => {
    if (!open || !itemId || itemId === loadedItemId) return;

    let cancelled = false;
    getShoppingItemDescription(itemId)
      .then((description) => {
        if (cancelled) return;
        form.setFieldsValue({ description: description ?? "" });
        setLoadedItemId(itemId);
      })
      .catch(() => {
        if (cancelled) return;
        message.error("Não foi possível carregar a descrição.");
        setLoadedItemId(itemId);
      });

    return () => {
      cancelled = true;
    };
  }, [open, itemId, loadedItemId, form, message]);

  function handleFinish(values: ShoppingItemFormValues) {
    startTransition(async () => {
      try {
        const savedId = await onSubmit({
          title: values.title,
          price: values.price ?? null,
          link: values.link?.trim() || null,
          priority: values.priority,
          assignedTo: values.assignedTo ?? null,
          description: isEmptyRichText(values.description) ? null : values.description!,
        });
        await imageManagerRef.current?.commitPendingUploads(savedId);
        onClose();
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Não foi possível salvar o item.");
      }
    });
  }

  return (
    <Drawer
      open={open}
      title={title}
      onClose={onClose}
      placement="right"
      size="40%"
      closeIcon={<PiX size={18} />}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            type="primary"
            loading={pending}
            disabled={descriptionLoading}
            onClick={() => form.submit()}
          >
            Salvar
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item label="Fotos" className="w-full">
          <ShoppingItemImageManager
            ref={imageManagerRef}
            itemId={itemId}
            initialImages={images}
          />
        </Form.Item>

        <Form.Item
          name="title"
          label="Nome do item"
          rules={[{ required: true, message: "Dá um nome pro item" }]}
        >
          <Input placeholder="Ex.: Sofá 3 lugares" autoFocus />
        </Form.Item>

        <Form.Item name="link" label="Link (loja, anúncio, referência)">
          <Input placeholder="https://..." />
        </Form.Item>

        <div className="flex gap-3">
          <Form.Item name="price" label="Preço estimado" className="min-w-0 flex-1">
            <CurrencyInput placeholder="R$ 0,00" />
          </Form.Item>
          <Form.Item name="priority" label="Prioridade" className="min-w-0 flex-1">
            <Select
              options={SHOPPING_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
            />
          </Form.Item>
        </div>

        <Form.Item name="assignedTo" label="Quem vai comprar">
          <Select
            allowClear
            placeholder="Sem responsável definido"
            options={members.map((m) => ({ value: m.id, label: m.display_name }))}
          />
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
