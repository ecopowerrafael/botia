# 🚀 Quick Reference Guide

## Installation & Setup

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7

### Quick Start
```bash
# 1. Backend setup
cd apps/backend
npm install
npm run start:dev

# 2. In another terminal - Start services
docker compose -f infra/docker-compose.yml up -d

# 3. Download Ollama model (one-time)
docker exec ollama ollama pull neural-chat

# 4. Backend will auto-connect to all services
```

---

## 🔌 API Endpoints

### WordPress Integration

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/wordpress/connect` | Connect WordPress site |
| POST | `/wordpress/:id/configure` | Set fields to sync |
| POST | `/wordpress/:id/sync` | Trigger sync |
| GET | `/wordpress/integrations` | List integrations |
| GET | `/wordpress/:id` | Get details |
| DELETE | `/wordpress/:id` | Disable integration |

### IA Module (Updated)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/ia/process-message` | Chat with AI |

**Providers:** `openai` | `gemini` | `ollama`

---

## 📝 Code Examples

### Connect WordPress
```bash
curl -X POST http://localhost:3000/wordpress/connect \
  -H "Content-Type: application/json" \
  -d '{
    "siteUrl": "https://example.com",
    "username": "wp_user",
    "appPassword": "xxxx xxxx xxxx xxxx",
    "syncProducts": true,
    "productFields": ["name", "price", "description", "images"],
    "syncFrequency": 3600
  }'
```

### Use Ollama AI
```bash
curl -X POST http://localhost:3000/ia/process-message \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-123",
    "message": "What products do we have?",
    "provider": "ollama"
  }'
```

### Use OpenAI AI
```bash
curl -X POST http://localhost:3000/ia/process-message \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-123",
    "message": "What products do we have?",
    "provider": "openai"
  }'
```

---

## 🛠️ Development

### Project Structure
```
apps/backend/src/
├── modules/
│   ├── wordpress/          (NEW - Product sync from WordPress)
│   ├── ia/                 (UPDATED - Now supports Ollama)
│   ├── whatsapp/           (WhatsApp messaging)
│   ├── automation/         (Drip & mass campaigns)
│   ├── knowledge/          (Knowledge base)
│   ├── crm/                (CRM core)
│   ├── tenant/             (Multi-tenancy)
│   ├── kanban/             (Sales pipeline)
│   └── user/               (User management)
├── shared/                 (Prisma service, etc)
└── app.module.ts          (Module registration)
```

### Key Services

#### WordPressService
```typescript
// In your service constructor
constructor(
  private wordPressService: WordPressService,
) {}

// Methods available
async connectWordPress(tenantId, dto) { }
async syncData(tenantId, dto) { }
async getProductsForAIContext(tenantId, query) { }
```

#### IAService
```typescript
// In your service
async processMessage(tenantId, dto) {
  // Automatically includes WordPress context
  // Works with: openai, gemini, ollama
}

// Ollama is now supported
provider: 'ollama' // No API key needed
```

---

## 📊 Database

### Key Models
```prisma
model WordPressIntegration {
  id String @id @default(cuid())
  tenantId String
  siteUrl String
  apiUrl String
  username String
  appPassword String
  syncProducts Boolean @default(true)
  productFields Json? // ["name", "price", ...]
  lastSyncedAt DateTime?
  syncFrequency Int @default(3600)
  // ... relations
}

model WordPressProduct {
  id String @id @default(cuid())
  tenantId String
  wpProductId Int
  name String?
  price Decimal?
  description String?
  images Json? // URLs array
  categories Json? // Category array
  // ... more fields
}
```

### Common Queries
```typescript
// Find products for AI context
const products = await prisma.wordPressProduct.findMany({
  where: { tenantId },
  take: 10
});

// List WordPress integrations
const integrations = await prisma.wordPressIntegration.findMany({
  where: { tenantId }
});
```

---

## 🔐 Environment Variables

### Required
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/bot_ia
REDIS_URL=redis://localhost:6379
```

### Optional (for cloud AI)
```env
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
```

### Auto-configured (Docker)
```env
OLLAMA_API_URL=http://ollama:11434
EVOLUTION_API_URL=http://evolution-api:8080
```

---

## 🐛 Debugging

### Backend logs
```bash
npm run start:dev
# Watch mode - logs all requests/errors
```

### Database issues
```bash
# Connect to PostgreSQL
docker exec -it postgres psql -U postgres -d bot_ia

# Check WordPress data
SELECT * FROM "WordPressIntegration";
SELECT COUNT(*) FROM "WordPressProduct";
```

### Ollama status
```bash
# Check if running
docker exec ollama ollama list

# Pull model if not present
docker exec ollama ollama pull neural-chat

# Check API
curl http://localhost:11434/api/tags
```

---

## 📦 Dependencies

### New Dependencies Added
- No new npm packages (axios already installed)

### Existing Key Packages
- @nestjs/common: 11.0.1
- @prisma/client: 7.3.0
- axios: 1.13.4 (for API calls)
- typescript: 5.7.3

---

## 🧪 Testing

### Run tests
```bash
npm run test
npm run test:watch
npm run test:cov
```

### Manual API tests
```bash
# Use provided test files
./TEST_COMMANDS.sh    # Linux/Mac
./TEST_COMMANDS.bat   # Windows
```

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| `Cannot find module @prisma/client` | Run: `npm install` |
| Ollama timeout | Ensure docker is running: `docker ps` |
| WordPress API fails | Check appPassword is correct format |
| Port already in use | Change port in docker-compose.yml |
| Database migration errors | Run: `npx prisma generate` |

---

## 📚 Documentation Files

- **[README.md](./README.md)** - Main project overview
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Architecture details
- **[FINAL_REPORT.md](./FINAL_REPORT.md)** - Complete delivery report
- **[wordpress/README.md](./apps/backend/src/modules/wordpress/README.md)** - WordPress API docs
- **[AUTOMATION_MODULE.md](./AUTOMATION_MODULE.md)** - Campaigns & scheduling

---

## 🎯 Common Tasks

### Add WordPress to existing feature
```typescript
// Inject service
constructor(private wordPressService: WordPressService) {}

// Get products
const products = await this.wordPressService
  .getProductsForAIContext(tenantId, 'laptop');
```

### Test new AI feature with Ollama
```bash
# 1. Ensure Ollama is running
docker exec ollama ollama list | grep neural-chat

# 2. Make API call with provider: 'ollama'
curl -X POST http://localhost:3000/ia/process-message \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "test", "message": "Hi", "provider": "ollama"}'
```

### Monitor sync status
```bash
# In database
SELECT siteUrl, productCount, lastSyncedAt 
FROM "WordPressIntegration" 
WHERE tenantId = 'your-tenant-id';
```

---

## 🚀 Performance Tips

### Ollama
- Run on dedicated server for production
- Allocate 2+ CPU cores
- Use SSD for model storage
- Consider load balancing for multiple requests

### WordPress Sync
- Schedule sync during off-peak hours
- Cache product queries in Redis
- Limit to essential fields only
- Batch API requests

### Database
- Index: `(tenantId, wpProductId)` on WordPressProduct
- Index: `(tenantId, siteUrl)` on WordPressIntegration
- Archive old sync history regularly

---

## 🔗 Useful Links

- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Ollama Docs](https://ollama.ai)
- [WordPress REST API](https://developer.wordpress.org/rest-api/)
- [Evolution API](https://doc.evolview.io)

---

## 💡 Tips & Tricks

### Quick rebuild
```bash
npm run build
# Or with watch
npm run start:dev
```

### Regenerate types
```bash
npx prisma generate --schema ./prisma/schema.prisma
```

### Format code
```bash
npm run format
npm run lint
```

### Check errors
```bash
npm run build 2>&1 | grep -i error
```

---

**Keep this guide handy for quick reference!** 🚀
