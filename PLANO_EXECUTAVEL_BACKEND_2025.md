# 📋 PLANO EXECUTÁVEL: Atualização Completa do Backend

> **Objetivo**: Fazer o projeto compilar e rodar sem erros TypeScript  
> **Tempo**: ~7-10 horas  
> **Data**: Fevereiro 2025  

---

## 🟢 FASE 1: Atualizar Dependências (30-45 minutos)

### Passo 1.1: Backup do package.json atual

```bash
cd "c:\Users\Code\OneDrive\Desktop\bot ia\apps\backend"

# Fazer backup
cp package.json package.json.backup
```

### Passo 1.2: Remover dependências problemáticas

```bash
# Remove packages que causam conflito
npm uninstall bull @nestjs/bull

# Limpar node_modules
rm -r node_modules
# OU no Windows PowerShell:
Remove-Item -Recurse -Force node_modules
```

### Passo 1.3: Instalar versões corretas

**⚠️ CRÍTICO: Fazer downgrade Prisma de v7 para v5**

```bash
# Core NestJS - atualizar para latest
npm install @nestjs/common@^11.2.0 @nestjs/core@^11.2.0 @nestjs/config@^4.0.2
npm install @nestjs/platform-express@^11.2.0 @nestjs/testing@^11.2.0
npm install @nestjs/schedule@^6.1.0

# DOWNGRADE Prisma (CRÍTICO!)
npm install prisma@^5.20.0 @prisma/client@^5.20.0

# Missing dependencies
npm install @nestjs/axios@^3.0.0
npm install bcrypt@^5.1.0 @types/bcrypt@^5.0.0

# Queue management (Bull → BullMQ)
npm install bullmq@^5.9.0

# Data transformation
npm install class-transformer@^0.5.1

# Outros
npm install axios@^1.17.0
npm install typescript@^5.10.0

# Dev dependencies
npm install --save-dev @types/node@latest @types/jest@latest
```

### Passo 1.4: Verificar instalação

```bash
npm list --depth=0

# Esperado output similar a:
# ├── @nestjs/axios@3.0.0
# ├── @nestjs/common@11.2.0
# ├── @nestjs/core@11.2.0
# ├── @prisma/client@5.20.0
# ├── bcrypt@5.1.0
# ├── bullmq@5.9.0
# ├── prisma@5.20.0
# └── ... (outros)
```

---

## 🟡 FASE 2: Sincronizar Prisma Schema (20-30 minutos)

### Passo 2.1: Regenerar Prisma Client

```bash
cd "c:\Users\Code\OneDrive\Desktop\bot ia\prisma"

# Regenerar tipos TypeScript
npx prisma generate

# Visualizar schema (opcional)
npx prisma studio
```

### Passo 2.2: Aplicar migrações

```bash
# Ver estado do banco
npx prisma db push --skip-generate

# Se houver mudanças necessárias:
npx prisma migrate dev --name sync_schema
```

### Passo 2.3: Validar schema

```bash
npx prisma validate
# Esperado: "Prisma schema is valid"
```

---

## 🔵 FASE 3: Corrigir Imports de Tipos (30-45 minutos)

### Passo 3.1: Adicionar imports no tts.service.ts

**Arquivo**: `apps/backend/src/modules/tts/tts.service.ts`

```typescript
// ADICIONAR após linha 1:
import { HttpModule } from '@nestjs/axios';

// Na classe TTSModule (tts.module.ts), adicionar imports:
@Module({
  imports: [HttpModule, PrismaModule],  // ← Adicionar HttpModule
  controllers: [TTSController],
  providers: [TTSService],
})
export class TTSModule {}
```

### Passo 3.2: Adicionar imports no user.service.ts

**Arquivo**: `apps/backend/src/modules/user/user.service.ts`

```typescript
// Linha ~5 - garantir que está assim:
import * as bcrypt from 'bcrypt';

// Se der erro, tentar:
import bcrypt from 'bcrypt';
```

### Passo 3.3: Adicionar imports Prisma onde falta

**Todos os services** que usam Decimal:

```typescript
// Adicionar no início do arquivo:
import { Decimal } from '@prisma/client/runtime/library';

// Ou usar o wrapper:
import { Decimal } from '@prisma/client/runtime';
```

---

## 🟣 FASE 4: Corrigir Tipos Decimal (1 hora)

### Passo 4.1: Criar helper file

**Arquivo**: `apps/backend/src/shared/utils/decimal.helper.ts`

```typescript
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Converter Prisma Decimal para number
 */
export function toNumber(value: Decimal | null | undefined): number {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  return Number(value.toString());
}

/**
 * Converter number para Prisma Decimal
 */
export function toDecimal(value: number | string | null): Decimal {
  if (!value) return new Decimal(0);
  return new Decimal(value.toString());
}

/**
 * Somar dois Decimal values
 */
export function addDecimal(a: Decimal | null, b: Decimal | null): Decimal {
  const aVal = a ? toNumber(a) : 0;
  const bVal = b ? toNumber(b) : 0;
  return toDecimal(aVal + bVal);
}

/**
 * Multiplicar Decimal values
 */
export function multiplyDecimal(value: Decimal | null, multiplier: number): Decimal {
  if (!value) return new Decimal(0);
  return toDecimal(toNumber(value) * multiplier);
}
```

### Passo 4.2: Atualizar payment.service.ts

**Arquivo**: `apps/backend/src/modules/payment/payment.service.ts`

Buscar por operações com `Decimal` e converter:

```typescript
// ❌ ANTES
const total = order.total + tax + discount;

// ✅ DEPOIS
import { toNumber, addDecimal } from '../../shared/utils/decimal.helper';

const total = addDecimal(
  addDecimal(order.total, tax),
  discount
);
// Ou:
const totalNumber = toNumber(order.total) + toNumber(tax) + toNumber(discount);
```

### Passo 4.3: Atualizar cart.service.ts

Mesmas correções para operações matemáticas com valores monetários.

---

## 🟠 FASE 5: Adicionar Generic Types (45 minutos)

### Passo 5.1: Procurar por `Array` sem tipo

```bash
# PowerShell - Encontrar padrão
$files = Get-ChildItem -Path "apps/backend/src/modules" -Filter "*.service.ts" -Recurse
foreach ($file in $files) {
  Select-String -Pattern "items:\s*Array\b" -Path $file
}

# Bash
find apps/backend/src/modules -name "*.service.ts" -exec grep -n "Array\b" {} \;
```

### Passo 5.2: Corrigir padrões encontrados

**Padrão 1**: Array em DTO

```typescript
// ❌ ANTES
export class OrderItemDto {
  items: Array;
}

// ✅ DEPOIS
export class OrderItemDto {
  items: Array<{
    productName: string;
    unitPrice: number;
    quantity: number;
  }>;
}

// OU melhor ainda, criar interface:
export interface OrderItemLine {
  productName: string;
  unitPrice: number;
  quantity: number;
}

export class OrderItemDto {
  items: Array<OrderItemLine>;
}
```

**Padrão 2**: Array em função

```typescript
// ❌ ANTES
async processItems(items: Array) {
  return items.map(i => i.name);
}

// ✅ DEPOIS
async processItems(items: Array<OrderItem>) {
  return items.map(i => i.productName);
}
```

---

## 🔴 FASE 6: Corrigir Erros de Testes (2-3 horas)

### Passo 6.1: Criar mock factory

**Arquivo**: `apps/backend/test/utils/mock-job.factory.ts`

```typescript
import { Job } from 'bull';

/**
 * Factory para criar mocks de Job com tipos corretos
 */
export function createMockJob<T>(data: T, overrides?: Partial<Job>): Partial<Job<T>> {
  return {
    id: '1',
    data,
    progress: jest.fn(),
    updateProgress: jest.fn(),
    updateData: jest.fn(),
    remove: jest.fn(),
    retry: jest.fn(),
    discard: jest.fn(),
    moveToCompleted: jest.fn(),
    moveToFailed: jest.fn(),
    getName: () => 'test-job',
    log: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    // ... outros campos essenciais
    ...overrides,
  };
}
```

### Passo 6.2: Atualizar audio.processor.spec.ts

**Arquivo**: `apps/backend/src/shared/processors/audio.processor.spec.ts`

```typescript
// ANTES (linha ~63)
const job: any = {
  id: string;
  data: { audioUrl: string; chatId: string; tenantId: string; language: string };
  progress: jest.Mock<any, any, any>;
};
const result = await processor.handleAudioTranscription(job);

// DEPOIS
import { createMockJob } from '../../../test/utils/mock-job.factory';

const jobData = { 
  audioUrl: 'http://...', 
  chatId: 'chat-1', 
  tenantId: 'tenant-1',
  language: 'pt'
};
const job = createMockJob(jobData) as Job<typeof jobData>;
const result = await processor.handleAudioTranscription(job as any);
```

### Passo 6.3: Corrigir cleanup.processor.spec.ts

```typescript
// ANTES (linha ~67)
expect(result.deleted).toBeGreaterThanOrEqual(0);

// DEPOIS - escolher uma das opções:
expect(result.itemsRemoved).toBeGreaterThanOrEqual(0); // Se exists
// OU
expect(result.success).toBe(true); // Se é um flag

// Para stats:
// ANTES
expect(result.stats).toHaveProperty('totalOrders');

// DEPOIS (result é flat, não nested)
expect(result).toHaveProperty('totalOrders');
expect(result.totalOrders).toBeGreaterThanOrEqual(0);
```

### Passo 6.4: Atualizar queue-scheduler.service.spec.ts

```typescript
// ANTES (linha ~88)
expect(jobs.length).toBeGreaterThan(0);

// DEPOIS - jobs retorna objeto com array, não array direto
expect(jobs.jobs.length).toBeGreaterThan(0);
// OU
expect(jobs.total).toBeGreaterThan(0);
```

---

## 🎯 FASE 7: Build & Validação (30-45 minutos)

### Passo 7.1: Verificar tipos TypeScript

```bash
cd apps/backend

# Apenas verificar tipos sem gerar
npx tsc --noEmit

# Esperado: sem errors
```

### Passo 7.2: Linting

```bash
# Verificar e corrigir automaticamente
npm run lint --fix

# Esperado: arquivos formatados
```

### Passo 7.3: Build

```bash
npm run build

# Esperado: 
# ✓ Compiled successfully
# ✓ Dist files generated
```

### Passo 7.4: Testes (opcional neste momento)

```bash
# Se quiser testar depois:
npm run test

# E2E tests:
npm run test:e2e
```

---

## ✅ FASE 8: Validação Final (20-30 minutos)

### Passo 8.1: Iniciar projeto

```bash
npm run start:dev

# Esperado:
# [Nest] XX:XX AM - 02/02/2025 LOG [NestFactory] Starting Nest application...
# [Nest] XX:XX AM - 02/02/2025 LOG [InstanceLoader] PrismaModule dependencies initialized
# [Nest] XX:XX AM - 02/02/2025 LOG [InstanceLoader] QueueModule dependencies initialized
# [Nest] XX:XX AM - 02/02/2025 LOG Application listening on port 3000
```

### Passo 8.2: Testar endpoints básicos

```bash
# Em outro terminal:
curl -X GET http://localhost:3000/health
# Esperado: 200 OK

curl -X GET http://localhost:3000/api/status
# Esperado: 200 com status
```

### Passo 8.3: Verificar Prisma Studio

```bash
# Em outro terminal:
npx prisma studio

# Esperado: Browser abre em http://localhost:5555
# Pode visualizar dados do banco
```

---

## 📊 CHECKLIST DE CONCLUSÃO

### ✅ Compilação
- [ ] `npm run build` - sem erros
- [ ] `npx tsc --noEmit` - sem errors
- [ ] `npm run lint` - sem warnings críticos

### ✅ Runtime
- [ ] `npm run start:dev` - inicia sem crashes
- [ ] `curl localhost:3000/health` - 200 OK
- [ ] Prisma conecta ao banco
- [ ] Queue service inicializa

### ✅ Dependências
- [ ] `npm list` - mostra todas as versões corretas
- [ ] Não há conflitos de dependências
- [ ] Prisma v5.20.0 instalado
- [ ] @nestjs/axios instalado

### ✅ Tipos
- [ ] Sem erros `any` implícitos
- [ ] Decimal properly converted
- [ ] Imports todos resolvidos
- [ ] DTOs tipados corretamente

---

## 🚨 TROUBLESHOOTING

### Erro: "Cannot find module '@nestjs/axios'"

```bash
# Solução:
npm install @nestjs/axios@^3.0.0

# Verificar importação em tts.module.ts:
# imports: [HttpModule]
```

### Erro: "Prisma v7 breaking change"

```bash
# Solução - Fazer downgrade:
npm install prisma@^5.20.0 @prisma/client@^5.20.0
npx prisma generate
```

### Erro: "bcrypt is not defined"

```bash
# Solução:
npm install bcrypt @types/bcrypt

# Verificar import:
import * as bcrypt from 'bcrypt';
// OU
import bcrypt from 'bcrypt';
```

### Erro: "Type 'Decimal' is not assignable to type 'number'"

```typescript
// Solução: usar converter
import { toNumber } from '../shared/utils/decimal.helper';

const value: number = toNumber(order.total);
```

### Erro: Jest mocks incompatíveis

```bash
# Solução: atualizar Jest types
npm install --save-dev @types/jest@latest
npm install --save-dev ts-jest@latest
```

---

## 📈 Próximos Passos (Após Compilar)

1. **Testes**: `npm run test` - validar todos os testes
2. **Coverage**: `npm run test:cov` - deve ser >80%
3. **E2E**: `npm run test:e2e` - validar fluxos completos
4. **Deploy**: Preparar para produção

---

## 📞 Referências

- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [BullMQ Migration](https://docs.bullmq.io/)

---

**Status**: 🟢 Pronto para Execução  
**Tempo Total**: 7-10 horas  
**Próximo Passo**: Execute FASE 1 acima
