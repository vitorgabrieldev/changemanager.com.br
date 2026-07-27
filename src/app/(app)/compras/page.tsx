import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/data/household";
import { createClient } from "@/lib/supabase/server";
import { ShoppingListsView } from "./shopping-lists-view";

export default async function ShoppingListsPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  const supabase = await createClient();

  const { data: lists, error: listsError } = await supabase
    .from("shopping_lists")
    .select("id, name, created_at")
    .eq("household_id", member.household_id)
    .order("created_at", { ascending: true });

  if (listsError) throw new Error(listsError.message);

  const listIds = (lists ?? []).map((l) => l.id);

  // Só o necessário pra somar total/comprado por lista — o resto de cada
  // item só é buscado ao abrir a lista.
  let items: { list_id: string; price: number | null; purchased: boolean }[] = [];
  if (listIds.length > 0) {
    const { data, error } = await supabase
      .from("shopping_items")
      .select("list_id, price, purchased")
      .in("list_id", listIds);
    if (error) throw new Error(error.message);
    items = data ?? [];
  }

  return (
    <ShoppingListsView
      initialLists={lists ?? []}
      initialItems={items}
      householdId={member.household_id}
    />
  );
}
