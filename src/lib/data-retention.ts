import { supabase } from "@/integrations/supabase/client";
import { logAuditAccess } from "./audit-logger";

export interface RetentionJobResult {
  success: boolean;
  purgedConversations: number;
  purgedAttachments: number;
  message: string;
  timestamp: string;
}

export async function runRetentionLifecycleJob(daysThreshold = 60): Promise<RetentionJobResult> {
  const timestamp = new Date().toISOString();

  // 1. Tenta delegar para o serviço Python de retenção e ciclo de vida
  try {
    const apiBase =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "http://localhost:8000";
    const res = await fetch(`${apiBase}/api/retention/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days_threshold: daysThreshold }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.success === "boolean") {
        return data as RetentionJobResult;
      }
    }
  } catch {
    // Continua para fallback direto caso a API externa não esteja no ar
  }

  try {
    // 2. Executa via stored procedure no Supabase caso instalada
    const { data, error } = await (
      supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>
    )("purge_abandoned_applications", {
      _days_threshold: daysThreshold,
    });

    if (!error && Array.isArray(data) && data.length > 0 && data[0]) {
      const firstRow = data[0] as { purged_conversations?: number; purged_messages?: number };
      return {
        success: true,
        purgedConversations: firstRow.purged_conversations ?? 0,
        purgedAttachments: firstRow.purged_messages ?? 0,
        message: `Rotina concluída com sucesso via banco de dados: triagens inativas há mais de ${daysThreshold} dias foram higienizadas.`,
        timestamp,
      };
    }

    // 3. Fallback de aplicação cliente
    const cutoffDate = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000).toISOString();

    const { data: convs, error: convErr } = await supabase
      .from("conversations")
      .select("id")
      .eq("kind", "pet")
      .lt("last_message_at", cutoffDate);

    if (convErr || !convs) {
      throw new Error(convErr?.message || "Erro ao consultar conversas abandonadas.");
    }

    const convIds = convs.map((c) => c.id);
    let purgedCount = 0;

    if (convIds.length > 0) {
      const { data: updatedMsgs, error: msgErr } = await supabase
        .from("messages")
        .update({
          attachment_path: null,
          body: "[Foto de moradia/anexo expurgado preventivamente conforme política de retenção de 60 dias da LGPD]",
        })
        .in("conversation_id", convIds)
        .not("attachment_path", "is", null)
        .select("id");

      if (!msgErr && updatedMsgs) {
        purgedCount = updatedMsgs.length;
      }
    }

    await logAuditAccess({
      actorRole: "retention_worker",
      action: "retention_cleanup_60d",
      resource: "screening_attachments",
      details: {
        daysThreshold,
        abandonedConversationsScanned: convIds.length,
        attachmentsPurged: purgedCount,
        executedAt: timestamp,
      },
    });

    return {
      success: true,
      purgedConversations: convIds.length,
      purgedAttachments: purgedCount,
      message: `${convIds.length} conversas de triagem verificadas. ${purgedCount} anexos/fotos de moradia antigas foram removidos em conformidade com o Art. 16 da LGPD.`,
      timestamp,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      purgedConversations: 0,
      purgedAttachments: 0,
      message: `Falha na rotina de retenção: ${errorMsg}`,
      timestamp,
    };
  }
}
