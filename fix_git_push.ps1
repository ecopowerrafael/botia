# Script para limpar repositório e fazer push limpo
Set-Location "c:\bot ia"

Write-Host "1. Desfazendo commits problemáticos..." -ForegroundColor Yellow
git reset --soft HEAD~2

Write-Host "`n2. Removendo arquivos grandes do cache..." -ForegroundColor Yellow
git rm -r --cached node_modules -ErrorAction SilentlyContinue
git rm -r --cached apps/backend/node_modules -ErrorAction SilentlyContinue
git rm -r --cached apps/backend/dist -ErrorAction SilentlyContinue
git rm -r --cached apps/frontend/node_modules -ErrorAction SilentlyContinue
git rm -r --cached apps/frontend/dist -ErrorAction SilentlyContinue

Write-Host "`n3. Adicionando apenas arquivos essenciais..." -ForegroundColor Yellow
git add .gitignore
git add .github/
git add prisma/schema.prisma
git add apps/backend/src/
git add apps/backend/package.json
git add apps/backend/tsconfig.json
git add apps/backend/Dockerfile
git add apps/frontend/src/
git add apps/frontend/package.json
git add apps/frontend/index.html
git add apps/frontend/vite.config.js
git add package.json
git add README.md
git add "*.md"

Write-Host "`n4. Criando commit limpo..." -ForegroundColor Yellow
git commit -m "feat: adicionar frontend React e garantir Prisma 5.x

- Frontend: Novos componentes React (App.jsx, AppNew.jsx)
- Backend: Confirmado Prisma 5.19.0 (sem Prisma 7)
- Copilot: Atualizado .github/copilot-instructions.md
- Build: Melhorado .gitignore (excluir node_modules e dist)"

Write-Host "`n5. Configurando buffer Git..." -ForegroundColor Yellow
git config http.postBuffer 524288000
git config http.lowSpeedLimit 0
git config http.lowSpeedTime 999999

Write-Host "`n6. Tentando push..." -ForegroundColor Green
git push origin main --verbose

Write-Host "`nConcluído!" -ForegroundColor Green
