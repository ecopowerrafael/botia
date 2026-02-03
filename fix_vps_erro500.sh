#!/bin/bash
# Script para corrigir erro 500 na VPS
# Uso: bash fix_vps_erro500.sh

HOST="46.202.147.151"
USER="root"
PASSWORD="2705#Data2705"

echo "╔════════════════════════════════════════════════════╗"
echo "║   CORRIGINDO ERRO 500 - VPS 46.202.147.151        ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Função para executar comando remoto
remote_exec() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no \
        "$USER@$HOST" "$1"
}

echo "[1/6] Conectando na VPS..."
if remote_exec "echo 'OK'" > /dev/null; then
    echo "✅ Conectado com sucesso"
else
    echo "❌ Falha na conexão"
    exit 1
fi

echo ""
echo "[2/6] Verificando Docker..."
remote_exec "docker --version"

echo ""
echo "[3/6] Parando containers antigos..."
remote_exec "cd /var/www && docker-compose down 2>&1 || echo 'Nenhum container'"

echo ""
echo "[4/6] Iniciando novos containers..."
remote_exec "cd /var/www && docker-compose up -d"

echo ""
echo "[5/6] Aguardando inicialização (30 segundos)..."
sleep 30

echo ""
echo "[6/6] Validando status..."
remote_exec "docker ps"

echo ""
echo "Testando endpoints..."
remote_exec "curl -s http://localhost:3000/health | head -20"

echo ""
echo "Recarregando Nginx..."
remote_exec "systemctl reload nginx && echo 'Nginx recarregado'"

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║           PROCESSO CONCLUÍDO!                      ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo "Proximos passos:"
echo "1. Aguarde 30 segundos"
echo "2. Teste em seu navegador: https://apipgsoft.shop"
echo "3. Se ainda houver erro:"
echo "   - Verifique: docker logs backend"
echo "   - Verifique: tail -50 /var/log/nginx/error.log"
echo ""
