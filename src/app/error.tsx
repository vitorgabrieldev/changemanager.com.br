"use client";

import { useEffect } from "react";
import { RouteError } from "@/components/layout/route-error";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <RouteError onRetry={reset} />;
}
