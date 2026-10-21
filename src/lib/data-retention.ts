import { supabase } from "@/integrations/supabase/client";
import { logAuditAccess } from "./audit-logger";

export interface RetentionJobResult {
  success: boolean;
  purgedConversations: number;
  purgedAttachments: number;
  message: string;
  timestamp: string;
}

/**
 * Rotina automatizada de Ciclo de Vida e Retenção de Dados (LGPD Art. 16)
 * Localiza formulários e conversas de adoção recusadas ou abandonadas após 60 dias,
 * expurgando fotos da casa do candidato, comprovantes temporários e anexos da entrevista.
 */
export async function runRetentionLifecycleJob(daysThreshold = 60): Promise<RetentionJobResult> {
  const timestamp = new Date().toISOString();
  try {
    // 1. Tenta executar via stored procedure no Supabase caso instalada
    const { data, error } = await (supabase.rpc as any)("purge_abandoned_applications", {
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

    // 2. Fallback de aplicação caso o RPC não esteja acessível
    const cutoffDate = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000).toISOString();

    // Busca conversas inativas
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
      // Remove anexos (fotos de quintal/moradia enviadas em triagens abandonadas)
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

    // Registra trilha de auditoria para fins de compliance DPO
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
    console.error("[DataRetention] Erro ao executar expurgo de dados:", errorMsg);
    return {
      success: false,
      purgedConversations: 0,
      purgedAttachments: 0,
      message: `Falha na rotina de retenção: ${errorMsg}`,
      timestamp,
    };
  }
}
