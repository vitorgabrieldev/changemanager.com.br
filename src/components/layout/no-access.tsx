"use client";

import { Button, Typography } from "antd";
import { PiLockSimple } from "react-icons/pi";
import { signOut } from "@/app/actions/auth";

const { Title, Paragraph } = Typography;

export function NoAccess() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-sm border border-border bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-danger-soft text-danger">
          <PiLockSimple className="text-xl" />
        </div>
        <Title level={4} className="!mb-1 !text-foreground-strong">
          Sem acesso
        </Title>
        <Paragraph className="text-foreground-muted">
          Sua conta Google entrou, mas esse e-mail ainda não foi convidado
          para nenhuma casa. Peça para adicionarem seu e-mail em
          household_members.
        </Paragraph>
        <form action={signOut}>
          <Button htmlType="submit">Tentar com outra conta</Button>
        </form>
      </div>
    </main>
  );
}
