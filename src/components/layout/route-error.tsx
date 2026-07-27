"use client";

import { Button, Typography } from "antd";
import { PiWarningCircle } from "react-icons/pi";

const { Title, Paragraph } = Typography;

export function RouteError({
  title = "Algo deu errado",
  description = "Não foi possível carregar esta página. Tente de novo.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry: () => void;
}) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-sm border border-border bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-danger-soft text-danger">
          <PiWarningCircle className="text-xl" />
        </div>
        <Title level={4} className="!mb-1 !text-foreground-strong">
          {title}
        </Title>
        <Paragraph className="text-foreground-muted">{description}</Paragraph>
        <Button type="primary" onClick={onRetry}>
          Tentar de novo
        </Button>
      </div>
    </main>
  );
}
