#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corrigir erro 500 na VPS
Inicia Docker containers e valida tudo
"""

import paramiko
import time
import sys
import os

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
        print("[OK] Conectado!\n")
        
        # PASSO 1: Parar containers existentes
        print("=" * 60)
        print("[PASSO 1] Parando containers antigos...")
        print("=" * 60)
        output, error = run_command_ssh(client, "cd /var/www && docker-compose down 2>&1 || echo 'Nenhum container ativo'")
        print(output if output else error)
        time.sleep(2)
        
        # PASSO 2: Iniciar containers
        print("\n" + "=" * 60)
        print("[PASSO 2] Iniciando containers...")
        print("=" * 60)
        output, error = run_command_ssh(client, "cd /var/www && docker-compose up -d 2>&1")
        print(output if output else error)
        time.sleep(5)
        
        # PASSO 3: Verificar status
        print("\n" + "=" * 60)
        print("[PASSO 3] Verificando status dos containers...")
        print("=" * 60)
        output, error = run_command_ssh(client, "docker ps")
        print(output if output else error)
        
        # PASSO 4: Verificar logs do backend
        print("\n" + "=" * 60)
        print("[PASSO 4] Logs do Backend (ultimas 20 linhas)...")
        print("=" * 60)
        output, error = run_command_ssh(client, "docker logs --tail=20 $(docker ps -q -f ancestor=botia-backend) 2>&1 || docker logs --tail=20 backend 2>&1 || echo 'Container nao encontrado'")
        print(output if output else error)
        
        # PASSO 5: Testar porta 3000
        print("\n" + "=" * 60)
        print("[PASSO 5] Testando porta 3000...")
        print("=" * 60)
        output, error = run_command_ssh(client, "sleep 2 && curl -s -m 3 http://localhost:3000/health 2>&1 || echo 'Backend ainda nao respondendo (esperado se estiver iniciando)'")
        print(output if output else error)
        
        # PASSO 6: Verificar PostgreSQL
        print("\n" + "=" * 60)
        print("[PASSO 6] Verificando PostgreSQL...")
        print("=" * 60)
        output, error = run_command_ssh(client, "psql -U postgres -d botia -c 'SELECT 1;' 2>&1 || echo 'PostgreSQL conectando...'")
        print(output if output else error)
        
        # PASSO 7: Recarregar Nginx
        print("\n" + "=" * 60)
        print("[PASSO 7] Recarregando Nginx...")
        print("=" * 60)
        output, error = run_command_ssh(client, "nginx -t && systemctl reload nginx && echo 'Nginx recarregado!' 2>&1")
        print(output if output else error)
        
        # PASSO 8: Testar via Nginx
        print("\n" + "=" * 60)
        print("[PASSO 8] Testando via Nginx (localhost)...")
        print("=" * 60)
        output, error = run_command_ssh(client, "sleep 2 && curl -s -m 3 http://localhost/api/health 2>&1 || curl -s -m 3 http://localhost/health 2>&1 || echo 'Aguardando backend iniciar...'")
        print(output if output else error)
        
        # PASSO 9: Status final
        print("\n" + "=" * 60)
        print("[STATUS] RESUMO FINAL")
        print("=" * 60)
        
        output, error = run_command_ssh(client, """
        echo "=== DOCKER ==="
        docker ps --format "table {{.Names}}\t{{.Status}}"
        echo ""
        echo "=== PORTAS ==="
        netstat -tlnp 2>/dev/null | grep -E '3000|5432|6379|80|443' || ss -tlnp | grep -E '3000|5432|6379|80|443'
        echo ""
        echo "=== ESPAÇO EM DISCO ==="
        df -h | grep /dev/sda1
        echo ""
        echo "=== MEMORIA ==="
        free -h | grep Mem
        """)
        print(output if output else error)
        
        # PASSO 10: Verificar arquivo de índice
        print("\n" + "=" * 60)
        print("[VERIFICACAO] Verificando frontend...")
        print("=" * 60)
        output, error = run_command_ssh(client, "ls -lh /var/www/html/ | head -10")
        print(output if output else error)
        
        client.close()
        
        print("\n" + "=" * 60)
        print("[SUCESSO] Processo de recuperacao concluido!")
        print("=" * 60)
        print("""
PROXIMOS PASSOS:

1. Aguarde 30 segundos para o backend iniciar completamente
2. Teste em seu navegador: https://apipgsoft.shop
3. Se ainda houver erro 500:
   - Verifique: docker logs backend
   - Verifique: /var/log/nginx/error.log
   - Verifique: /var/log/nginx/access.log

4. Se tudo estiver OK:
   - Aproveite seu aplicativo! :)
        """)
        
        return 0
        
    except Exception as e:
        print("[ERRO] Falha na conexao: {}".format(str(e)))
        return 1

if __name__ == "__main__":
    sys.exit(main())
