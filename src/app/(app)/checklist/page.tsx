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
      .select(
        "id, household_id, title, category, is_done, position, due_date, assigned_to, created_by, done_by, done_at, created_at, updated_at",
      )
      .eq("household_id", member.household_id)
      .order("position", { ascending: true }),
    getHouseholdMembers(member.household_id),
  ]);

  if (error) throw new Error(error.message);

  return (
    <ChecklistView
      initialItems={items ?? []}
      members={members}
      householdId={member.household_id}
    />
  );
}
