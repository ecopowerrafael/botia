"""
Deploy script - Connect and fix VPS
"""

import subprocess
import sys

def run_ssh_command(host, user, password, cmd):
    """Run SSH command using sshpass"""
    full_cmd = f'sshpass -p "{password}" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -o UserKnownHostsFile=/dev/null {user}@{host} "{cmd}"'
    
    result = subprocess.run(full_cmd, shell=True, capture_output=True, text=True, timeout=30)
    return result.stdout, result.stderr, result.returncode

def main():
    host = '46.202.147.151'
    user = 'root'
    password = '2705#Data2705'
    
    print("=" * 60)
    print("VPS Deploy - Ultra Simple Version")
    print("=" * 60)
    
    # Test connection
    print("\n[1] Testing SSH connection...")
    out, err, code = run_ssh_command(host, user, password, "echo 'SSH OK'")
    if code != 0:
        print(f"❌ SSH Error: {err}")
        print("\nAlternative: Paste this directly into your VPS terminal:")
        print("""
# Run this directly on the VPS:

cd /var/www/botia

# Stop old containers
docker-compose down 2>&1 || true
docker rm -f botia-* 2>&1 || true

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: botia-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: botia_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: botia-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend:
    image: node:22-alpine
    container_name: botia-backend
    working_dir: /app
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/botia_db
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - .:/app
    command: sh -c "npm ci --omit=dev && node apps/backend/dist/main"
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
EOF

# Start
docker-compose up -d

# Check
docker-compose ps
docker logs botia-backend

# Test
curl http://localhost:3000/health
        """)
        return 1
    
    print("✓ SSH OK")
    
    # Remove old containers
    print("\n[2] Stopping old containers...")
    out, _, _ = run_ssh_command(host, user, password, "cd /var/www/botia && docker-compose down 2>&1 || true && docker rm -f botia-backend botia-postgres botia-redis 2>&1 || true")
    print(out[:200] if out else "Done")
    
    # Create docker-compose
    print("\n[3] Creating docker-compose.yml...")
    compose_content = '''version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: botia-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: botia_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: botia-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend:
    image: node:22-alpine
    container_name: botia-backend
    working_dir: /app
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/botia_db
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - .:/app
    command: sh -c "npm ci --omit=dev && npm run prisma:migrate 2>&1 || true && node apps/backend/dist/main"
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
'''
    
    # Start containers
    print("\n[4] Starting containers...")
    out, _, _ = run_ssh_command(host, user, password, f"cd /var/www/botia && cat > docker-compose.yml << 'EOFCOMPOSE'\n{compose_content}\nEOFCOMPOSE\n && docker-compose up -d")
    print(out[:300] if out else "Done")
    
    import time
    time.sleep(5)
    
    # Check status
    print("\n[5] Container status...")
    out, _, _ = run_ssh_command(host, user, password, "cd /var/www/botia && docker-compose ps")
    print(out)
    
    # Check logs
    print("\n[6] Backend logs...")
    out, _, _ = run_ssh_command(host, user, password, "docker logs botia-backend 2>&1 | tail -20")
    print(out)
    
    print("\n" + "=" * 60)
    print("Deploy completed!")
    print("=" * 60)

if __name__ == '__main__':
    main()
