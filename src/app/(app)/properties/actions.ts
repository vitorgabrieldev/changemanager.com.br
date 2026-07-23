"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/data/household";
import { createClient } from "@/lib/supabase/server";
import type { PropertyStatus } from "@/lib/types/database";

const IMAGE_BUCKET = "Propertys";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365;

function explainMissingImagesColumn(message: string) {
  if (message.includes("images") && message.includes("does not exist")) {
    return "A migration da coluna de imagens ainda não foi aplicada no banco.";
  }
  return message;
}

export type PropertyInput = {
  title: string;
  address: string | null;
  listingUrl: string | null;
  rentPrice: number | null;
  condoFee: number | null;
  iptu: number | null;
  status: PropertyStatus;
  notes: string | null;
};

export async function createProperty(input: PropertyInput) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Sem acesso");

  const title = input.title.trim();
  if (!title) throw new Error("Dá um nome pro imóvel");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .insert({
      household_id: member.household_id,
      title,
      address: input.address,
      listing_url: input.listingUrl,
      rent_price: input.rentPrice,
      condo_fee: input.condoFee,
      iptu: input.iptu,
      status: input.status,
      notes: input.notes,
      created_by: member.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/properties");
  return data.id;
}

export async function updateProperty(id: string, input: PropertyInput) {
  const title = input.title.trim();
  if (!title) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .update({
      title,
      address: input.address,
      listing_url: input.listingUrl,
      rent_price: input.rentPrice,
      condo_fee: input.condoFee,
      iptu: input.iptu,
      status: input.status,
      notes: input.notes,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/properties");
}

export async function deleteProperty(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/properties");
}

export async function uploadPropertyImage(propertyId: string, formData: FormData) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Sem acesso");

  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Arquivo inválido");
  if (!file.type.startsWith("image/")) throw new Error("Envie apenas imagens");

  const supabase = await createClient();

  const { data: property, error: fetchError } = await supabase
    .from("properties")
    .select("images")
    .eq("id", propertyId)
    .single();
  if (fetchError) throw new Error(explainMissingImagesColumn(fetchError.message));

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${member.household_id}/${propertyId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);

  const { error: updateError } = await supabase
    .from("properties")
    .update({ images: [...(property.images ?? []), path] })
    .eq("id", propertyId);
  if (updateError) throw new Error(updateError.message);

  const { data: signed, error: signError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (signError) throw new Error(signError.message);

  revalidatePath("/properties");
  return { path, url: signed.signedUrl };
}

export async function removePropertyImage(propertyId: string, path: string) {
  const supabase = await createClient();

  const { data: property, error: fetchError } = await supabase
    .from("properties")
    .select("images")
    .eq("id", propertyId)
    .single();
  if (fetchError) throw new Error(explainMissingImagesColumn(fetchError.message));

  const { error: updateError } = await supabase
    .from("properties")
    .update({ images: (property.images ?? []).filter((p) => p !== path) })
    .eq("id", propertyId);
  if (updateError) throw new Error(updateError.message);

  await supabase.storage.from(IMAGE_BUCKET).remove([path]);
  revalidatePath("/properties");
}

export async function getSignedImageUrls(paths: string[]) {
  if (paths.length === 0) return {};

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) throw new Error(error.message);

  const urlByPath: Record<string, string> = {};
  for (const item of data) {
    if (item.path && item.signedUrl) urlByPath[item.path] = item.signedUrl;
  }
  return urlByPath;
}

export async function upsertPropertyRating(propertyId: string, score: number) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Sem acesso");

  const supabase = await createClient();
  const { error } = await supabase.from("property_ratings").upsert(
    {
      property_id: propertyId,
      household_member_id: member.id,
      score,
    },
    { onConflict: "property_id,household_member_id" },
  );

  if (error) throw new Error(error.message);
  revalidatePath("/properties");
}
