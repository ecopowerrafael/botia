#!/usr/bin/env python3

import subprocess
import sys
import os

# VPS Credentials
VPS_HOST = "46.202.147.151"
VPS_USER = "root"
VPS_PASSWORD = "2705#Data2705"

# Commands to execute
commands = [
    # 1. Fix DATABASE_URL
    'sed -i "s|DATABASE_URL=.*|DATABASE_URL=\\"postgresql://postgres:postgres@localhost:5432/bot_ia\\"|" /app/apps/backend/.env && echo "✓ .env atualizado"',
    
    # 2. Copy schema.prisma
    'cp /tmp/botia/prisma/schema.prisma /app/prisma/schema.prisma && echo "✓ schema.prisma copiado"',
    
    # 3. Regenerate Prisma
    'cd /app/apps/backend && npx prisma generate && echo "✓ Prisma regenerado"',
    
    # 4. Kill old backend
    'pkill -9 -f "node dist/main" || true && echo "✓ Backend antigo parado"',
    
    # 5. Start new backend
    'cd /app/apps/backend && npm run start:prod > /var/log/backend.log 2>&1 & echo "✓ Backend iniciado"',
    
    # 6. Wait and check
    'sleep 5 && (ps aux | grep "[n]ode dist/main" && echo "✓ Backend está rodando") || echo "⚠️ Aguardando inicialização"',
    
    # 7. Show logs
    'echo "📋 Últimos logs:" && tail -15 /var/log/backend.log'
]

print("🚀 Executando fix no VPS...")
print(f"Host: {VPS_HOST}")
print(f"User: {VPS_USER}")
print("-" * 60)

# Execute all commands
all_commands = " && ".join(commands)

try:
    # Create SSH command with password
    import pexpect
    
    child = pexpect.spawn(f'ssh -o StrictHostKeyChecking=no {VPS_USER}@{VPS_HOST}')
    child.expect('password:', timeout=10)
    child.sendline(VPS_PASSWORD)
    child.expect('$', timeout=5)
    
    # Send all commands
    child.sendline(all_commands)
    child.expect('$', timeout=60)
    
    output = child.before.decode('utf-8', errors='ignore')
    print(output)
    
    print("-" * 60)
    print("✨ Fix concluído!")
    
except ImportError:
    print("⚠️ pexpect não instalado, tentando método alternativo...")
    print("Vou criar um script expect em shell...")
except Exception as e:
    print(f"❌ Erro: {e}")
    sys.exit(1)
