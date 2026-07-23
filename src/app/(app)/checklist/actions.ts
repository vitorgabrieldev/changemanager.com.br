"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/data/household";
import { createClient } from "@/lib/supabase/server";
import type { ChecklistCategory } from "@/lib/types/database";

export type ChecklistItemInput = {
  title: string;
  category: ChecklistCategory;
  assignedTo: string | null;
  dueDate: string | null;
  description: string | null;
};

export async function createChecklistItem(input: ChecklistItemInput) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Sem acesso");

  const title = input.title.trim();
  if (!title) return;

  const supabase = await createClient();

  const { data: maxPositionRow } = await supabase
    .from("checklist_items")
    .select("position")
    .eq("household_id", member.household_id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (maxPositionRow?.position ?? 0) + 1;

  const { error } = await supabase.from("checklist_items").insert({
    household_id: member.household_id,
    title,
    category: input.category,
    assigned_to: input.assignedTo,
    due_date: input.dueDate,
    description: input.description,
    position: nextPosition,
    created_by: member.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/checklist");
}

export async function updateChecklistItem(
  id: string,
  input: ChecklistItemInput,
) {
  const title = input.title.trim();
  if (!title) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("checklist_items")
    .update({
      title,
      category: input.category,
      assigned_to: input.assignedTo,
      due_date: input.dueDate,
      description: input.description,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/checklist");
}

export async function toggleChecklistItem(id: string, isDone: boolean) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Sem acesso");

  const supabase = await createClient();
  const { error } = await supabase
    .from("checklist_items")
    .update(
      isDone
        ? {
            is_done: true,
            done_at: new Date().toISOString(),
            done_by: member.id,
          }
        : { is_done: false, done_at: null, done_by: null },
    )
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/checklist");
}

export async function deleteChecklistItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("checklist_items")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/checklist");
}
