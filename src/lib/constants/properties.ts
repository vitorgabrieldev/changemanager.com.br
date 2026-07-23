import type { PropertyStatus } from "@/lib/types/database";

export const PROPERTY_STATUSES: {
  value: PropertyStatus;
  label: string;
  tagColor: string;
}[] = [
  { value: "candidato", label: "Candidato", tagColor: "blue" },
  { value: "visitado", label: "Visitado", tagColor: "gold" },
  { value: "descartado", label: "Descartado", tagColor: "default" },
  { value: "escolhido", label: "Escolhido", tagColor: "green" },
];

export function propertyStatusLabel(status: string) {
  return PROPERTY_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function propertyStatusColor(status: string) {
  return PROPERTY_STATUSES.find((s) => s.value === status)?.tagColor ?? "default";
}
