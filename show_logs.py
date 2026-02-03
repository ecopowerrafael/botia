#!/usr/bin/env python3
import paramiko
import time

HOST = '46.202.147.151'
USER = 'root'
PASSWORD = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=20)

stdin, stdout, stderr = ssh.exec_command("docker logs botia-backend 2>&1", timeout=15)
logs = stdout.read().decode()

print(logs)
ssh.close()
