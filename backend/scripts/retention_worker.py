import argparse
import asyncio
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from backend.app.services.retention import run_retention_lifecycle_job

async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Rotina de Ciclo de Vida e Retenção de Dados (LGPD Art. 16)",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=60,
        help="Limite de dias de inatividade para expurgo de triagens (padrão: 60)",
    )
    args = parser.parse_args()

    print(f"[RetentionWorker] Iniciando rotina de expurgo (limite: {args.days} dias)...")
    res = await run_retention_lifecycle_job(args.days)
    if res.get("success"):
        print(f"[RetentionWorker] Sucesso: {res.get('message')}")
        print(f"  - Conversas verificadas: {res.get('purgedConversations')}")
        print(f"  - Anexos/moradias expurgados: {res.get('purgedAttachments')}")
        sys.exit(0)
    else:
        print(f"[RetentionWorker] Erro: {res.get('message')}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())

