"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/data/household";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { ShoppingItemPriority } from "@/lib/types/database";

const IMAGE_BUCKET = "ShoppingItems";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365;

// Mesmo cache em memória de src/app/(app)/properties/actions.ts — ver o
// comentário lá pra explicação completa (Fluid Compute reaproveita a
// instância, não é um cache global entre instâncias).
const SIGNED_URL_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

function cacheSignedUrl(path: string, url: string) {
  signedUrlCache.set(path, { url, expiresAt: Date.now() + SIGNED_URL_CACHE_TTL_MS });
}

function invalidateSignedUrl(path: string) {
  signedUrlCache.delete(path);
}

// ---------- Listas ----------

export async function createShoppingList(name: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Sem acesso");

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Dá um nome pra lista");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shopping_lists")
    .insert({ household_id: member.household_id, name: trimmed, created_by: member.id })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/compras");
  return data.id;
}

export async function renameShoppingList(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Dá um nome pra lista");

  const supabase = await createClient();
  const { error } = await supabase.from("shopping_lists").update({ name: trimmed }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/compras");
  revalidatePath(`/compras/${id}`);
}

export async function deleteShoppingList(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("shopping_lists").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/compras");
}

// ---------- Itens ----------

export type ShoppingItemInput = {
  title: string;
  description: string | null;
  price: number | null;
  link: string | null;
  priority: ShoppingItemPriority;
  assignedTo: string | null;
};

export async function createShoppingItem(listId: string, input: ShoppingItemInput) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Sem acesso");

  const title = input.title.trim();
  if (!title) throw new Error("Dá um nome pro item");

  const supabase = await createClient();

  // Mesma estratégia de retry do checklist_items — ver comentário lá.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: maxPositionRow } = await supabase
      .from("shopping_items")
      .select("position")
      .eq("list_id", listId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextPosition = (maxPositionRow?.position ?? 0) + 1;

    const { data, error } = await supabase
      .from("shopping_items")
      .insert({
        list_id: listId,
        title,
        description: input.description,
        price: input.price,
        link: input.link,
        priority: input.priority,
        assigned_to: input.assignedTo,
        position: nextPosition,
        created_by: member.id,
      })
      .select("id")
      .single();

    if (!error) {
      revalidatePath(`/compras/${listId}`);
      revalidatePath("/compras");
      return data.id;
    }
    if (error.code !== "23505") throw new Error(error.message);
  }

  throw new Error("Não foi possível criar o item, tente de novo.");
}

export async function updateShoppingItem(
  id: string,
  listId: string,
  input: ShoppingItemInput,
) {
  const title = input.title.trim();
  if (!title) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("shopping_items")
    .update({
      title,
      description: input.description,
      price: input.price,
      link: input.link,
      priority: input.priority,
      assigned_to: input.assignedTo,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/compras/${listId}`);
  revalidatePath("/compras");
}

export async function toggleShoppingItemPurchased(
  id: string,
  listId: string,
  purchased: boolean,
) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Sem acesso");

  const supabase = await createClient();
  const { error } = await supabase
    .from("shopping_items")
    .update(
      purchased
        ? { purchased: true, purchased_at: new Date().toISOString(), purchased_by: member.id }
        : { purchased: false, purchased_at: null, purchased_by: null },
    )
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/compras/${listId}`);
  revalidatePath("/compras");
}

export async function deleteShoppingItem(id: string, listId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("shopping_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/compras/${listId}`);
  revalidatePath("/compras");
}

// A listagem não traz `description` (HTML do rich text, só lido ao abrir um
// item) — busca sob demanda, mesmo padrão do checklist.
export async function getShoppingItemDescription(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shopping_items")
    .select("description")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data.description;
}

// ---------- Imagens ----------

export async function uploadShoppingItemImage(itemId: string, formData: FormData) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Sem acesso");

  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Arquivo inválido");
  if (!file.type.startsWith("image/")) throw new Error("Envie apenas imagens");

  const supabase = await createClient();

  const { data: item, error: fetchError } = await supabase
    .from("shopping_items")
    .select("images, list_id")
    .eq("id", itemId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${member.household_id}/${itemId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);

  const { error: updateError } = await supabase
    .from("shopping_items")
    .update({ images: [...(item.images ?? []), path] })
    .eq("id", itemId);
  if (updateError) throw new Error(updateError.message);

  const { data: signed, error: signError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (signError) throw new Error(signError.message);

  cacheSignedUrl(path, signed.signedUrl);
  revalidatePath(`/compras/${item.list_id}`);
  return { path, url: signed.signedUrl };
}

export async function removeShoppingItemImage(itemId: string, path: string) {
  const supabase = await createClient();

  const { data: item, error: fetchError } = await supabase
    .from("shopping_items")
    .select("images, list_id")
    .eq("id", itemId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const { error: updateError } = await supabase
    .from("shopping_items")
    .update({ images: (item.images ?? []).filter((p) => p !== path) })
    .eq("id", itemId);
  if (updateError) throw new Error(updateError.message);

  await supabase.storage.from(IMAGE_BUCKET).remove([path]);
  invalidateSignedUrl(path);
  revalidatePath(`/compras/${item.list_id}`);
}

export async function getSignedShoppingImageUrls(paths: string[]) {
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
