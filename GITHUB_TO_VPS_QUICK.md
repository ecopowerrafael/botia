# 🚀 Guia Rápido: GitHub → VPS

## ✅ PASSO 1: Push para GitHub (seu PC)

Abra PowerShell como **Administrador** e execute:

```powershell
# Navega para a pasta do projeto
cd "C:\Users\Code\OneDrive\Desktop\bot ia"

# Executa o script de push
.\PUSH_GITHUB.ps1
```

Quando pedir autenticação do GitHub:
- Username: `ecopowerrafael`
- Password: Use seu **Personal Access Token** (não sua senha)
  - Gere em: https://github.com/settings/tokens
  - Permissões: `repo` e `workflow`

**Espera terminar** (deve dizer "✅ Repositório enviado com sucesso!")

---

## ✅ PASSO 2: Clone no VPS

Conecte ao VPS:

```bash
ssh appuser@46.202.147.151
```

Execute o script de setup:

```bash
bash ~/SETUP_VPS_FROM_GITHUB.sh
```

Ou copie e cole (se não estiver no home):

```bash
cat > setup-vps.sh << 'EOF'
#!/bin/bash
echo "Iniciando setup no VPS..."
rm -rf ~/apps/backend ~/apps/infra ~/apps/prisma 2>/dev/null || true
cd ~/apps
git clone https://github.com/ecopowerrafael/botia.git seu-projeto
cd seu-projeto/infra
cat > .env << 'ENVFILE'
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
ENVFILE
docker-compose up -d
sleep 5
docker-compose ps
echo "✅ Setup concluído!"
EOF

bash setup-vps.sh
```

---

## 🎯 Resumo:

| Etapa | Comando | Tempo |
|-------|---------|-------|
| Push GitHub | `.\PUSH_GITHUB.ps1` | 2-5 min |
| Clone VPS | `bash setup-vps.sh` | 3-5 min |
| Docker Start | Automático | 2-3 min |
| **Total** | **~10-15 minutos** | ✅ |

---

## ✓ Verificar se está tudo ok:

```bash
# No VPS, verificar status
docker-compose ps

# Ver logs do backend
docker-compose logs -f backend

# Testar API (do seu PC)
curl http://46.202.147.151/health
```

---

**Tudo pronto! Pode executar agora!** 🚀
