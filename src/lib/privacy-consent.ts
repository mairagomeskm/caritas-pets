import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { hashIdentifier } from "./crypto";

export type ConsentType =
  "termos_de_uso" | "politica_privacidade" | "compartilhamento_com_ong" | "comunicacao_marketing";

export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  version: string;
  status: "granted" | "revoked";
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Obtém o User Agent e um hash anônimo do IP ou identificador de rede do titular
 */
async function getClientMetadata() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "server";
  let ipHash = "local_hash";
  try {
    const rawSeed = `${ua}-${window.location.host}-${new Date().toDateString()}`;
    ipHash = await hashIdentifier(rawSeed);
  } catch {}
  return { ua, ipHash };
}

/**
 * Registra formalmente um consentimento do titular no banco de dados (ConsentLog)
 * Base Legal: Art. 7º, I e Art. 8º da LGPD (manifestação livre, informada e inequívoca)
 */
export async function recordConsent(params: {
  userId: string;
  consentType: ConsentType;
  version?: string;
  status?: "granted" | "revoked";
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { ua, ipHash } = await getClientMetadata();
    const version = params.version || "1.0";
    const status = params.status || "granted";

    const { error } = await supabase.from("consent_logs").insert({
      user_id: params.userId,
      consent_type: params.consentType,
      version,
      status,
      ip_address: ipHash,
      user_agent: ua,
      metadata: (params.metadata || {}) as unknown as Json,
    });

    if (error) {
      console.warn("[ConsentLog] Falha ao registrar consentimento:", error.message);
      // Fallback em localStorage para persistência de contingência
      try {
        const key = `consent:${params.userId}:${params.consentType}`;
        localStorage.setItem(
          key,
          JSON.stringify({ status, version, timestamp: new Date().toISOString() }),
        );
      } catch {}
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ConsentLog] Erro inesperado:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Revoga um consentimento existente (Art. 8º, § 5º da LGPD)
 */
export async function revokeConsent(params: {
  userId: string;
  consentType: ConsentType;
  reason?: string;
}): Promise<{ success: boolean; error?: string }> {
  return recordConsent({
    userId: params.userId,
    consentType: params.consentType,
    status: "revoked",
    metadata: {
      revoked_at: new Date().toISOString(),
      reason: params.reason || "Solicitado pelo titular",
    },
  });
}

/**
 * Consulta o histórico de consentimentos de um titular
 */
export async function getUserConsents(userId: string): Promise<ConsentRecord[]> {
  try {
    const { data, error } = await supabase
      .from("consent_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[ConsentLog] Falha ao buscar histórico de consentimento:", error.message);
      return [];
    }

    return (data as unknown as ConsentRecord[]) || [];
  } catch {
    return [];
  }
}

/**
 * Verifica se um titular possui um consentimento ativo específico
 */
export async function hasActiveConsent(userId: string, consentType: ConsentType): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("consent_logs")
      .select("status")
      .eq("user_id", userId)
      .eq("consent_type", consentType)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return false;
    return data[0]?.status === "granted";
  } catch {
    return false;
  }
}
