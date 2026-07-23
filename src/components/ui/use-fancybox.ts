"use client";

import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import { useEffect, type RefObject } from "react";

export function useFancybox(
  containerRef: RefObject<HTMLElement | null>,
  images: unknown[],
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    Fancybox.bind(container, "[data-fancybox]", { theme: "dark" });

    return () => {
      Fancybox.unbind(container);
      Fancybox.close();
    };
  }, [containerRef, images]);
}
