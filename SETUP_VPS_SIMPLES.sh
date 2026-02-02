#!/bin/bash

# Script simples de setup VPS - Sem cores, sem complicações

echo "Iniciando setup do VPS..."

# 1. Atualizar sistema
echo "[1/10] Atualizando sistema..."
sudo apt update
sudo apt upgrade -y

# 2. Instalar ferramentas básicas
echo "[2/10] Instalando ferramentas..."
sudo apt install -y curl wget git nano vim htop ufw fail2ban

# 3. Criar usuário appuser
echo "[3/10] Criando usuário..."
if ! id -u appuser > /dev/null 2>&1; then
    sudo useradd -m -s /bin/bash appuser
    sudo usermod -aG sudo appuser
    echo "appuser:senhaTemporaria123" | sudo chpasswd
    echo "Usuário 'appuser' criado com senha 'senhaTemporaria123'"
else
    echo "Usuário 'appuser' já existe"
fi

# 4. Configurar Swap
echo "[4/10] Configurando Swap..."
if [ ! -f /swapfile ]; then
    sudo dd if=/dev/zero of=/swapfile bs=1G count=4
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab > /dev/null
    echo "Swap de 4GB criado"
else
    echo "Swap já existe"
fi

# 5. Configurar Firewall
echo "[5/10] Configurando Firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
echo "Firewall ativo"

# 6. Instalar Node.js 22
echo "[6/10] Instalando Node.js 22..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt install -y nodejs
    echo "Node.js instalado: $(node --version)"
else
    echo "Node.js já instalado: $(node --version)"
fi

# 7. Instalar Docker
echo "[7/10] Instalando Docker..."
if ! command -v docker &> /dev/null; then
    sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    sudo apt install -y ca-certificates curl gnupg lsb-release
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker appuser
    echo "Docker instalado"
else
    echo "Docker já instalado: $(docker --version)"
fi

# 8. Instalar Docker Compose
echo "[8/10] Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose instalado"
else
    echo "Docker Compose já instalado: $(docker-compose --version)"
fi

# 9. Criar diretórios
echo "[9/10] Criando diretórios..."
mkdir -p ~/apps
mkdir -p ~/data/{postgres,redis,ollama,evolution,nginx,certs,backups}
mkdir -p ~/.ssh
chmod -R 755 ~/data
echo "Diretórios criados em ~/data"

# 10. Configurar Docker
echo "[10/10] Configurando Docker..."
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
echo "Docker configurado"

# Fim
echo ""
echo "========================================"
echo "INSTALACAO CONCLUIDA COM SUCESSO!"
echo "========================================"
echo ""
echo "Proximos passos:"
echo "1. su - appuser"
echo "2. passwd"
echo "3. cd ~/apps && git clone seu-repositorio"
echo "4. cd seu-projeto/infra && nano .env"
echo "5. docker-compose up -d"
echo "6. docker-compose ps"
echo ""
echo "Node.js: $(node --version)"
echo "Docker: $(docker --version)"
echo "Docker Compose: $(docker-compose --version)"
echo ""
echo "Sistema pronto para producao!"
