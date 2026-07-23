import type { ChecklistCategory } from "@/lib/types/database";

export const CHECKLIST_CATEGORIES: {
  value: ChecklistCategory;
  label: string;
  tagColor: string;
}[] = [
  { value: "documentacao", label: "Documentação", tagColor: "blue" },
  { value: "casa", label: "Casa", tagColor: "cyan" },
  { value: "contas", label: "Contas", tagColor: "gold" },
  { value: "compras", label: "Compras", tagColor: "purple" },
  { value: "moveis", label: "Móveis", tagColor: "volcano" },
  { value: "transporte", label: "Transporte", tagColor: "geekblue" },
  { value: "limpeza", label: "Limpeza", tagColor: "lime" },
  { value: "servicos", label: "Serviços", tagColor: "green" },
  { value: "saude", label: "Saúde", tagColor: "red" },
  { value: "escola", label: "Escola", tagColor: "magenta" },
  { value: "geral", label: "Geral", tagColor: "default" },
];

export function checklistCategoryLabel(category: string) {
  return (
    CHECKLIST_CATEGORIES.find((c) => c.value === category)?.label ?? category
  );
}

export function checklistCategoryColor(category: string) {
  return (
    CHECKLIST_CATEGORIES.find((c) => c.value === category)?.tagColor ??
    "default"
  );
}
