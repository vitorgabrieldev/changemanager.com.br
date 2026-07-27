import { redirect } from "next/navigation";
import { getCurrentMember, getHouseholdMembers } from "@/lib/data/household";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import { getSignedImageUrls } from "./actions";
import { PropertiesView } from "./properties-view";

export default async function PropertiesPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  const supabase = await createClient();

  const [{ data: properties, error: propertiesError }, members] =
    await Promise.all([
      supabase
        .from("properties")
        .select(
          "id, household_id, title, address, listing_url, rent_price, condo_fee, iptu, total_monthly_cost, distance_work_km, distance_market_km, status, bedrooms, bathrooms, suites, parking_spots, area_m2, maps_url, images, created_by, created_at, updated_at",
        )
        .eq("household_id", member.household_id)
        .order("created_at", { ascending: true }),
      getHouseholdMembers(member.household_id),
    ]);

  if (propertiesError) throw new Error(propertiesError.message);

  const propertyIds = (properties ?? []).map((p) => p.id);

  // Escopado por property_id em vez de trazer a tabela inteira e deixar só a
  // RLS filtrar linha a linha. .in() com array vazio é inválido no PostgREST,
  // então só consulta quando existe pelo menos um imóvel.
  let ratings: Database["public"]["Tables"]["property_ratings"]["Row"][] = [];
  if (propertyIds.length > 0) {
    const { data, error } = await supabase
      .from("property_ratings")
      .select("*")
      .in("property_id", propertyIds);
    if (error) throw new Error(error.message);
    ratings = data ?? [];
  }

  const allImagePaths = (properties ?? []).flatMap((p) => p.images);
  const imageUrls = await getSignedImageUrls(allImagePaths);

  return (
    <PropertiesView
      initialProperties={properties ?? []}
      initialRatings={ratings}
      members={members}
      currentMemberId={member.id}
      householdId={member.household_id}
      imageUrls={imageUrls}
    />
  );
}
