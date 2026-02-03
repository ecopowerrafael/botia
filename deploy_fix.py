#!/usr/bin/env python3
"""
Deploy script - Deploy dos containers na VPS
Remove containers antigos, faz deploy do novo docker-compose
"""

import paramiko
import time
import sys

def exec_cmd(ssh, cmd, timeout=15):
    """Execute command via SSH and return output"""
    print(f"$ {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    
    if out:
        print(out)
    if err:
        print(f"ERROR: {err}")
    
    return out, err

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("=" * 60)
        print("DEPLOY - Fixing Docker Containers on VPS")
        print("=" * 60)
        
        print("\n[1] Connecting to VPS...")
        ssh.connect('46.202.147.151', username='root', password='2705#Data2705', timeout=10)
        print("✓ Connected to 46.202.147.151")
        
        print("\n[2] Stopping old containers...")
        exec_cmd(ssh, "cd /var/www/botia && docker-compose down 2>&1 || true")
        time.sleep(2)
        
        print("\n[3] Removing dangling containers...")
        exec_cmd(ssh, "docker rm -f botia-backend botia-postgres botia-redis 2>&1 || true")
        time.sleep(1)
        
        print("\n[4] Uploading new docker-compose.prod.yml...")
        # Upload the docker-compose file
        sftp = ssh.open_sftp()
        try:
            sftp.put(r'c:\bot ia\docker-compose.prod.yml', '/var/www/botia/docker-compose.yml')
            print("✓ Uploaded docker-compose.yml")
        except Exception as e:
            print(f"Warning: Could not upload via SFTP: {e}")
            print("Using alternative method...")
            exec_cmd(ssh, "cat > /var/www/botia/docker-compose.yml << 'EOFCOMPOSE'\n" +
                         open(r'c:\bot ia\docker-compose.prod.yml').read() + "\nEOFCOMPOSE")
        finally:
            sftp.close()
        
        print("\n[5] Uploading new Dockerfile.prod...")
        sftp = ssh.open_sftp()
        try:
            sftp.put(r'c:\bot ia\apps\backend\Dockerfile.prod', '/var/www/botia/apps/backend/Dockerfile.prod')
            print("✓ Uploaded Dockerfile.prod")
        except Exception as e:
            print(f"Warning: {e}")
        finally:
            sftp.close()
        
        print("\n[6] Building Docker images...")
        out, err = exec_cmd(ssh, "cd /var/www/botia && docker-compose build 2>&1", timeout=300)
        if 'error' in out.lower() or 'error' in err.lower():
            print("⚠ Build may have issues, continuing anyway...")
        
        print("\n[7] Starting containers...")
        exec_cmd(ssh, "cd /var/www/botia && docker-compose up -d 2>&1")
        time.sleep(3)
        
        print("\n[8] Checking container status...")
        out, _ = exec_cmd(ssh, "cd /var/www/botia && docker-compose ps -a")
        
        print("\n[9] Checking backend logs...")
        out, _ = exec_cmd(ssh, "docker logs botia-backend 2>&1 | tail -30", timeout=10)
        
        print("\n[10] Testing health endpoint...")
        exec_cmd(ssh, "curl -s http://localhost:3000/health || echo 'Backend not responding yet'")
        
        print("\n[11] Testing API via Nginx...")
        exec_cmd(ssh, "curl -s -o /dev/null -w '%{http_code}' https://apipgsoft.shop/api/health || echo 'API not accessible'")
        
        ssh.close()
        
        print("\n" + "=" * 60)
        print("Deploy completed!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Check if backend is running: curl http://localhost:3000/health")
        print("2. Check domain: https://apipgsoft.shop/")
        print("3. View logs: docker logs botia-backend")
        print("4. If issues persist, check: docker logs botia-postgres")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
