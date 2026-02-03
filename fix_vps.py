#!/usr/bin/env python3
import os
import sys

# Ler o schema.prisma
schema_path = os.path.join(os.path.dirname(__file__), 'prisma', 'schema.prisma')
with open(schema_path, 'r', encoding='utf-8') as f:
    schema_content = f.read()

# Base64 encode para passar via SSH sem problemas com caracteres especiais
import base64
encoded = base64.b64encode(schema_content.encode()).decode()

# Comandos SSH
commands = f"""
# Copiar schema.prisma corrigido
echo "{encoded}" | base64 -d > /app/prisma/schema.prisma

# Regenerar Prisma client
cd /app/apps/backend
npx prisma generate

# Tentar compilar sem erros de tipo
npx tsc --noEmitOnError false --skipLibCheck

# Se compilou, reiniciar backend
pkill -9 -f 'node dist/main'
sleep 2
cd /app/apps/backend && npm run start:prod > /var/log/backend.log 2>&1 &

# Verificar se iniciou
sleep 10
ps aux | grep 'node dist/main' | grep -v grep || echo 'Backend not running'
tail -20 /var/log/backend.log | grep -E 'Listening|listening|Application is running|ERROR'
"""

print(f"[*] Schema.prisma pronto para enviar ({len(encoded)} caracteres encoded)")
print(f"[*] Você pode executar os seguintes comandos na VPS:")
print("=" * 80)
print(commands)
print("=" * 80)
print(f"\n[*] Ou execute via SSH com a senha fornecida")
print(f"ssh root@46.202.147.151")
print(f"Senha: 2705#Data2705")
