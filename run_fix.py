#!/usr/bin/env python3
import subprocess
import sys

host = "46.202.147.151"
user = "root"

script = """
echo "=== INICIANDO FIX DO VPS ==="
echo ""

echo "[1] Corrigindo DATABASE_URL..."
sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bot_ia"|' /app/apps/backend/.env
echo "OK - .env:"
grep DATABASE_URL /app/apps/backend/.env

echo ""
echo "[2] Copiando schema.prisma..."
cp /tmp/botia/prisma/schema.prisma /app/prisma/schema.prisma && echo "OK" || echo "ERRO"

echo ""
echo "[3] Regenerando Prisma..."
cd /app/apps/backend && npx prisma generate 2>&1 | tail -2

echo ""
echo "[4] Compilando TypeScript..."
cd /app/apps/backend && npx tsc --noEmitOnError false --skipLibCheck 2>&1 | head -3

echo ""
echo "[5] Parando backend antigo..."
pkill -9 -f 'node dist/main' || true
sleep 2

echo ""
echo "[6] Iniciando novo backend..."
cd /app/apps/backend && npm run start:prod > /var/log/backend.log 2>&1 &
echo "OK - Backend iniciado"

echo ""
echo "[7] Aguardando 10 segundos..."
sleep 10

echo ""
echo "============================================"
echo "=== VERIFICACAO FINAL ==="
echo "============================================"

echo ""
echo "Processo backend:"
ps aux | grep '[n]ode dist/main' && echo "OK - Rodando!" || echo "ALERTA - Nao encontrado"

echo ""
echo "Porta 3000:"
netstat -tlnp 2>/dev/null | grep 3000 && echo "OK - Escutando!" || echo "ALERTA"

echo ""
echo "Ultimas 20 linhas do log:"
echo "----"
tail -20 /var/log/backend.log
echo "----"
echo ""
echo "=== FIX COMPLETADO ==="
"""

cmd = f'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 {user}@{host} "bash -s"'

try:
    print("[*] Conectando ao VPS...")
    print(f"[*] Host: {host}")
    print("=" * 60)
    
    process = subprocess.Popen(
        cmd, 
        shell=True, 
        stdin=subprocess.PIPE, 
        stdout=subprocess.PIPE, 
        stderr=subprocess.STDOUT,
        text=True,
        encoding='utf-8'
    )
    
    stdout, _ = process.communicate(input=script, timeout=180)
    print(stdout)
    
    print("=" * 60)
    print("[OK] Execucao concluida!")
    
except subprocess.TimeoutExpired:
    print("[ERRO] Timeout - SSH pode estar travado")
    process.kill()
except KeyboardInterrupt:
    print("\n[ALERTA] Cancelado")
except Exception as e:
    print(f"[ERRO] {e}")
    sys.exit(1)
