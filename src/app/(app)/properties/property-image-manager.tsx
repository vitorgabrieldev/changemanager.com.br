"use client";

import { forwardRef } from "react";
import {
  EntityImageManager,
  type EntityImage,
  type EntityImageManagerHandle,
} from "@/components/ui/entity-image-manager";
import { removePropertyImage, uploadPropertyImage } from "./actions";

export type PropertyImage = EntityImage;
export type PropertyImageManagerHandle = EntityImageManagerHandle;

export const PropertyImageManager = forwardRef<
  PropertyImageManagerHandle,
  { propertyId: string | null; initialImages: PropertyImage[] }
>(function PropertyImageManager({ propertyId, initialImages }, ref) {
  return (
    <EntityImageManager
      ref={ref}
      ownerId={propertyId}
      initialImages={initialImages}
      fancyboxGroup={`property-manage-${propertyId ?? "new"}`}
      uploadAction={uploadPropertyImage}
      removeAction={removePropertyImage}
    />
  );
});
