import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print("Conectando à VPS...")
    ssh.connect('46.202.147.151', username='root', password='2705#Data2705', timeout=10)
    print("✓ Conectado!")
    
    # Remove containers antigos
    print("\n[1] Removendo containers antigos...")
    cmd = 'cd /var/www/botia && docker-compose down 2>&1'
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=15)
    print(stdout.read().decode())
    
    time.sleep(2)
    
    # Inicia containers
    print("\n[2] Iniciando containers...")
    cmd = 'cd /var/www/botia && docker-compose up -d 2>&1'
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=20)
    output = stdout.read().decode()
    print(output)
    
    time.sleep(5)
    
    # Verifica status
    print("\n[3] Status dos containers...")
    cmd = 'docker ps -a'
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=10)
    print(stdout.read().decode())
    
    # Logs do backend
    print("\n[4] Logs do backend...")
    cmd = 'docker logs botia-backend 2>&1 | tail -50'
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=10)
    logs = stdout.read().decode()
    print(logs if logs else "Sem logs")
    
    # Verifica porta 3000
    print("\n[5] Verificando porta 3000...")
    cmd = 'netstat -tlnp 2>/dev/null | grep 3000 || ss -tlnp 2>/dev/null | grep 3000'
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=10)
    port_info = stdout.read().decode()
    print(port_info if port_info else "Porta 3000 não está escutando")
    
    # Verifica processo dentro do container
    print("\n[6] Processo dentro do container backend...")
    cmd = 'docker exec botia-backend ps aux 2>&1 | head -20'
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=10)
    ps_output = stdout.read().decode()
    err_output = stderr.read().decode()
    print(ps_output if ps_output else f"Erro: {err_output}")
    
    ssh.close()

except Exception as e:
    print(f"Erro: {e}")
    import traceback
    traceback.print_exc()
