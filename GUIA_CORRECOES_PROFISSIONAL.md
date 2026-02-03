# 🔧 GUIA DE CORREÇÃO DOS 71 ERROS - PROFISSIONAL & ESCALÁVEL

## ⚠️ PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **PRISMA v7 → v5** (BLOQUEADOR)
- ❌ `prisma@^7.3.0` e `@prisma/client@^7.3.0`
- ✅ Downgrade para `@prisma/client@^5.20.0` e `prisma@^5.20.0`
- **Por quê**: Código foi escrito para v5, v7 tem breaking changes

### 2. **BULL → BULLMQ** (Descontinuado)
- ❌ `@nestjs/bull` e `bull` foram descontinuados
- ✅ Usar `@nestjs/bullmq` e `bullmq` (novos pacotes)
- **Por quê**: NestJS migrou para BullMQ em 2024

### 3. **DEPENDÊNCIAS FALTANDO**
- ❌ Sem `@nestjs/axios`, `bcrypt`, `@types/bcrypt`, `decimal.js`
- ✅ Adicionar versões compatíveis
- **Por quê**: Código importa mas package não tem

### 4. **SCHEMA PRISMA DESINCRONIZADO**
- ❌ Código referencia campos que não existem (notificationsEnabled, vendorWhatsAppNumber, etc)
- ✅ Sincronizar schema com código OU corrigir código
- **Por quê**: Migrations não foram executadas

---

## 📝 PASSO A PASSO DE CORREÇÃO

### FASE 1: ATUALIZAR PACKAGE.JSON ✅ (JÁ FEITO)

```json
{
  "dependencies": {
    "@nestjs/bullmq": "^10.1.1",     // ← Novo (antes: @nestjs/bull)
    "@prisma/client": "^5.20.0",      // ← Downgrade (antes: 7.3.0)
    "bcrypt": "^5.1.1",               // ← Novo
    "bullmq": "^5.14.1",              // ← Novo (antes: bull)
    "decimal.js": "^10.4.3"           // ← Novo
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",        // ← Novo
    "prisma": "^5.20.0"               // ← Downgrade
  }
}
```

### FASE 2: REGENERAR PRISMA

```bash
npx prisma generate
npx prisma migrate deploy  # Se houver migrations
```

### FASE 3: CORRIGIR IMPORTS (Por arquivo)

#### 3.1 `src/modules/audio/audio.service.ts`
```typescript
// ❌ ANTES
duration: dto.durationSeconds,  // undefined não é number

// ✅ DEPOIS  
duration: dto.durationSeconds ?? 0,  // Default 0 se undefined
```

#### 3.2 `src/modules/cart/cart.service.ts`
```typescript
// ❌ ANTES
import Decimal from 'decimal.js';
total: order.total,  // Decimal não é number

// ✅ DEPOIS
total: parseFloat(order.total.toString()),  // Converter Decimal → number
```

#### 3.3 `src/modules/user/user.service.ts`
```typescript
// ❌ ANTES
import * as bcrypt from 'bcrypt';  // Tipo incorreto

// ✅ DEPOIS
import bcrypt from 'bcrypt';  // Default export
```

#### 3.4 `src/modules/ia/ia.module.ts` & `src/modules/tts/tts.module.ts`
```typescript
// ❌ ANTES
import { HttpModule } from '@nestjs/axios';
import { HttpService } from '@nestjs/axios';

// ✅ DEPOIS - Uma das 2 opções:

// OPÇÃO A: Usar axios diretamente (recomendado)
import axios from 'axios';

// OPÇÃO B: Usar HttpClient (se tiver)
import { HttpClient } from '@nestjs/common';
```

#### 3.5 `src/shared/processors/audio.processor.ts`
```typescript
// ❌ ANTES
import { Job } from 'bull';
import { Process, Processor } from '@nestjs/bull';

// ✅ DEPOIS
import { Job } from 'bullmq';
import { Processor, WorkerHost } from '@nestjs/bullmq';

// Estender WorkerHost em vez de usar @Process()
export class AudioProcessor extends WorkerHost {
  async process(job: Job<AudioJobData>): Promise<any> {
    // lógica aqui
  }
}
```

#### 3.6 `src/shared/processors/cleanup.processor.ts`
```typescript
// ❌ ANTES
import { Process, Processor, OnWorkerEvent } from '@nestjs/bull';

// ✅ DEPOIS
import { Processor, WorkerHost } from '@nestjs/bullmq';
// OnWorkerEvent não existe em BullMQ, remover
```

#### 3.7 `src/shared/queue.service.ts`
```typescript
// ❌ ANTES
@InjectQueue('audio') private audioQueue: Queue;

// ✅ DEPOIS
@InjectQueue('audio') private audioQueue: Queue<AudioJobData>;
// Adicionar tipagem genérica
```

#### 3.8 Tipos genéricos não tipados
```typescript
// ❌ ANTES
orderItems: Array;

// ✅ DEPOIS
orderItems: OrderItem[];  // Ou Array<OrderItem>
```

---

## 🔄 CAMPOS FALTANDO NO SCHEMA PRISMA

Se o schema não tem esses campos, você precisa:

### OPÇÃO A: Adicionar ao schema.prisma
```prisma
model UserPreferences {
  notificationsEnabled Boolean @default(true)  // ← Adicionar
  notificationEmail    Boolean @default(true)
  notificationSMS      Boolean @default(false)
}

model TTSCache {
  originalText String?  // ← Adicionar se não existir
  hitCount     Int     @default(0)  // ← Adicionar se não existir
  createdAt    DateTime @default(now())  // ← Adicionar se não existir
}

model TenantWhatsAppConfig {
  vendorWhatsAppNumber String?  // ← Adicionar
  vendorWhatsAppName   String?  // ← Adicionar
}
```

Depois:
```bash
npx prisma migrate dev --name "add-missing-fields"
npx prisma generate
```

### OPÇÃO B: Remover do código
Se o campo não é necessário, remova as referências do código.

---

## 🛠️ HELPER FUNCTIONS PARA USAR

### decimal.helper.ts
```typescript
export function toNumber(decimal: any): number {
  if (typeof decimal === 'number') return decimal;
  if (typeof decimal === 'string') return parseFloat(decimal);
  if (decimal?.toNumber) return decimal.toNumber();
  return parseFloat(String(decimal));
}
```

### job.helper.ts
```typescript
// Para BullMQ (novos processadores)
export interface JobPayload<T = any> {
  data: T;
  id?: string;
  timestamp?: number;
}
```

---

## ✅ CHECKLIST DE CORREÇÃO

- [ ] Downgrade Prisma v7 → v5
- [ ] Remover @nestjs/bull, usar @nestjs/bullmq
- [ ] Adicionar bcrypt, decimal.js
- [ ] Corrigir imports de bcrypt
- [ ] Corrigir imports de HTTP
- [ ] Corrigir imports de Bull → BullMQ
- [ ] Adicionar tipos genéricos (Array<T>)
- [ ] Converter Decimal → number onde necessário
- [ ] Sincronizar schema Prisma
- [ ] npm ci (instalar)
- [ ] npx prisma generate
- [ ] npm run build

---

## 🚀 EXECUTAR CORREÇÕES

```bash
# Local (sua máquina)
cd apps/backend
npm ci
npm run build  # Deve estar sem erros

# Se tiver erros, compartilha os primeiros 10:
npm run build 2>&1 | head -50
```

---

## 📚 REFERÊNCIAS

- [BullMQ Docs](https://docs.bullmq.io/)
- [NestJS BullMQ](https://docs.nestjs.com/techniques/task-scheduling#job-scheduling)
- [Prisma v5 Docs](https://www.prisma.io/docs/orm/prisma-schema)
- [Decimal.js](https://github.com/MikeMcl/decimal.js)

---

**Status**: 🟡 Em Andamento
**Próximo**: Push para GitHub → Reset VPS → Deploy Limpo
