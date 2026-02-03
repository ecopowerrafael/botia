#!/usr/bin/env python3
import paramiko

host = '46.202.147.151'
user = 'root'
password = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=30)

sftp = ssh.open_sftp()

print("📦 Sincronizando package-lock.json...")

local = r'C:\bot ia\apps\backend\package-lock.json'
remote = '/var/www/botia/apps/backend/package-lock.json'

print(f"⬆️  {local}")
print(f"   -> {remote}")

sftp.put(local, remote)
print("✅ Enviado!")

sftp.close()
ssh.close()
