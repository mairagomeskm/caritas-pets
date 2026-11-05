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

function getEnvVar(key: string): string {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }
  return "";
}

function createSupabaseClient() {
  const supabaseUrl = getEnvVar("VITE_SUPABASE_URL") || getEnvVar("SUPABASE_URL");

  const supabasePublishableKey =
    getEnvVar("VITE_SUPABASE_PUBLISHABLE_KEY") ||
    getEnvVar("VITE_SUPABASE_ANON_KEY") ||
    getEnvVar("SUPABASE_PUBLISHABLE_KEY") ||
    getEnvVar("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabasePublishableKey) {
    console.warn(
      "Aviso: Variaveis de ambiente do Supabase nao configuradas (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).",
    );
    return createClient<Database>("https://placeholder.supabase.co", "placeholder-anon-key", {
      auth: { persistSession: false },
    });
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
