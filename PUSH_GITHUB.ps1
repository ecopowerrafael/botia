# Script PowerShell - Push para GitHub
# Execute no PowerShell local

Write-Host "Iniciando setup GitHub..." -ForegroundColor Green

# Navega para o diretório do projeto
cd "C:\Users\Code\OneDrive\Desktop\bot ia"

# Inicia Git
git init

# Configura Git
git config user.name "ecopowerrafael"
git config user.email "seu-email@gmail.com"

# Adiciona todos os arquivos
Write-Host "Adicionando arquivos..." -ForegroundColor Yellow
git add .

# Primeiro commit
Write-Host "Fazendo commit..." -ForegroundColor Yellow
git commit -m "Initial commit: Bot IA com Ollama, WhatsApp, PostgreSQL e Bull Queue"

# Configura branch main
git branch -M main

# Adiciona repositório remoto
Write-Host "Conectando ao GitHub..." -ForegroundColor Yellow
git remote add origin https://github.com/ecopowerrafael/botia.git

# Push para GitHub
Write-Host "Enviando para GitHub..." -ForegroundColor Cyan
git push -u origin main

Write-Host "✅ Repositório enviado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximo passo: Execute no VPS" -ForegroundColor Green
Write-Host "ssh appuser@46.202.147.151" -ForegroundColor Yellow
