import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function isNewSupabaseApiKey(value?: string): boolean {
  if (!value) return false;
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

    if (supabaseKey) {
      headers.set("apikey", supabaseKey);
    }
    return fetch(input, { ...init, headers });
  };
}

function createSupabaseClient() {
  const envSupabaseUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.SUPABASE_URL ||
    (typeof process !== "undefined" && process.env
      ? process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
      : "") ||
    "";

  const envSupabaseAnonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.SUPABASE_ANON_KEY ||
    import.meta.env.SUPABASE_PUBLISHABLE_KEY ||
    (typeof process !== "undefined" && process.env
      ? process.env.VITE_SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.SUPABASE_PUBLISHABLE_KEY
      : "") ||
    "";

  const supabaseUrl = envSupabaseUrl.trim();
  const supabasePublishableKey = envSupabaseAnonKey.trim();

  if (!supabaseUrl || !supabasePublishableKey) {
    console.warn(
      "[Carita's Pets] Aviso: Variáveis de ambiente VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY não encontradas. Configure-as no painel da Vercel (Settings > Environment Variables). Operando em fallback gracioso para evitar tela branca.",
    );
    return createClient<Database>(
      "https://placeholder-caritas.supabase.co",
      "placeholder-anon-key",
      {
        auth: { persistSession: false },
      },
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
