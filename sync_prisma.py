#!/usr/bin/env python3
"""
Sync prisma folder e gerar Prisma Client
"""
import paramiko
import os
import time

host = '46.202.147.151'
user = 'root'
password = '2705#Data2705'

def upload_directory(sftp, local_path, remote_path):
    """Recursively upload directory"""
    for item in os.listdir(local_path):
        local_item = os.path.join(local_path, item)
        remote_item = f"{remote_path}/{item}"
        
        if os.path.isdir(local_item):
            try:
                sftp.stat(remote_item)
            except:
                sftp.mkdir(remote_item)
            upload_directory(sftp, local_item, remote_item)
        else:
            try:
                sftp.put(local_item, remote_item)
                print(f"  ✓ {item}")
            except Exception as e:
                print(f"  ✗ {item}: {e}")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print("🔌 Conectando VPS...")
ssh.connect(host, username=user, password=password, timeout=30)

sftp = ssh.open_sftp()

print("\n📦 Sincronizando pasta prisma...")
local_prisma = r'C:\bot ia\prisma'
remote_prisma = '/var/www/botia/prisma'

# Remover pasta antiga
print(f"🗑️  Removendo {remote_prisma}...")
stdin, stdout, stderr = ssh.exec_command(f'rm -rf {remote_prisma}')
stdout.read()

print(f"📁 Criando {remote_prisma}...")
stdin, stdout, stderr = ssh.exec_command(f'mkdir -p {remote_prisma}')
stdout.read()

# Upload
print("⬆️  Uploading prisma folder:")
upload_directory(sftp, local_prisma, remote_prisma)

sftp.close()

print("\n✅ Prisma folder sincronizada!")

# Agora gerar Prisma Client
print("\n" + "="*60)
print("GERANDO PRISMA CLIENT")
print("="*60)

time.sleep(2)

print("\n1️⃣  Removendo .prisma antigas...")
stdin, stdout, stderr = ssh.exec_command('rm -rf /var/www/botia/apps/backend/node_modules/.prisma')
stdout.read()

print("\n2️⃣  Gerando Prisma Client...")
stdin, stdout, stderr = ssh.exec_command('''
cd /var/www/botia && \\
PRISMA_INTERNALS_DRY_RUN=false \\
npx prisma generate --schema /var/www/botia/prisma/schema.prisma 2>&1
''')
time.sleep(10)

output = stdout.read().decode()
error = stderr.read().decode()

print(output)
if error:
    print(f"Error output: {error[:500]}")

print("\n3️⃣  Verificando .prisma/client...")
stdin, stdout, stderr = ssh.exec_command('ls -la /var/www/botia/apps/backend/node_modules/.prisma/client/ 2>&1 | head -5')
result = stdout.read().decode()
if 'No such' in result:
    print("❌ Ainda não foi criado")
    print(result)
else:
    print("✅ .prisma/client criado:")
    print(result)

ssh.close()
