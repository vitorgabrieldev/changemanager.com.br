import type { ShoppingItemPriority } from "@/lib/types/database";

export const SHOPPING_PRIORITIES: {
  value: ShoppingItemPriority;
  label: string;
  tagColor: string;
}[] = [
  { value: "essencial", label: "Essencial", tagColor: "red" },
  { value: "desejavel", label: "Desejável", tagColor: "blue" },
];

export function shoppingPriorityLabel(priority: string) {
  return SHOPPING_PRIORITIES.find((p) => p.value === priority)?.label ?? priority;
}

export function shoppingPriorityColor(priority: string) {
  return (
    SHOPPING_PRIORITIES.find((p) => p.value === priority)?.tagColor ?? "default"
  );
}
