import { notFound, redirect } from "next/navigation";
import { getCurrentMember, getHouseholdMembers } from "@/lib/data/household";
import { createClient } from "@/lib/supabase/server";
import { getSignedShoppingImageUrls } from "../actions";
import { ShoppingItemsView } from "./shopping-items-view";

export default async function ShoppingListPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const { listId } = await params;
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  const supabase = await createClient();

  const [{ data: list, error: listError }, { data: items, error: itemsError }, members] =
    await Promise.all([
      supabase.from("shopping_lists").select("id, name").eq("id", listId).maybeSingle(),
      supabase
        .from("shopping_items")
        .select(
          "id, list_id, title, price, link, images, priority, assigned_to, purchased, purchased_at, purchased_by, position, created_by, created_at, updated_at",
        )
        .eq("list_id", listId)
        .order("position", { ascending: true }),
      getHouseholdMembers(member.household_id),
    ]);

  if (listError) throw new Error(listError.message);
  if (!list) notFound();
  if (itemsError) throw new Error(itemsError.message);

  const allImagePaths = (items ?? []).flatMap((i) => i.images);
  const imageUrls = await getSignedShoppingImageUrls(allImagePaths);

  return (
    <ShoppingItemsView
      list={list}
      initialItems={items ?? []}
      members={members}
      currentMemberId={member.id}
      imageUrls={imageUrls}
    />
  );
}
