"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/data/household";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { PropertyStatus } from "@/lib/types/database";

const IMAGE_BUCKET = "Propertys";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365;

// Cache em memória do processo (não usa unstable_cache/revalidateTag do
// Next: o projeto não tem cacheComponents ligado, e essas APIs mudaram de
// assinatura no Next 16 acopladas àquele modelo). Simples e eficaz aqui
// porque Fluid Compute reaproveita a mesma instância entre requisições —
// não é um cache global entre instâncias, só evita reassinar a mesma URL
// (válida por 1 ano) a cada carga de página na MESMA instância quente.
const SIGNED_URL_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

function cacheSignedUrl(path: string, url: string) {
  signedUrlCache.set(path, { url, expiresAt: Date.now() + SIGNED_URL_CACHE_TTL_MS });
}

function invalidateSignedUrl(path: string) {
  signedUrlCache.delete(path);
}

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
  bedrooms: number | null;
  bathrooms: number | null;
  suites: number | null;
  parkingSpots: number | null;
  areaM2: number | null;
  mapsUrl: string | null;
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
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      suites: input.suites,
      parking_spots: input.parkingSpots,
      area_m2: input.areaM2,
      maps_url: input.mapsUrl,
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
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      suites: input.suites,
      parking_spots: input.parkingSpots,
      area_m2: input.areaM2,
      maps_url: input.mapsUrl,
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

  cacheSignedUrl(path, signed.signedUrl);
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
  invalidateSignedUrl(path);
  revalidatePath("/properties");
}

export async function getSignedImageUrls(paths: string[]) {
  if (paths.length === 0) return {};

  const now = Date.now();
  const result: Record<string, string> = {};
  const uncached = paths.filter((path) => {
    const cached = signedUrlCache.get(path);
    if (cached && cached.expiresAt > now) {
      result[path] = cached.url;
      return false;
    }
    return true;
  });

  if (uncached.length > 0) {
    // service_role, não o client de cookies: essa função roda fora do
    // request de um usuário específico. A RLS de storage já libera qualquer
    // usuário autenticado a assinar qualquer path do bucket, então isso não
    // amplia acesso nenhum.
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .createSignedUrls(uncached, SIGNED_URL_TTL_SECONDS);
    if (error) throw new Error(error.message);

    for (const item of data) {
      if (item.path && item.signedUrl) {
        cacheSignedUrl(item.path, item.signedUrl);
        result[item.path] = item.signedUrl;
      }
    }
  }

  return result;
}

// A listagem não traz `notes` (HTML do rich text, só lido ao abrir um
// imóvel) — busca sob demanda quando o drawer/form abre.
export async function getPropertyNotes(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("notes")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data.notes;
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
