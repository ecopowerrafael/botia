#!/usr/bin/env python3
"""
Upload dos arquivos compilados corretos para VPS
"""

import paramiko
import os

host = '46.202.147.151'
user = 'root'
password = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=20)

# Upload do arquivo prisma.service.js compilado
sftp = ssh.open_sftp()

# Upload do arquivo principal
local_file = r'C:\bot ia\apps\backend\dist\shared\prisma.service.js'
remote_file = '/var/www/botia/apps/backend/dist/shared/prisma.service.js'

try:
    print(f"Uploading {local_file} to {remote_file}")
    sftp.put(local_file, remote_file)
    print("✅ Upload completo!")
except Exception as e:
    print(f"❌ Erro: {e}")

sftp.close()
ssh.close()
