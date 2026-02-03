#!/bin/bash
# Deploy package.json atualizado para GitHub

cd ~/apps/seu-projeto

echo "📦 Atualizando package.json no GitHub..."

# Copiar o package.json atualizado local
cp ~/apps/seu-projeto/apps/backend/package.json ./apps/backend/package.json

# Commit
git add package.json apps/backend/package.json apps/backend/Dockerfile
git commit -m "chore: update dependencies - Prisma v5, BullMQ, bcrypt, decimal.js"

# Push (pode pedir autenticação)
git push origin main

echo "✓ Pushed para GitHub com sucesso!"
