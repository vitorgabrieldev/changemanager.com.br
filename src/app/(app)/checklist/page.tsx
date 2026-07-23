import { redirect } from "next/navigation";
import { getCurrentMember, getHouseholdMembers } from "@/lib/data/household";
import { createClient } from "@/lib/supabase/server";
import { ChecklistView } from "./checklist-view";

export default async function ChecklistPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  const supabase = await createClient();

  const [{ data: items, error }, members] = await Promise.all([
    supabase
      .from("checklist_items")
      .select("*")
      .eq("household_id", member.household_id)
      .order("position", { ascending: true }),
    getHouseholdMembers(member.household_id),
  ]);

  if (error) throw new Error(error.message);

  return <ChecklistView initialItems={items ?? []} members={members} />;
}
