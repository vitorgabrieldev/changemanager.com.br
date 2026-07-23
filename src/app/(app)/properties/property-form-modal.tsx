"use client";

import { App, Button, Drawer, Form, Input, Select } from "antd";
import { useEffect, useRef, useTransition } from "react";
import { PiX } from "react-icons/pi";
import { CurrencyInput } from "@/components/ui/currency-input";
import { NumberInput } from "@/components/ui/number-input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { PROPERTY_STATUSES } from "@/lib/constants/properties";
import type { PropertyStatus } from "@/lib/types/database";
import type { PropertyInput } from "./actions";
import {
  PropertyImageManager,
  type PropertyImage,
  type PropertyImageManagerHandle,
} from "./property-image-manager";

export type PropertyFormValues = {
  title: string;
  address?: string;
  listingUrl?: string;
  rentPrice?: number;
  condoFee?: number;
  iptu?: number;
  status: PropertyStatus;
  notes?: string;
  bedrooms?: number;
  bathrooms?: number;
  suites?: number;
  parkingSpots?: number;
  areaM2?: number;
  mapsUrl?: string;
};

function isEmptyRichText(html?: string) {
  if (!html) return true;
  return html.replace(/<[^>]*>/g, "").trim().length === 0;
}

export function PropertyFormModal({
  open,
  onClose,
  onSubmit,
  initialValues,
  title,
  propertyId,
  images,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: PropertyInput) => Promise<string>;
  initialValues?: Partial<PropertyFormValues>;
  title: string;
  propertyId: string | null;
  images: PropertyImage[];
}) {
  const [form] = Form.useForm<PropertyFormValues>();
  const [pending, startTransition] = useTransition();
  const { message } = App.useApp();
  const imageManagerRef = useRef<PropertyImageManagerHandle>(null);

  useEffect(() => {
    if (open) {
      // resetFields primeiro: o form persiste entre aberturas (o Drawer só
      // desmonta o conteúdo, não o `form` do useForm), então sem isso um
      // campo ausente do próximo setFieldsValue mantém o valor da sessão
      // anterior (ex: editar um imóvel e depois abrir "criar" com lixo).
      form.resetFields();
      form.setFieldsValue({
        title: "",
        status: "candidato",
        notes: "",
        ...initialValues,
      });
    }
  }, [open, initialValues, form]);

  function handleFinish(values: PropertyFormValues) {
    startTransition(async () => {
      try {
        const savedId = await onSubmit({
          title: values.title,
          address: values.address ?? null,
          listingUrl: values.listingUrl ?? null,
          rentPrice: values.rentPrice ?? null,
          condoFee: values.condoFee ?? null,
          iptu: values.iptu ?? null,
          status: values.status,
          notes: isEmptyRichText(values.notes) ? null : values.notes!,
          bedrooms: values.bedrooms ?? null,
          bathrooms: values.bathrooms ?? null,
          suites: values.suites ?? null,
          parkingSpots: values.parkingSpots ?? null,
          areaM2: values.areaM2 ?? null,
          mapsUrl: values.mapsUrl?.trim() || null,
        });
        await imageManagerRef.current?.commitPendingUploads(savedId);
        onClose();
      } catch (err) {
        message.error(
          err instanceof Error ? err.message : "Não foi possível salvar o imóvel.",
        );
      }
    });
  }

  return (
    <Drawer
      open={open}
      title={title}
      onClose={onClose}
      placement="right"
      size="50%"
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
        <Form.Item label="Fotos" className="w-full">
          <PropertyImageManager
            ref={imageManagerRef}
            propertyId={propertyId}
            initialImages={images}
          />
        </Form.Item>

        <Form.Item
          name="title"
          label="Nome do imóvel"
          rules={[{ required: true, message: "Dá um nome pro imóvel" }]}
        >
          <Input placeholder="Ex.: Apartamento na Água Verde" autoFocus />
        </Form.Item>

        <Form.Item name="address" label="Endereço">
          <Input placeholder="Ex.: Rua Exemplo, 123 – Bairro" />
        </Form.Item>

        <Form.Item name="listingUrl" label="Link do anúncio">
          <Input placeholder="https://..." />
        </Form.Item>

        <div className="flex gap-3">
          <Form.Item name="bedrooms" label="Quartos" className="min-w-0 flex-1">
            <NumberInput placeholder="0" />
          </Form.Item>
          <Form.Item name="bathrooms" label="Banheiros" className="min-w-0 flex-1">
            <NumberInput placeholder="0" />
          </Form.Item>
        </div>

        <div className="flex gap-3">
          <Form.Item name="suites" label="Suítes" className="min-w-0 flex-1">
            <NumberInput placeholder="0" />
          </Form.Item>
          <Form.Item name="parkingSpots" label="Vagas" className="min-w-0 flex-1">
            <NumberInput placeholder="0" />
          </Form.Item>
        </div>

        <Form.Item name="areaM2" label="Metragem">
          <NumberInput step={0.5} suffix="m²" placeholder="0" />
        </Form.Item>

        <Form.Item
          name="mapsUrl"
          label="Localização (Google Maps)"
        >
          <Input.TextArea
            placeholder="https://maps.google.com/... ou o <iframe> do Google Maps"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>

        <div className="flex gap-3">
          <Form.Item name="rentPrice" label="Aluguel" className="min-w-0 flex-1">
            <CurrencyInput placeholder="R$ 0,00" />
          </Form.Item>
          <Form.Item name="condoFee" label="Condomínio" className="min-w-0 flex-1">
            <CurrencyInput placeholder="R$ 0,00" />
          </Form.Item>
        </div>

        <div className="flex gap-3">
          <Form.Item name="iptu" label="IPTU" className="min-w-0 flex-1">
            <CurrencyInput placeholder="R$ 0,00" />
          </Form.Item>
          <Form.Item name="status" label="Status" className="min-w-0 flex-1">
            <Select
              options={PROPERTY_STATUSES.map((s) => ({
                value: s.value,
                label: s.label,
              }))}
            />
          </Form.Item>
        </div>

        <Form.Item name="notes" label="Observações">
          <RichTextEditor />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
