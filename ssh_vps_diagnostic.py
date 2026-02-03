#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para diagnosticar erro 500 na VPS
Conecta via SSH e analisa logs do backend
"""

import paramiko
import sys
import os
from io import StringIO

# Forçar UTF-8
if os.name == 'nt':
    os.system('chcp 65001 > nul')

# Configurações
HOST = "46.202.147.151"
USER = "root"
PASSWORD = "2705#Data2705"
PORT = 22

def run_command_ssh(client, command):
    """Executar comando via SSH e retornar output"""
    stdin, stdout, stderr = client.exec_command(command)
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return output, error

def main():
    try:
        print("[CONECTANDO] Conectando na VPS...")
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=10)
        print("[OK] Conectado com sucesso!\n")
        
        # Comando 1: Listar diretórios principais
        print("=" * 60)
        print("[ESTRUTURA] ESTRUTURA DE DIRETÓRIOS")
        print("=" * 60)
        output, error = run_command_ssh(client, "ls -la /var/www")
        print(output if output else error)
        
        # Comando 2: Status do Docker
        print("\n" + "=" * 60)
        print("[DOCKER] STATUS DO DOCKER")
        print("=" * 60)
        output, error = run_command_ssh(client, "docker ps -a")
        print(output if output else error)
        
        # Comando 3: Logs do backend
        print("\n" + "=" * 60)
        print("[LOGS] LOGS DO BACKEND (ultimas 50 linhas)")
        print("=" * 60)
        output, error = run_command_ssh(client, "docker logs --tail=50 $(docker ps -q -f ancestor=botia-backend) 2>&1 || docker logs --tail=50 backend 2>&1 || echo 'Container nao encontrado'")
        print(output if output else error)
        
        # Comando 4: Status de portas
        print("\n" + "=" * 60)
        print("[PORTAS] PORTAS ABERTAS")
        print("=" * 60)
        output, error = run_command_ssh(client, "netstat -tlnp | grep LISTEN || ss -tlnp | grep LISTEN")
        print(output if output else error)
        
        # Comando 5: Espaço em disco
        print("\n" + "=" * 60)
        print("[DISCO] ESPACO EM DISCO")
        print("=" * 60)
        output, error = run_command_ssh(client, "df -h")
        print(output if output else error)
        
        # Comando 6: Uso de memória
        print("\n" + "=" * 60)
        print("[MEMORIA] USO DE MEMORIA")
        print("=" * 60)
        output, error = run_command_ssh(client, "free -h")
        print(output if output else error)
        
        # Comando 7: Verificar nginx
        print("\n" + "=" * 60)
        print("[NGINX] STATUS NGINX")
        print("=" * 60)
        output, error = run_command_ssh(client, "nginx -t 2>&1 && systemctl status nginx --no-pager 2>&1 | head -20")
        print(output if output else error)
        
        # Comando 8: Logs de erro nginx
        print("\n" + "=" * 60)
        print("[ERROS] ERROS NGINX (ultimas 30 linhas)")
        print("=" * 60)
        output, error = run_command_ssh(client, "tail -30 /var/log/nginx/error.log 2>&1")
        print(output if output else error)
        
        # Comando 9: Logs de acesso nginx
        print("\n" + "=" * 60)
        print("[ACESSO] ACESSOS NGINX (ultimas 20 linhas com erro 500)")
        print("=" * 60)
        output, error = run_command_ssh(client, "tail -50 /var/log/nginx/access.log 2>&1 | grep '500' | tail -20")
        print(output if output else error)
        
        # Comando 10: Processos Node/npm
        print("\n" + "=" * 60)
        print("[PROCESSOS] PROCESSOS NODE/NPM")
        print("=" * 60)
        output, error = run_command_ssh(client, "ps aux | grep -i node | grep -v grep")
        print(output if output else "Nenhum processo Node encontrado")
        
        # Comando 11: Verificar se API está respondendo
        print("\n" + "=" * 60)
        print("[TESTE] TESTE DE API")
        print("=" * 60)
        output, error = run_command_ssh(client, "curl -v http://localhost:3000/health 2>&1 | head -30")
        print(output if output else error)
        
        client.close()
        print("\n[OK] Diagnostico concluido!")
        
    except Exception as e:
        print("[ERRO] Erro ao conectar: {}".format(str(e)))
        print("\nTentando alternativa com subprocess...")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
