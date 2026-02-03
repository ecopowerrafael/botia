#!/usr/bin/env python3
"""
Deploy final com sync de dist folder
"""
import paramiko
import time
import sys

host = '46.202.147.151'
user = 'root'
password = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print("🔌 Conectando VPS...")
    ssh.connect(host, username=user, password=password, timeout=30)
    
    # Aguardar upload terminar (verificar se sync_dist está ainda rodando)
    print("⏳ Aguardando conclusão do upload anterior (verificando a cada 10s)...")
    
    for attempt in range(60):  # Até 10 minutos
        stdin, stdout, stderr = ssh.exec_command('pgrep -f "sync_dist\|paramiko" | wc -l')
        count = int(stdout.read().decode().strip())
        
        if count == 0:
            print("✅ Upload anterior completou!")
            break
        
        print(f"  [{attempt*10}s] Ainda há {count} processos de upload...")
        time.sleep(10)
    
    # Verificar se prisma.service.js foi enviado corretamente
    print("\n🔍 Verificando prisma.service.js...")
    stdin, stdout, stderr = ssh.exec_command('ls -lh /var/www/botia/apps/backend/dist/shared/prisma.service.js')
    ls_output = stdout.read().decode().strip()
    
    if ls_output:
        print(f"✅ Arquivo encontrado:\n{ls_output}")
        
        # Verificar conteúdo (procurar por "datasources")
        stdin, stdout, stderr = ssh.exec_command('grep -o "datasources" /var/www/botia/apps/backend/dist/shared/prisma.service.js | wc -l')
        has_fix = int(stdout.read().decode().strip())
        
        if has_fix > 0:
            print("✅ ARQUIVO CORRIGIDO (contém 'datasources')!")
        else:
            print("❌ ARQUIVO AINDA ANTIGO (sem 'datasources')")
    else:
        print("❌ Arquivo NÃO encontrado!")
    
    print("\n" + "="*50)
    print("Deploy pronto para próxima fase!")
    print("="*50)
    
except Exception as e:
    print(f"❌ Erro: {e}")
    sys.exit(1)
finally:
    ssh.close()
