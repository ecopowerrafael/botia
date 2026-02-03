#!/usr/bin/env python3
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
            except:
                pass

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=30)

sftp = ssh.open_sftp()

print("📦 Sincronizando prisma atualizado...")
local = r'C:\bot ia\prisma'
remote = '/var/www/botia/prisma'

# Upload
for item in os.listdir(local):
    local_item = os.path.join(local, item)
    remote_item = f"{remote}/{item}"
    
    if not os.path.isdir(local_item):
        sftp.put(local_item, remote_item)
        print(f"  ✓ {item}")

sftp.close()

time.sleep(2)

print("\n🔧 Gerando Prisma Client (Prisma 7)...")

cmd = '''cd /var/www/botia && \\
export DATABASE_URL="postgresql://postgres:postgres2024@botia-postgres:5432/botia_db" && \\
npx prisma generate 2>&1
'''

stdin, stdout, stderr = ssh.exec_command(cmd)
time.sleep(10)

output = stdout.read().decode()
print(output[-1000:] if len(output) > 1000 else output)

# Verificar
print("\n✅ Verificação:")
stdin, stdout, stderr = ssh.exec_command('test -f /var/www/botia/node_modules/.prisma/client/index.d.ts && echo "✅ SUCCESS" || echo "❌ FAILED"')
print(stdout.read().decode())

ssh.close()
