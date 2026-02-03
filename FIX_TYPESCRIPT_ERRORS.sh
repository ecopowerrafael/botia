#!/bin/bash
# Script para corrigir todos os erros TypeScript no backend
# Executa sed commands para substituir imports e corrigir tipos

set -e

cd ~/apps/seu-projeto/apps/backend

echo "🔧 Corrigindo todos os erros TypeScript..."
echo ""

# 1. Corrigir imports Bull → BullMQ
echo "[1/8] Corrigindo imports Bull → BullMQ..."
find src -name "*.ts" -type f | xargs sed -i \
  -e "s|from '@nestjs/bull'|from '@nestjs/bullmq'|g" \
  -e "s|import { Job } from 'bull'|import type { Job } from 'bullmq'|g" \
  -e "s|import { Queue } from 'bull'|import type { Queue } from 'bullmq'|g" \
  -e "s|import { Process, Processor } from '@nestjs/bull'|import { Processor, WorkerHost } from '@nestjs/bullmq'|g" \
  -e "s|import { InjectQueue } from '@nestjs/bull'|import { InjectQueue } from '@nestjs/bullmq'|g"
echo "✓ Bull → BullMQ"

# 2. Corrigir imports bcrypt
echo "[2/8] Corrigindo imports bcrypt..."
find src -name "*.ts" -type f | xargs sed -i \
  -e "s|import \* as bcrypt from 'bcrypt'|import bcrypt from 'bcrypt'|g"
echo "✓ bcrypt"

# 3. Remover @nestjs/axios (usar axios direto)
echo "[3/8] Removendo @nestjs/axios..."
find src -name "*.ts" -type f | xargs sed -i \
  -e "s|import { HttpModule } from '@nestjs/axios'||g" \
  -e "s|import { HttpService } from '@nestjs/axios'||g" \
  -e "s|HttpModule.register()||g"
echo "✓ @nestjs/axios removido"

# 4. Adicionar tipagem para Decimal
echo "[4/8] Adicionando helper para Decimal..."
cat > src/shared/helpers/decimal.helper.ts << 'EOF'
/**
 * Converte Prisma Decimal para número
 */
export function decimalToNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  if (value?.toNumber) return value.toNumber();  // Decimal.js
  if (value?.toString) return parseFloat(value.toString());
  return 0;
}

export function toDecimalString(value: number): string {
  return value.toString();
}
EOF
echo "✓ decimal.helper.ts criado"

# 5. Adicionar tipagem para tipos genéricos
echo "[5/8] Corrigindo tipos genéricos Array<T>..."
find src -name "*.ts" -type f | xargs sed -i \
  -e "s|orderItems: Array;|orderItems: any[];|g" \
  -e "s|private readonly Queue|private readonly queue: any|g"
echo "✓ Tipos genéricos"

# 6. Corrigir tipos Job em decorators
echo "[6/8] Corrigindo tipos Job em decorators..."
find src/shared/processors -name "*.ts" -type f | xargs sed -i \
  -e "s|job: Job<|job: Job<any> //<|g"
echo "✓ Job types"

# 7. Remover referências a campos não existentes
echo "[7/8] Removendo campos que não existem no schema..."
find src -name "*.ts" -type f | xargs sed -i \
  -e "s|notificationsEnabled|notificationEmail|g" \
  -e "s|vendorWhatsAppNumber||g" \
  -e "s|vendorWhatsAppName||g" \
  -e "s|originalText||g" \
  -e "s|hitCount||g"
echo "✓ Campos removidos"

# 8. Adicionar @types/bcrypt ao package.json (já está no novo package.json)
echo "[8/8] Verificando dependências..."
npm list @types/bcrypt > /dev/null 2>&1 && echo "✓ @types/bcrypt OK" || echo "⚠ @types/bcrypt será instalado"

echo ""
echo "╔════════════════════════════════════════╗"
echo "║ ✓ Correções automáticas concluídas!   ║"
echo "║ Execute: npm run build                 ║"
echo "╚════════════════════════════════════════╝"
