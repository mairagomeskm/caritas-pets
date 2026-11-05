import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createSupabaseClient() {
  const supabaseUrl =
    import.meta.env["VITE_SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    process.env["SUPABASE_URL"];

  const supabasePublishableKey =
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    import.meta.env["VITE_SUPABASE_ANON_KEY"] ||
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    process.env["VITE_SUPABASE_ANON_KEY"] ||
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    process.env["SUPABASE_ANON_KEY"];

  if (!supabaseUrl || !supabasePublishableKey) {
    const missing = [
      ...(!supabaseUrl ? ["SUPABASE_URL / VITE_SUPABASE_URL"] : []),
      ...(!supabasePublishableKey ? ["SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_ANON_KEY"] : []),
    ];
    throw new Error(
      `Variáveis de ambiente do Supabase não encontradas: ${missing.join(", ")}. Verifique o arquivo .env`,
    );
  }

  return createClient<Database>(supabaseUrl, supabasePublishableKey, {
    global: {
      fetch: createSupabaseFetch(supabasePublishableKey),
    },
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

let supabaseInstance: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!supabaseInstance) supabaseInstance = createSupabaseClient();
    return Reflect.get(supabaseInstance, prop, receiver);
  },
});
