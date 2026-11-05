import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type AuditAction =
  | "view_full_profile"
  | "view_cpf"
  | "view_proof_document"
  | "export_data"
  | "delete_request"
  | "share_applicant_data"
  | "anonymize_user";

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  actor_role: string;
  target_user_id: string | null;
  action: AuditAction | string;
  resource: string;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/**
 * Registra formalmente um evento de acesso a dados pessoais no AuditLog
 * Exigido para conformidade com o princípio da Prestação de Contas (Art. 6º, X e Art. 50 da LGPD)
 */
export async function logAuditAccess(params: {
  actorId?: string | null | undefined;
  actorRole?: string | undefined;
  targetUserId?: string | null | undefined;
  action: AuditAction | string;
  resource?: string | undefined;
  details?: Record<string, unknown> | undefined;
}): Promise<void> {
  try {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "system";

    const { error } = await supabase.from("audit_logs").insert({
      actor_id: params.actorId ?? null,
      actor_role: params.actorRole || "user",
      target_user_id: params.targetUserId ?? null,
      action: params.action,
      resource: params.resource || "profiles",
      details: (params.details || {}) as unknown as Json,
      user_agent: ua,
    });

    if (error) {
      console.warn("[AuditLog] Não foi possível registrar trilha de auditoria:", error.message);
    }
  } catch (err) {
    console.warn("[AuditLog] Erro silencioso ao auditar:", err);
  }
}

/**
 * Busca a trilha de acessos de um titular (Transparência Art. 18, IV da LGPD:
 * "informação das entidades públicas e privadas com as quais o controlador realizou uso compartilhado de dados")
 */
export async function fetchSubjectAuditTrail(userId: string): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .or(`target_user_id.eq.${userId},actor_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data as unknown as AuditLogEntry[]) || [];
  } catch (err) {
    console.error("[AuditLog] Erro ao recuperar trilha de auditoria do titular:", err);
    return [];
  }
}

/**
 * Busca a listagem completa de auditoria para o painel DPO / Admin
 */
export async function fetchAllAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return (data as unknown as AuditLogEntry[]) || [];
  } catch (err) {
    console.error("[AuditLog] Erro ao carregar logs administrativos:", err);
    return [];
  }
}
