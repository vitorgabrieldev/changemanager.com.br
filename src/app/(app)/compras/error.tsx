"use client";

import { useEffect } from "react";
import { RouteError } from "@/components/layout/route-error";

export default function ShoppingListsError({
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
      title="Não foi possível carregar as listas"
      description="Algo falhou ao buscar suas listas de compras. Tente de novo."
      onRetry={reset}
    />
  );
}
