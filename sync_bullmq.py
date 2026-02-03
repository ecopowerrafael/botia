#!/usr/bin/env python3
import paramiko
import os

host = '46.202.147.151'
user = 'root'
password = '2705#Data2705'

def upload_directory(sftp, local_path, remote_path):
    """Upload directory recursively"""
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
            except:
                pass

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=30)

sftp = ssh.open_sftp()

print("📦 Sincronizando @nestjs/bullmq...")

local_dir = r'C:\bot ia\apps\backend\node_modules\@nestjs\bullmq'
remote_dir = '/var/www/botia/apps/backend/node_modules/@nestjs/bullmq'

print(f"Local: {local_dir}")
print(f"Remote: {remote_dir}")

# Create directory
stdin, stdout, stderr = ssh.exec_command(f'mkdir -p {remote_dir}')
stdout.read()

upload_directory(sftp, local_dir, remote_dir)

print("✅ @nestjs/bullmq sincronizado!")

sftp.close()

# Também sincronizar bullmq
print("\n📦 Sincronizando bullmq...")

local_dir = r'C:\bot ia\apps\backend\node_modules\bullmq'
remote_dir = '/var/www/botia/apps/backend/node_modules/bullmq'

stdin, stdout, stderr = ssh.exec_command(f'mkdir -p {remote_dir}')
stdout.read()

upload_directory(sftp, local_dir, remote_dir)

print("✅ bullmq sincronizado!")

sftp.close()
ssh.close()
