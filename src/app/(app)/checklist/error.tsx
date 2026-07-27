"use client";

import { useEffect } from "react";
import { RouteError } from "@/components/layout/route-error";

export default function ChecklistError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <RouteError
      title="Não foi possível carregar o checklist"
      description="Algo falhou ao buscar os itens. Tente de novo."
      onRetry={reset}
    />
  );
}
