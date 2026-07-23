import { redirect } from "next/navigation";
import { getCurrentMember, getHouseholdMembers } from "@/lib/data/household";
import { createClient } from "@/lib/supabase/server";
import { getSignedImageUrls } from "./actions";
import { PropertiesView } from "./properties-view";

export default async function PropertiesPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  const supabase = await createClient();

  const [{ data: properties, error: propertiesError }, { data: ratings, error: ratingsError }, members] =
    await Promise.all([
      supabase
        .from("properties")
        .select("*")
        .eq("household_id", member.household_id)
        .order("created_at", { ascending: true }),
      supabase.from("property_ratings").select("*"),
      getHouseholdMembers(member.household_id),
    ]);

  if (propertiesError) throw new Error(propertiesError.message);
  if (ratingsError) throw new Error(ratingsError.message);

  const allImagePaths = (properties ?? []).flatMap((p) => p.images);
  const imageUrls = await getSignedImageUrls(allImagePaths);

  return (
    <PropertiesView
      initialProperties={properties ?? []}
      initialRatings={ratings ?? []}
      members={members}
      currentMemberId={member.id}
      imageUrls={imageUrls}
    />
  );
}
