#!/bin/bash

# Script VPS - Clone e Setup Automático
# Execute no VPS como appuser

echo "Iniciando setup no VPS..."

# Remove o que tinha antes
rm -rf ~/apps/backend ~/apps/infra ~/apps/prisma 2>/dev/null || true

# Clone do GitHub
echo "Clonando repositório..."
cd ~/apps
git clone https://github.com/ecopowerrafael/botia.git seu-projeto
cd seu-projeto/infra

# Cria .env com as configurações
echo "Criando arquivo .env..."
cat > .env << 'EOF'
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
DATABASE_URL=postgres://appuser:SenhaForte@123456@postgres:5432/appdb_prod
POSTGRES_USER=appuser
POSTGRES_PASSWORD=SenhaForte@123456
POSTGRES_DB=appdb_prod
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
REDIS_URL=redis://:OutraSenha@123456@redis:6379
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=OutraSenha@123456
REDIS_DB=0
JWT_SECRET=StringAleatoriaCompridaAquiComMuitosCaracteres123456789ABCDEFGHIJKLMNOPQRST
JWT_EXPIRATION=7d
CORS_ORIGIN=https://seu-dominio.com
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_TOKEN=seu-token
OLLAMA_API_URL=http://ollama:11434
OLLAMA_MODEL=mistral
SMTP_HOST=smtp.seu-provedor.com
SMTP_PORT=587
SMTP_USER=seu-email@seu-dominio.com
SMTP_PASSWORD=sua-senha
SMTP_FROM=noreply@seu-dominio.com
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=sua-chave
AWS_SECRET_ACCESS_KEY=seu-secret
AWS_S3_BUCKET=seu-bucket
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=900000
EOF

echo ".env criado com sucesso!"

# Inicia Docker
echo "Iniciando Docker Compose..."
docker-compose up -d

# Aguarda um pouco para os containers iniciarem
sleep 5

# Mostra status
echo ""
echo "========================================"
echo "Status dos containers:"
echo "========================================"
docker-compose ps

echo ""
echo "✅ Setup concluído!"
echo ""
echo "Próximos passos:"
echo "1. Verificar logs: docker-compose logs -f backend"
echo "2. Testar API: curl http://localhost/health"
echo "3. Configurar SSL: https://seu-dominio.com"
