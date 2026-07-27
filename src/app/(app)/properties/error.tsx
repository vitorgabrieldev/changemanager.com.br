"use client";

import { useEffect } from "react";
import { RouteError } from "@/components/layout/route-error";

export default function PropertiesError({
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
      title="Não foi possível carregar os imóveis"
      description="Algo falhou ao buscar a lista. Tente de novo."
      onRetry={reset}
    />
  );
}
