#!/usr/bin/env python3
import subprocess
import os

host = "46.202.147.151"
user = "root"
password = "2705#Data2705"

script = """
echo "[1] Corrigindo DATABASE_URL..."
sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bot_ia"|' /app/apps/backend/.env
grep DATABASE_URL /app/apps/backend/.env

echo ""
echo "[2] Copiando schema.prisma..."
cp /tmp/botia/prisma/schema.prisma /app/prisma/schema.prisma && echo "OK" || echo "ERRO/NAO ENCONTRADO"

echo ""
echo "[3] Regenerando Prisma..."
cd /app/apps/backend && npx prisma generate 2>&1 | tail -3

echo ""
echo "[4] Compilando TypeScript..."
cd /app/apps/backend && npx tsc --noEmitOnError false --skipLibCheck 2>&1 | head -2

echo ""
echo "[5] Reiniciando backend..."
pkill -9 -f 'node dist/main' || true
sleep 2
cd /app/apps/backend && npm run start:prod > /var/log/backend.log 2>&1 &

echo ""
echo "[6] Aguardando 10 segundos..."
sleep 10

echo ""
echo "==== VERIFICACAO ===="
ps aux | grep '[n]ode dist/main' && echo "OK - Backend rodando" || echo "ALERTA"
echo ""
echo "Ultimas linhas do log:"
tail -20 /var/log/backend.log
"""

# Usar expect ou sshpass se disponível
try:
    import pexpect
    print("[*] Usando pexpect para SSH...")
    
    child = pexpect.spawn(f'ssh -o StrictHostKeyChecking=no {user}@{host}', encoding='utf-8', timeout=180)
    child.expect('password:')
    child.sendline(password)
    child.expect('\\$')
    child.sendline('bash << EOF')
    child.sendline(script)
    child.sendline('EOF')
    child.expect('\\$')
    print(child.before)
    child.close()
    
except ImportError:
    print("[*] pexpect nao disponivel, tentando outro metodo...")
    
    # Metodo alternativo com expect (shell)
    try:
        expect_script = f"""#!/usr/bin/expect
set timeout 180
spawn ssh -o StrictHostKeyChecking=no {user}@{host}
expect "password:"
send "{password}\\r"
expect "$"
send "bash << 'EOFSCRIPT'\\r"
send {repr(script)}
send "EOFSCRIPT\\r"
expect "$"
interact
exit
"""
        with open('/tmp/auto_ssh.exp', 'w') as f:
            f.write(expect_script)
        
        result = subprocess.run(['expect', '/tmp/auto_ssh.exp'], capture_output=True, text=True, timeout=180)
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
            
    except FileNotFoundError:
        print("[ERRO] expect nao encontrado")
        print("")
        print("Alternativa: abra terminal SSH e cole isto:")
        print("")
        print(f"ssh root@{host}")
        print(f"[Digite a senha: {password}]")
        print("")
        print("Depois cole isto:")
        print(script)
