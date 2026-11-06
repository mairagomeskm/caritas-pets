from datetime import datetime, timezone, timedelta
from typing import Any, Dict
from app.services.supabase_client import supabase
from app.services.audit import log_audit_access

async def run_retention_lifecycle_job(days_threshold: int = 60) -> Dict[str, Any]:
    timestamp = datetime.now(timezone.utc).isoformat()
    try:
        try:
            rpc_res = await supabase.rpc(
                "purge_abandoned_applications",
                {"_days_threshold": days_threshold},
            )
            if isinstance(rpc_res, list) and len(rpc_res) > 0 and isinstance(rpc_res[0], dict):
                first_row = rpc_res[0]
                purged_convs = first_row.get("purged_conversations", 0)
                purged_msgs = first_row.get("purged_messages", 0)
                return {
                    "success": True,
                    "purgedConversations": purged_convs,
                    "purgedAttachments": purged_msgs,
                    "message": f"Rotina concluída com sucesso via banco de dados: triagens inativas há mais de {days_threshold} dias foram higienizadas.",
                    "timestamp": timestamp,
                }
        except Exception:
            pass

        cutoff = (datetime.now(timezone.utc) - timedelta(days=days_threshold)).isoformat()
        convs = await supabase.select(
            "conversations",
            {"kind": "eq.pet", "last_message_at": f"lt.{cutoff}", "select": "id"},
        )
        conv_ids = [c["id"] for c in convs if "id" in c]
        purged_count = 0

        if conv_ids:
            conv_filter = f"in.({','.join(conv_ids)})"
            updated = await supabase.update(
                "messages",
                params={
                    "conversation_id": conv_filter,
                    "attachment_path": "not.is.null",
                    "select": "id",
                },
                values={
                    "attachment_path": None,
                    "body": "[Foto de moradia/anexo expurgado preventivamente conforme política de retenção de 60 dias da LGPD]",
                },
            )
            purged_count = len(updated)

        await log_audit_access(
            action="retention_cleanup_60d",
            actor_role="retention_worker",
            resource="screening_attachments",
            details={
                "daysThreshold": days_threshold,
                "abandonedConversationsScanned": len(conv_ids),
                "attachmentsPurged": purged_count,
                "executedAt": timestamp,
            },
        )

        return {
            "success": True,
            "purgedConversations": len(conv_ids),
            "purgedAttachments": purged_count,
            "message": f"{len(conv_ids)} conversas de triagem verificadas. {purged_count} anexos/fotos de moradia antigas foram removidos em conformidade com o Art. 16 da LGPD.",
            "timestamp": timestamp,
        }
    except Exception as err:
        return {
            "success": False,
            "purgedConversations": 0,
            "purgedAttachments": 0,
            "message": f"Falha na rotina de retenção: {err}",
            "timestamp": timestamp,
        }
