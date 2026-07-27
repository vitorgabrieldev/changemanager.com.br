"use client";

import { useEffect } from "react";
import { RouteError } from "@/components/layout/route-error";

export default function ShoppingListItemsError({
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
      title="Não foi possível carregar a lista"
      description="Algo falhou ao buscar os itens dessa lista. Tente de novo."
      onRetry={reset}
    />
  );
}
