# 🚀 Guia Completo: Setup VPS do Zero até Produção

## 📋 Índice
1. [Escolha do SO](#1-escolha-do-sistema-operacional)
2. [Configuração Inicial do VPS](#2-configuração-inicial-do-vps)
3. [Instalação de Dependências](#3-instalação-de-dependências)
4. [Configuração do Docker](#4-configuração-do-docker)
5. [Deploy da Aplicação](#5-deploy-da-aplicação)
6. [Configuração SSL/TLS](#6-configuração-ssltls)
7. [Monitoramento](#7-monitoramento-e-alertas)

---

# 1. Escolha do Sistema Operacional

## ✅ Opções Recomendadas

### 🏆 **OPÇÃO 1: Ubuntu 24.04 LTS (RECOMENDADO)**
```
✅ Suporte até 2036
✅ Melhor compatibilidade
✅ Maior comunidade
✅ Melhor documentação
✅ Mais pacotes disponíveis
```

### 🥈 **OPÇÃO 2: Debian 12 (Stable)**
```
✅ Mais estável
✅ Menos updates
✅ Menor overhead
⚠️ Documentação menor
```

### 🥉 **OPÇÃO 3: CentOS Stream / RHEL**
```
✅ Enterprise
⚠️ Packages diferentes
⚠️ Comandos diferentes
❌ Evite se iniciante
```

---

## **📌 Recomendação Final: Ubuntu 24.04 LTS**

### Especificações ao criar o VPS:
```
• SO: Ubuntu 24.04 LTS
• RAM: 16 GB
• vCPU: 4 cores
• Storage: 100 GB SSD
• Região: Próxima ao seu público
• IPv4: 1
• IPv6: Sim (opcional)
```

---

# 2. Configuração Inicial do VPS

## 2.1 Conectar ao VPS

### Windows (PowerShell):
```powershell
# Copiar chave SSH (se tiver)
scp -r C:\caminho\sua-chave.pem user@seu-vps-ip:/home/user/.ssh/

# OU conectar direto
ssh -i "C:\caminho\sua-chave.pem" root@seu-vps-ip
```

### macOS/Linux:
```bash
ssh -i ~/.ssh/sua-chave.pem root@seu-vps-ip
```

### Se receber erro de permissões:
```bash
# Linux/macOS
chmod 600 ~/.ssh/sua-chave.pem

# Windows PowerShell
icacls "C:\caminho\sua-chave.pem" /inheritance:r /grant:r "%USERNAME%:(F)"
```

---

## 2.2 Atualizar Sistema

```bash
# Atualizar lista de pacotes
sudo apt update

# Atualizar sistema
sudo apt upgrade -y

# Instalar essenciais
sudo apt install -y \
    curl \
    wget \
    git \
    build-essential \
    libssl-dev \
    libffi-dev \
    htop \
    vim \
    nano
```

---

## 2.3 Criar Usuário (Não usar root)

```bash
# Criar usuário
sudo useradd -m -s /bin/bash appuser

# Dar permissões sudo
sudo usermod -aG sudo appuser

# Definir senha
sudo passwd appuser

# Copiar chave SSH para novo usuário
sudo mkdir -p /home/appuser/.ssh
sudo cp /root/.ssh/authorized_keys /home/appuser/.ssh/
sudo chown -R appuser:appuser /home/appuser/.ssh
sudo chmod 700 /home/appuser/.ssh
sudo chmod 600 /home/appuser/.ssh/authorized_keys

# Logout e reconectar
exit
ssh -i sua-chave.pem appuser@seu-vps-ip
```

---

## 2.4 Configurar Firewall

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH (importante!)
sudo ufw allow 22/tcp

# Permitir HTTP
sudo ufw allow 80/tcp

# Permitir HTTPS
sudo ufw allow 443/tcp

# Aplicar regras
sudo ufw reload

# Ver status
sudo ufw status
```

---

## 2.5 Configurar Swap (se RAM < 8GB)

```bash
# Criar 4GB de swap
sudo dd if=/dev/zero of=/swapfile bs=1G count=4

# Definir permissões
sudo chmod 600 /swapfile

# Ativar swap
sudo mkswap /swapfile
sudo swapon /swapfile

# Persistir após reboot
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verificar
free -h
```

---

# 3. Instalação de Dependências

## 3.1 Instalar Node.js 22

```bash
# Adicionar repositório NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar versão
node --version  # v22.x.x
npm --version   # 10.x.x

# Atualizar npm para versão mais recente
sudo npm install -g npm@latest
```

---

## 3.2 Instalar Docker

```bash
# Remover Docker antigo (se existir)
sudo apt remove -y docker docker-engine docker.io containerd runc

# Adicionar repositório Docker
sudo apt install -y ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Adicionar usuário ao grupo docker (evita sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verificar
docker --version
docker run hello-world
```

---

## 3.3 Instalar Docker Compose

```bash
# Verificar se já foi instalado
docker compose version

# Se não tiver, instalar manualmente
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Dar permissão
sudo chmod +x /usr/local/bin/docker-compose

# Verificar
docker-compose --version
```

---

## 3.4 Instalar Git

```bash
# Já deve estar instalado em 2.2, mas confirmar
git --version

# Se não tiver
sudo apt install -y git

# Configurar Git (recomendado)
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

---

## 3.5 Instalar Ferramentas de Monitoramento

```bash
# htop (visualizador de processos)
sudo apt install -y htop

# bottom (alternativa moderna)
sudo apt install -y bottom

# iotop (monitor de I/O)
sudo apt install -y iotop

# nethogs (consumo de rede)
sudo apt install -y nethogs
```

---

# 4. Configuração do Docker

## 4.1 Configurar Limite de Memória do Docker

```bash
# Editar daemon.json do Docker
sudo nano /etc/docker/daemon.json
```

**Adicionar/modificar:**
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "memory": "15g",
  "memory-swap": "16g",
  "cpus": "3.5"
}
```

**Salvar:** `Ctrl + X` → `Y` → `Enter`

```bash
# Recarregar configuração
sudo systemctl daemon-reload
sudo systemctl restart docker

# Verificar
docker info | grep -i memory
```

---

## 4.2 Criar Rede Docker

```bash
# Criar rede para os containers se comunicarem
docker network create app-network

# Listar redes
docker network ls
```

---

# 5. Deploy da Aplicação

## 5.1 Clonar o Repositório

```bash
# Criar diretório de aplicação
mkdir -p ~/apps
cd ~/apps

# Clonar repositório
git clone https://seu-repositorio-github.com/seu-usuario/seu-projeto.git
cd seu-projeto

# Ou se usar arquivo ZIP
# wget https://seu-link/projeto.zip
# unzip projeto.zip
# cd projeto
```

---

## 5.2 Estrutura de Pastas Esperada

```
seu-projeto/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── ...
│   └── frontend/
├── infra/
│   ├── docker-compose.yml
│   ├── nginx.conf
│   ├── .env.production
│   ├── .env.development
│   └── .env.staging
├── prisma/
│   └── schema.prisma
└── ...
```

---

## 5.3 Configurar Variáveis de Ambiente

### Copiar arquivos .env

```bash
cd ~/apps/seu-projeto

# Para produção
cp infra/.env.production .env

# Para desenvolvimento
cp infra/.env.development .env.dev
```

### Editar .env para Produção

```bash
nano .env
```

**Configurar valores críticos:**

```env
# ========== NODE ==========
NODE_ENV=production
LOG_LEVEL=info
PORT=3000

# ========== DATABASE ==========
POSTGRES_USER=appuser
POSTGRES_PASSWORD=GERE_UMA_SENHA_FORTE_AQUI
POSTGRES_DB=appdb_prod
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# ========== REDIS ==========
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=GERE_OUTRA_SENHA_FORTE_AQUI
REDIS_DB=0

# ========== JWT ==========
JWT_SECRET=GERE_UMA_STRING_ALEATORIRA_LONGA_64_CARACTERES_AQUI
JWT_EXPIRATION=7d

# ========== CORS ==========
CORS_ORIGIN=https://seu-dominio.com

# ========== EVOLUTION API ==========
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_TOKEN=seu-token-aqui

# ========== OLLAMA ==========
OLLAMA_API_URL=http://ollama:11434
OLLAMA_MODEL=mistral

# ========== EMAIL ==========
SMTP_HOST=smtp.seu-provedor.com
SMTP_PORT=587
SMTP_USER=seu-email@seu-dominio.com
SMTP_PASSWORD=sua-senha-app
SMTP_FROM=noreply@seu-dominio.com

# ========== AWS (Opcional) ==========
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=sua-chave
AWS_SECRET_ACCESS_KEY=seu-secret
AWS_S3_BUCKET=seu-bucket

# ========== RATE LIMITING ==========
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=900000
```

**Gerar senhas fortes:**

```bash
# Linux/macOS
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object {[byte](Get-Random -Maximum 256)}))
```

---

## 5.4 Preparar Diretórios de Volumes

```bash
# Criar diretórios para volumes
mkdir -p ~/data/{postgres,redis,ollama,evolution,nginx}

# Dar permissões
chmod -R 755 ~/data

# Verificar
ls -la ~/data
```

---

## 5.5 Build do Backend (Opcional - Docker faz automaticamente)

```bash
cd ~/apps/seu-projeto

# Build da imagem (pode levar 5-10 minutos)
docker build -t seu-usuario/seu-projeto-backend:latest apps/backend/

# Verificar
docker images
```

---

## 5.6 Iniciar os Serviços com Docker Compose

```bash
cd ~/apps/seu-projeto/infra

# Iniciar todos os serviços em background
docker-compose up -d

# Verificar status
docker-compose ps

# Acompanhar logs em tempo real (Ctrl+C para sair)
docker-compose logs -f

# Ver logs de serviço específico
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f ollama
```

---

## 5.7 Verificar se Tudo Está Rodando

```bash
# Verificar containers
docker ps

# Deve retornar algo como:
# CONTAINER ID   IMAGE                          STATUS
# abc123...      seu-projeto-backend:latest     Up 2 minutes
# def456...      postgres:16-alpine             Up 2 minutes
# ghi789...      redis:7-alpine                 Up 2 minutes
# jkl012...      ollama/ollama                  Up 2 minutes
# mno345...      evolution-api                  Up 2 minutes
# pqr678...      nginx:alpine                   Up 2 minutes

# Testar API
curl http://localhost:3000/health
# Deve retornar: {"status":"ok"}

# Testar Nginx
curl http://localhost/health
# Deve retornar: {"status":"ok"}
```

---

# 6. Configuração SSL/TLS

## 6.1 Instalar Certbot (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Se não tiver nginx instalado localmente (está em Docker):
# Usar standalone para gerar certificado
```

---

## 6.2 Gerar Certificado SSL/TLS

### Opção A: Usando Certbot Standalone (Recomendado)

```bash
# Parar nginx temporariamente
cd ~/apps/seu-projeto/infra
docker-compose down nginx

# Gerar certificado
sudo certbot certonly --standalone \
  -d seu-dominio.com \
  -d www.seu-dominio.com \
  --email seu-email@seu-dominio.com \
  --agree-tos \
  --no-eff-email

# Certificados estarão em:
# /etc/letsencrypt/live/seu-dominio.com/

# Copiar para diretório Docker
sudo cp -r /etc/letsencrypt/live/seu-dominio.com /home/appuser/certs/
sudo chown -R appuser:appuser /home/appuser/certs/

# Iniciar nginx novamente
docker-compose up -d nginx
```

---

### Opção B: Usando Docker + Certbot

```bash
# Criar certificado dentro do container
docker run --rm \
  -v ~/certs:/etc/letsencrypt \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  -d seu-dominio.com \
  --email seu-email@seu-dominio.com \
  --agree-tos \
  --no-eff-email
```

---

## 6.3 Configurar Auto-Renovação

```bash
# Criar script de renovação
sudo tee /etc/cron.d/certbot-renewal > /dev/null <<EOF
# Renovar certificado a cada 2 meses
0 3 1 */2 * root certbot renew --quiet && docker-compose -f ~/apps/seu-projeto/infra/docker-compose.yml reload nginx
EOF

# Verificar
sudo cat /etc/cron.d/certbot-renewal
```

---

## 6.4 Atualizar docker-compose.yml com SSL

```bash
# Editar docker-compose.yml
nano infra/docker-compose.yml
```

**Adicionar volumes ao serviço nginx:**

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ~/certs/seu-dominio.com:/etc/nginx/ssl:ro  # ← ADICIONAR
      - ~/data/nginx:/var/cache/nginx
    depends_on:
      - backend
    networks:
      - app-network
```

**Recarregar:**

```bash
docker-compose down
docker-compose up -d
```

---

# 7. Monitoramento e Alertas

## 7.1 Visualizar Uso de Recursos em Tempo Real

```bash
# Ver uso em tempo real
docker stats

# Ver em interface mais amigável
bottom

# Ver árvore de processos
ps aux | grep docker

# Ver uso de memória por container
docker stats --no-stream
```

---

## 7.2 Logs de Erros

```bash
# Ver todos os logs
docker-compose logs

# Ver logs últimas 100 linhas
docker-compose logs --tail=100

# Follow de logs (tempo real)
docker-compose logs -f

# Logs de um serviço específico
docker-compose logs -f backend

# Logs com timestamp
docker-compose logs -f --timestamps
```

---

## 7.3 Verificar Saúde dos Serviços

```bash
# Health check do backend
curl -i http://localhost:3000/health

# Health check do nginx
curl -i http://localhost:80/health

# Health check do PostgreSQL
docker-compose exec postgres pg_isready -U appuser

# Health check do Redis
docker-compose exec redis redis-cli ping
# Deve retornar: PONG

# Health check do Ollama
curl http://localhost:11434/api/tags
```

---

## 7.4 Configurar Alertas com Log Agrupado

```bash
# Criar script de monitoramento
cat > ~/monitor.sh << 'EOF'
#!/bin/bash

# Monitorar uso de memória
MEMORY=$(docker stats --no-stream --format "{{.MemUsage}}")
echo "$(date) - Memory: $MEMORY" >> ~/monitor.log

# Se memória > 90%
if (( $(echo "$MEMORY" | awk '{print $1}') > 14 )); then
  echo "⚠️ ALERTA: Memória acima de 90%" >> ~/monitor.log
fi

# Monitorar status dos containers
docker-compose -f ~/apps/seu-projeto/infra/docker-compose.yml ps >> ~/monitor.log
EOF

# Dar permissão
chmod +x ~/monitor.sh

# Agendar para rodar a cada 5 minutos
crontab -e
# Adicionar linha:
# */5 * * * * /home/appuser/monitor.sh
```

---

## 7.5 Dashboard Web (Opcional - Portainer)

```bash
# Instalar Portainer para gerenciar Docker
docker run -d \
  --name portainer \
  --restart always \
  -p 9000:9000 \
  -p 8000:8000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce

# Acessar em http://seu-vps-ip:9000
# Criar usuário admin na primeira vez
```

---

# 8. Testes Finais e Verificações

## 8.1 Teste de Conectividade

```bash
# De seu computador local:

# Testar HTTP (deve redirecionar para HTTPS)
curl -i http://seu-dominio.com/health

# Testar HTTPS
curl -i https://seu-dominio.com/health

# Testar DNS
nslookup seu-dominio.com

# Teste de latência
ping seu-dominio.com
```

---

## 8.2 Teste de Carga (Opcional)

```bash
# Instalar Apache Bench
sudo apt install -y apache2-utils

# Teste simples: 100 requisições, 10 simultâneas
ab -n 100 -c 10 https://seu-dominio.com/health

# Teste mais intenso: 1000 requisições, 50 simultâneas
ab -n 1000 -c 50 https://seu-dominio.com/health
```

---

## 8.3 Verificação de Segurança

```bash
# Verificar se SSL está funcionando
curl -I https://seu-dominio.com

# Ver certificado
openssl s_client -connect seu-dominio.com:443

# Verificar headers de segurança
curl -I https://seu-dominio.com | grep -i "X-"

# Teste SSL/TLS com nmap
sudo apt install -y nmap
nmap --script ssl-enum-ciphers -p 443 seu-dominio.com
```

---

## 8.4 Backup de Dados

```bash
# Criar backup PostgreSQL
docker-compose exec postgres pg_dump -U appuser appdb_prod > ~/backups/backup-$(date +%Y%m%d-%H%M%S).sql

# Criar diretório de backups
mkdir -p ~/backups

# Script de backup automático
cat > ~/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/appuser/backups"
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker-compose -f ~/apps/seu-projeto/infra/docker-compose.yml exec -T postgres \
  pg_dump -U appuser appdb_prod | gzip > $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql.gz

# Manter apenas últimos 7 backups
find $BACKUP_DIR -name "backup-*.sql.gz" -mtime +7 -delete

echo "Backup concluído: $(date)" >> ~/backups/backup.log
EOF

# Dar permissão
chmod +x ~/backup.sh

# Agendar para 2:00 AM diariamente
crontab -e
# Adicionar: 0 2 * * * /home/appuser/backup.sh
```

---

# 9. Checklist Pré-Produção

```
CONFIGURAÇÃO INICIAL
□ SO: Ubuntu 24.04 LTS instalado
□ Firewall ativo (UFW)
□ SSH configurado
□ Usuário sem root criado
□ Swap configurado (4GB)

DEPENDÊNCIAS
□ Node.js 22 instalado
□ Docker instalado
□ Docker Compose instalado
□ Git configurado

APLICAÇÃO
□ Repositório clonado
□ .env configurado com senhas fortes
□ Diretórios de volumes criados
□ Docker Compose iniciado (docker-compose ps)

TESTES
□ Backend respondendo (curl localhost:3000/health)
□ Nginx respondendo (curl localhost/health)
□ PostgreSQL saudável (pg_isready)
□ Redis respondendo (redis-cli ping)
□ Ollama carregado (curl localhost:11434/api/tags)

SSL/TLS
□ Certificado Let's Encrypt gerado
□ HTTPS redirecionando de HTTP
□ Auto-renovação configurada

MONITORAMENTO
□ docker stats funcionando
□ Logs acessíveis (docker-compose logs)
□ Alertas de memória configurados
□ Backup automático agendado

SEGURANÇA
□ Headers SSL/TLS validados
□ Firewall apenas portas necessárias
□ .env não versionado (em .gitignore)
□ Senhas fortes (mínimo 32 caracteres)
□ SSH key apenas, sem senha
```

---

# 10. Troubleshooting Comum

## 10.1 Docker não inicia

```bash
# Verificar status
sudo systemctl status docker

# Reiniciar Docker
sudo systemctl restart docker

# Ver logs
sudo journalctl -u docker -n 50
```

---

## 10.2 Erro de Permissão com Docker

```bash
# Adicionar novamente ao grupo
sudo usermod -aG docker $USER
newgrp docker

# Reiniciar terminal/session
exit
ssh -i sua-chave.pem appuser@seu-vps-ip
```

---

## 10.3 Memória cheia

```bash
# Liberar espaço não utilizado
docker system prune -a

# Remover volumes não utilizados
docker volume prune

# Limpar logs
docker-compose exec backend truncate -s 0 /var/log/*.log
```

---

## 10.4 Ollama não carrega modelo

```bash
# Entrar no container
docker-compose exec ollama bash

# Fazer download manual
ollama pull mistral

# Sair
exit
```

---

## 10.5 PostgreSQL não conecta

```bash
# Ver logs
docker-compose logs postgres

# Entrar no container
docker-compose exec postgres bash

# Testar conexão
psql -U appuser -d appdb_prod -c "SELECT 1;"
```

---

# 11. Próximos Passos

## Após tudo funcionar:

1. **Monitoramento Avançado**
   - Prometheus + Grafana
   - ELK Stack (Elasticsearch, Logstash, Kibana)

2. **Backup e Disaster Recovery**
   - Backup automático em S3
   - Plano de recuperação documentado

3. **Auto-scaling**
   - Kubernetes (para 50+ usuários)
   - Load balancer adicional

4. **CI/CD**
   - GitHub Actions completo
   - Deploy automático

5. **Otimizações**
   - Implementar CDN
   - Cache de banco de dados
   - Compressão de assets

---

## 📞 Suporte e Documentação

- [FASE11_DEPLOYMENT_GUIDE.md](./FASE11_DEPLOYMENT_GUIDE.md) - Detalhes técnicos
- [infra/PRODUCTION_README.md](./infra/PRODUCTION_README.md) - Comandos úteis
- [ANALISE_CONSUMO_RECURSOS.md](./ANALISE_CONSUMO_RECURSOS.md) - Recursos necessários

---

**Última atualização:** Fevereiro 2026
**Versão:** 1.0
**Compatível com:** Ubuntu 24.04 LTS, Docker 25+, Node.js 22+
