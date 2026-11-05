import argparse
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from backend.app.services.exif_sanitizer import sanitize_image_bytes

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Higienizador de Metadados e Remoção de EXIF/GPS de Imagens (LGPD Art. 6, III)",
    )
    parser.add_argument("file_path", type=str, help="Caminho da imagem JPEG a ser higienizada")
    parser.add_argument("--output", type=str, default="", help="Caminho de saída (sobrescreve se omitido)")
    args = parser.parse_args()

    input_path = Path(args.file_path)
    if not input_path.exists():
        print(f"[SanitizeMedia] Arquivo não encontrado: {input_path}", file=sys.stderr)
        sys.exit(1)

    raw_bytes = input_path.read_bytes()
    cleaned = sanitize_image_bytes(raw_bytes, input_path.name)

    out_path = Path(args.output) if args.output else input_path
    out_path.write_bytes(cleaned)
    print(f"[SanitizeMedia] Imagem higienizada salva em {out_path} ({len(raw_bytes)} -> {len(cleaned)} bytes)")

if __name__ == "__main__":
    main()

