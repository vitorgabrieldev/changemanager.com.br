import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CurrentMember = {
  id: string;
  household_id: string;
  display_name: string;
  color: string;
  email: string | null;
};

export type HouseholdMember = {
  id: string;
  display_name: string;
  color: string;
  joined_at: string | null;
};

export const getCurrentMember = cache(async (): Promise<CurrentMember | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: member } = await supabase
    .from("household_members")
    .select("id, household_id, display_name, color")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) return null;

  return {
    id: member.id,
    household_id: member.household_id,
    display_name: member.display_name,
    color: member.color,
    email: user.email ?? null,
  };
});

export const getHouseholdMembers = cache(
  async (householdId: string): Promise<HouseholdMember[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("household_members")
      .select("id, display_name, color, joined_at")
      .eq("household_id", householdId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },
);
