"use client";

import { App, Form, Input, Modal } from "antd";
import { useEffect, useTransition } from "react";

export function ListFormModal({
  open,
  onClose,
  onSubmit,
  initialName,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  initialName?: string;
  title: string;
}) {
  const [form] = Form.useForm<{ name: string }>();
  const [pending, startTransition] = useTransition();
  const { message } = App.useApp();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({ name: initialName ?? "" });
  }, [open, initialName, form]);

  function handleFinish(values: { name: string }) {
    startTransition(async () => {
      try {
        await onSubmit(values.name);
        onClose();
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Não foi possível salvar.");
      }
    });
  }

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      destroyOnHidden
      okText="Salvar"
      cancelText="Cancelar"
      confirmLoading={pending}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="name"
          label="Nome da lista"
          rules={[{ required: true, message: "Dá um nome pra lista" }]}
        >
          <Input placeholder="Ex.: Pré mudança" autoFocus />
        </Form.Item>
      </Form>
    </Modal>
  );
}
