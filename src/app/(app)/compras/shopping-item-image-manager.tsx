"use client";

import { forwardRef } from "react";
import {
  EntityImageManager,
  type EntityImage,
  type EntityImageManagerHandle,
} from "@/components/ui/entity-image-manager";
import { removeShoppingItemImage, uploadShoppingItemImage } from "./actions";

export type ShoppingItemImage = EntityImage;
export type ShoppingItemImageManagerHandle = EntityImageManagerHandle;

export const ShoppingItemImageManager = forwardRef<
  ShoppingItemImageManagerHandle,
  { itemId: string | null; initialImages: ShoppingItemImage[] }
>(function ShoppingItemImageManager({ itemId, initialImages }, ref) {
  return (
    <EntityImageManager
      ref={ref}
      ownerId={itemId}
      initialImages={initialImages}
      fancyboxGroup={`shopping-item-manage-${itemId ?? "new"}`}
      uploadAction={uploadShoppingItemImage}
      removeAction={removeShoppingItemImage}
    />
  );
});
