import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Client server-only com a service_role key — ignora RLS. Nunca importar
 * daqui num Client Component (a key não tem prefixo NEXT_PUBLIC_ de propósito).
 *
 * Uso hoje: assinar URLs de imagens de imóveis dentro de `unstable_cache`,
 * que não pode depender de `cookies()` (o client normal via
 * `@/lib/supabase/server` precisa de cookies pra sessão do usuário).
 * A policy de storage já libera qualquer usuário autenticado a assinar
 * qualquer path do bucket "Propertys" — usar service_role aqui não abre
 * nenhum acesso que a RLS atual já não permitisse.
 */
export function createServiceRoleClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
