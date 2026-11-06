#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "=========================================="
echo "   Carita's Pets - Render Build Script    "
echo "=========================================="

# 1. Instalar dependências Python
echo "==> 1/3 Instalando dependências Python via pip..."
python -m pip install --upgrade pip
pip install -r requirements.txt

# 2. Garantir Node.js e NPM no ambiente
echo "==> 2/3 Verificando disponibilidade de Node.js e NPM..."
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo "Node.js/NPM não detectados nativamente. Baixando binário oficial do Node.js LTS..."
    NODE_VERSION="20.18.0"
    ARCH=$(uname -m)
    if [ "$ARCH" = "aarch64" ]; then
        NODE_DIST="node-v${NODE_VERSION}-linux-arm64"
    else
        NODE_DIST="node-v${NODE_VERSION}-linux-x64"
    fi

    mkdir -p "$HOME/.local"
    curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/${NODE_DIST}.tar.xz" -o /tmp/node.tar.xz
    tar -xJf /tmp/node.tar.xz -C "$HOME/.local"
    rm -f /tmp/node.tar.xz
    export PATH="$HOME/.local/${NODE_DIST}/bin:$PATH"
fi

echo "Node.js ativo: $(node -v)"
echo "NPM ativo:     $(npm -v)"

# 3. Instalar pacotes do frontend e gerar bundle do Vite
echo "==> 3/3 Instalando dependências npm e compilando Vite..."
npm install
npm run build

echo "=========================================="
echo "   Build concluído com sucesso!           "
echo "   Pasta 'dist' gerada com os arquivos.   "
echo "=========================================="
