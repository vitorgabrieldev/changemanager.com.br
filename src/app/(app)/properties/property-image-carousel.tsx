"use client";

import { EntityImageCarousel } from "@/components/ui/entity-image-carousel";
import type { PropertyImage } from "./property-image-manager";

export function PropertyImageCarousel({
  images,
  groupId,
}: {
  images: PropertyImage[];
  groupId: string;
}) {
  return <EntityImageCarousel images={images} groupId={`property-view-${groupId}`} />;
}
