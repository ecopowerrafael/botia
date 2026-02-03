#!/usr/bin/env python3
import paramiko
import os
import sys
from pathlib import Path

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
                print(f"Creating remote dir: {remote_item}")
                sftp.mkdir(remote_item)
            upload_directory(sftp, local_item, remote_item)
        else:
            print(f"Uploading: {local_item} -> {remote_item}")
            sftp.put(local_item, remote_item)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print(f"Conectando a {host}...")
ssh.connect(host, username=user, password=password, timeout=20)

sftp = ssh.open_sftp()

# Local dist folder
local_dist = r'C:\bot ia\apps\backend\dist'
remote_dist = '/var/www/botia/apps/backend/dist'

print(f"\n📦 Enviando pasta dist...")
print(f"Local: {local_dist}")
print(f"Remote: {remote_dist}")

try:
    # Remove old dist on remote
    print(f"\n🗑️  Removendo dist antigo na VPS...")
    stdin, stdout, stderr = ssh.exec_command(f'rm -rf {remote_dist}')
    stdout.read()
    
    # Create new dist folder
    print(f"📁 Criando nova pasta dist...")
    stdin, stdout, stderr = ssh.exec_command(f'mkdir -p {remote_dist}')
    stdout.read()
    
    # Upload new dist
    print(f"\n⬆️  Upload iniciado...")
    upload_directory(sftp, local_dist, remote_dist)
    print(f"\n✅ Upload completo!")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    sys.exit(1)

sftp.close()

# Verify upload
print(f"\n🔍 Verificando upload...")
stdin, stdout, stderr = ssh.exec_command(f'ls -la {remote_dist} | head -20')
print(stdout.read().decode())

ssh.close()
print("✅ Concluído!")
