#!/bin/bash

# ============================================================================
# 🚀 SCRIPT DE INSTALAÇÃO AUTOMÁTICA - VPS PRODUÇÃO
# Tudo em um único comando! Instala e configura tudo automaticamente.
# ============================================================================

set -e  # Parar se houver erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cor
print_step() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
}

print_error() {
    echo -e "${RED}✗ ERRO: $1${NC}"
    exit 1
}

# ============================================================================
# 1. ATUALIZAR SISTEMA
# ============================================================================
print_step "ETAPA 1: Atualizando Sistema"

sudo apt update || print_error "Falha ao atualizar pacotes"
sudo apt upgrade -y || print_error "Falha ao fazer upgrade"

# ============================================================================
# 2. INSTALAR DEPENDÊNCIAS BÁSICAS
# ============================================================================
print_step "ETAPA 2: Instalando Ferramentas Básicas"

sudo apt install -y \
    curl \
    wget \
    git \
    build-essential \
    libssl-dev \
    libffi-dev \
    htop \
    vim \
    nano \
    ufw \
    fail2ban || print_error "Falha ao instalar ferramentas básicas"

# ============================================================================
# 3. CRIAR USUÁRIO (não usar root)
# ============================================================================
print_step "ETAPA 3: Criando Usuário 'appuser'"

# Criar usuário se não existir
if ! id -u appuser > /dev/null 2>&1; then
    sudo useradd -m -s /bin/bash appuser
    sudo usermod -aG sudo appuser
    echo "appuser:senhaTemporaria123" | sudo chpasswd
    echo "✓ Usuário 'appuser' criado com senha 'senhaTemporaria123'"
    echo "  MUDE ESSA SENHA APÓS CONECTAR: passwd"
else
    echo "✓ Usuário 'appuser' já existe"
fi

# ============================================================================
# 4. CONFIGURAR SWAP (se RAM < 8GB)
# ============================================================================
print_step "ETAPA 4: Configurando Swap"

if [ ! -f /swapfile ]; then
    sudo dd if=/dev/zero of=/swapfile bs=1G count=4
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab > /dev/null
    echo "✓ Swap de 4GB criado"
else
    echo "✓ Swap já existe"
fi

# ============================================================================
# 5. CONFIGURAR FIREWALL
# ============================================================================
print_step "ETAPA 5: Configurando Firewall"

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable
echo "✓ Firewall ativo (SSH, HTTP, HTTPS liberados)"

# ============================================================================
# 6. INSTALAR NODE.JS 22
# ============================================================================
print_step "ETAPA 6: Instalando Node.js 22"

if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - || print_error "Falha ao adicionar repositório Node"
    sudo apt install -y nodejs || print_error "Falha ao instalar Node.js"
    echo "✓ Node.js $(node --version) instalado"
else
    echo "✓ Node.js já instalado: $(node --version)"
fi

# ============================================================================
# 7. INSTALAR DOCKER
# ============================================================================
print_step "ETAPA 7: Instalando Docker"

if ! command -v docker &> /dev/null; then
    sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    sudo apt install -y ca-certificates curl gnupg lsb-release
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    echo \
      "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin || print_error "Falha ao instalar Docker"
    
    sudo usermod -aG docker appuser
    echo "✓ Docker instalado"
else
    echo "✓ Docker já instalado: $(docker --version)"
fi

# ============================================================================
# 8. INSTALAR DOCKER COMPOSE
# ============================================================================
print_step "ETAPA 8: Instalando Docker Compose"

if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✓ Docker Compose instalado"
else
    echo "✓ Docker Compose já instalado: $(docker-compose --version)"
fi

# ============================================================================
# 9. CRIAR DIRETÓRIOS NECESSÁRIOS
# ============================================================================
print_step "ETAPA 9: Criando Diretórios"

mkdir -p ~/apps
mkdir -p ~/data/{postgres,redis,ollama,evolution,nginx,certs,backups}
mkdir -p ~/.ssh

chmod -R 755 ~/data

echo "✓ Diretórios criados em ~/data"

# ============================================================================
# 10. CONFIGURAR DOCKER
# ============================================================================
print_step "ETAPA 10: Configurando Docker"

sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker

echo "✓ Docker configurado"

# ============================================================================
# 11. INSTALAR FERRAMENTAS DE MONITORAMENTO
# ============================================================================
print_step "ETAPA 11: Instalando Ferramentas de Monitoramento"

sudo apt install -y iotop nethogs || true
echo "✓ Ferramentas instaladas (htop, iotop, nethogs)"

# ============================================================================
# 12. CONFIGURAR FAIL2BAN (proteção contra brute force)
# ============================================================================
print_step "ETAPA 12: Configurando Fail2Ban (Proteção SSH)"

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban
echo "✓ Fail2Ban ativo"

# ============================================================================
# RESUMO FINAL
# ============================================================================
print_step "✅ INSTALAÇÃO COMPLETA!"

echo -e "${GREEN}═════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Próximos Passos:${NC}"
echo -e "${GREEN}═════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}1. Mudar senha do appuser:${NC}"
echo "   su - appuser"
echo "   passwd"
echo ""
echo -e "${YELLOW}2. Clonar seu projeto:${NC}"
echo "   cd ~/apps"
echo "   git clone seu-repositorio"
echo ""
echo -e "${YELLOW}3. Configurar .env:${NC}"
echo "   cd ~/apps/seu-projeto/infra"
echo "   nano .env"
echo ""
echo -e "${YELLOW}4. Iniciar serviços:${NC}"
echo "   docker-compose up -d"
echo ""
echo -e "${YELLOW}5. Verificar status:${NC}"
echo "   docker-compose ps"
echo ""
echo -e "${GREEN}═════════════════════════════════════════════════════════${NC}"
echo ""
echo "Node.js: $(node --version)"
echo "Docker: $(docker --version)"
echo "Docker Compose: $(docker-compose --version)"
echo ""
echo -e "${GREEN}Sistema pronto para produção! 🚀${NC}"
