# SaaS Multi-Tenant WhatsApp CRM/ERP - AI Coding Agent Instructions

## Project Overview
This is a **NestJS 11** monorepo building a multi-tenant WhatsApp-powered CRM/ERP with AI automation. The stack includes PostgreSQL + Prisma, Redis + BullMQ, Evolution API for WhatsApp, and multi-provider AI (OpenAI/Gemini/Ollama).

**Critical Context**: This project has undergone extensive refactoring (see `COMECE_AQUI.md`, `PLANO_EXECUTAVEL_BACKEND_2025.md`). Dependencies and patterns have been updated significantly in early 2025.

## Architecture & Module Structure

### Monorepo Layout
- `apps/backend/` - NestJS API (main application)
- `apps/frontend/` - Next.js UI
- `prisma/` - Database schema (shared)
- `infra/` - Docker Compose orchestration

### Core Modules (`apps/backend/src/modules/`)
Each module follows NestJS patterns: `*.module.ts`, `*.service.ts`, `*.controller.ts`, `dto/*.dto.ts`

**Integration Modules** (external systems):
- `whatsapp/` - Evolution API client for messaging
- `wordpress/` - WordPress REST API sync (products/posts)
- `ia/` - Multi-provider AI engine (OpenAI/Gemini/Ollama)

**Business Logic Modules**:
- `tenant/` - Multi-tenancy isolation (ALL queries must filter by `tenantId`)
- `automation/` - Drip campaigns, mass messaging, scheduling
- `knowledge/` - Content ingestion (web scraping, CSV, PDFs)
- `cart/` & `payment/` - E-commerce with vendor/seller modes
- `onboarding/` - User setup flow
- `conversation/` - Message history and context

**Shared Services** (`apps/backend/src/shared/`):
- `prisma.service.ts` - Database client (inject via `PrismaService`)
- `bull.module.ts` - BullMQ job queues (NOT Bull v3)

## Critical Dependencies & Version Constraints

**⚠️ Version Lock-In (DO NOT UPGRADE):**
- `prisma@^5.20.0` & `@prisma/client@^5.20.0` - Downgraded from v7 (breaking changes)
- `bullmq@^5.9.0` - Uses BullMQ (NOT `bull` or `@nestjs/bull`)
- `@nestjs/*@^11.0.0+` - NestJS 11.x

**After Dependency Changes:** ALWAYS run `npx prisma generate` before building.

## Development Workflows

### Build & Run Commands
```bash
# Backend dev server (from apps/backend/)
npm run start:dev          # Watch mode with hot reload
npm run build              # Production build
npm run start:prod         # Run compiled output

# Prisma operations (from project root or apps/backend/)
npx prisma generate        # Regenerate Prisma Client types
npx prisma migrate dev     # Apply schema changes
npx prisma studio          # GUI database browser
```

### Docker Services
Start dependencies via `infra/docker-compose.yml`:
```bash
docker-compose -f infra/docker-compose.yml up -d postgres redis evolution-api ollama
```

Services:
- `postgres:5432` - PostgreSQL 16
- `redis:6379` - Cache & BullMQ backend
- `evolution-api:8080` - WhatsApp integration
- `ollama:11434` - Self-hosted LLM models

## Code Patterns & Conventions

### Multi-Tenancy (MANDATORY)
**Every database query MUST filter by `tenantId`:**
```typescript
// ✅ Correct
await this.prisma.product.findMany({ 
  where: { tenantId: tenant.id, category: 'electronics' } 
});

// ❌ WRONG - Missing tenant isolation!
await this.prisma.product.findMany({ where: { category: 'electronics' } });
```

Extract `tenantId` from request context (see `tenant/tenant.service.ts` for validation patterns).

### Prisma Service Injection
```typescript
import { PrismaService } from '../../shared/prisma.service';

@Injectable()
export class MyService {
  constructor(private readonly prisma: PrismaService) {}
}
```

### BullMQ Job Queues
```typescript
// Register queue in bull.module.ts
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'my-queue' }),
  ],
})

// Producer
@InjectQueue('my-queue')
private queue: Queue;

await this.queue.add('job-name', { data });

// Consumer (separate processor file)
@Processor('my-queue')
export class MyProcessor {
  @Process('job-name')
  async handleJob(job: Job) { /* ... */ }
}
```

### AI Provider Pattern (`ia/ia.service.ts`)
The IA module supports multiple providers via `AIProvider` enum:
```typescript
enum AIProvider { OPENAI = 'openai', GEMINI = 'gemini', OLLAMA = 'ollama' }

// Check API keys in Tenant.apiKeys before calling cloud providers
// Ollama runs locally (no key required)
```

Include WordPress product context in AI prompts via `WordPressService.searchProducts()`.

## Common Gotchas

1. **Prisma Version**: If you see `@prisma/client` v7 errors, downgrade immediately (see `PLANO_EXECUTAVEL_BACKEND_2025.md` Phase 1).

2. **Missing Types**: After schema changes, run `npx prisma generate` BEFORE `npm run build`.

3. **Queue Jobs Not Processing**: Check Redis connection and ensure BullMQ worker is registered in `app.module.ts`.

4. **WordPress Sync**: Integration URLs must include `/wp-json/` base. Test connection before scheduling auto-sync.

5. **Vendor Mode**: `Tenant.operationMode` affects cart/payment behavior (SELLER vs SERVICE vs SUPPORT).

## Testing & Debugging

**Check Compilation Errors:**
```bash
cd apps/backend
npm run build  # Will surface TypeScript errors
```

**View Logs:**
- Backend logs via `console.log` or NestJS Logger
- Queue jobs: Monitor BullMQ dashboard or Redis directly
- Database: `npx prisma studio` for visual inspection

**Deployment Scripts:** Multiple Python/PowerShell scripts exist for VPS deployment (see `deploy_*.py`). Prioritize manual deployment via `PLANO_EXECUTAVEL_BACKEND_2025.md` until automation is stable.

## Key Reference Files

- `README.md` - API endpoints, stack overview
- `COMECE_AQUI.md` - Quickstart for fixing common issues
- `ARQUITETURA_PATTERNS_RECOMENDADOS.md` - TypeScript strict mode, best practices
- `prisma/schema.prisma` - Database models (source of truth)
- `apps/backend/src/app.module.ts` - Module registry
- `PLANO_EXECUTAVEL_BACKEND_2025.md` - Step-by-step rebuild guide

## When Making Changes

1. **Adding Models**: Update `schema.prisma` → `prisma migrate dev` → `prisma generate`
2. **New Modules**: Follow NestJS structure (module/service/controller), register in `app.module.ts`
3. **External APIs**: Add DTO validation with `class-validator`, handle errors gracefully
4. **Queue Jobs**: Define job types, add processor, test with small batches first
5. **Multi-Tenant Features**: ALWAYS validate `tenantId` in service layer before DB queries
