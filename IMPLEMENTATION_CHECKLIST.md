# ✅ Checklist de Implementação - Todas as Fases

**Status:** Iniciando  
**Data:** Fevereiro 1, 2026  
**Objetivo:** Implementar Sistema Vendedor + Áudio Escalável

---

## 🎯 FASE 1: Database & Models (Semana 1)

### 1.1 Modelos Prisma - Order & OrderItem

- [ ] Adicionar enum `OrderStatus` (DRAFT, CONFIRMED, PENDING_PAYMENT, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- [ ] Adicionar enum `PaymentStatus` (PENDING, PROCESSING, PAID, FAILED, REFUNDED)
- [ ] Criar model `Order` com campos:
  - [ ] id, tenantId, chatId, contactId
  - [ ] vendorId, status, paymentStatus, paymentMethod
  - [ ] sentToVendor, sentToVendorAt, vendorOrderNumber, invoiceUrl
  - [ ] subtotal, tax, discount, total
  - [ ] createdAt, updatedAt, confirmedAt
- [ ] Criar model `OrderItem` com campos:
  - [ ] id, orderId, productName, productSourceId, productSource
  - [ ] unitPrice, quantity, subtotal
- [ ] Criar model `PaymentProof` com campos:
  - [ ] id, orderId, proofType, proofUrl, proofData (JSON)
  - [ ] isVerified, verifiedBy, verifiedAt, verificationNotes
- [ ] Criar relação: `Tenant → Order[]`
- [ ] Criar relação: `Chat → Order[]`
- [ ] Criar relação: `Contact → Order[]`
- [ ] Executar: `npx prisma migrate dev --name add_order_models`

### 1.2 Modelos Prisma - User & Preferences

- [ ] Adicionar enum `UserStatus` (PENDING_ONBOARDING, ACTIVE, INACTIVE, SUSPENDED)
- [ ] Adicionar enum `UserRole` (ADMIN, VENDOR, ATTENDANT, CUSTOMER)
- [ ] Adicionar enum `VendorMode` (SELLER, SERVICE, SUPPORT)
- [ ] Atualizar model `User`:
  - [ ] Adicionar `role: UserRole`
  - [ ] Adicionar `status: UserStatus`
  - [ ] Criar relação `preferences: UserPreferences?`
- [ ] Criar model `UserPreferences` com campos:
  - [ ] id, userId, operationMode (VendorMode)
  - [ ] audioEnabled, audioLanguage, audioSpeed
  - [ ] language, timezone
  - [ ] notificationEmail, notificationSMS
- [ ] Criar relação: `User → UserPreferences?`
- [ ] Executar: `npx prisma migrate dev --name add_user_roles_and_preferences`

### 1.3 Modelos Prisma - Áudio

- [ ] Adicionar enum `AudioStatus` (RECEIVED, CONVERTING, TRANSCRIBED, TRANSCRIPTION_FAILED, PROCESSING_ERROR, PROCESSED)
- [ ] Criar model `AudioMessage` com campos:
  - [ ] id, chatId, contactId
  - [ ] audioPath, mimeType, sizeBytes, duration
  - [ ] status, transcript, transcriptConfidence, transcribedAt, transcriptionTimeMs
  - [ ] errorMessage, createdAt
- [ ] Criar model `TTSCache` com campos:
  - [ ] id, textHash (unique), language, audioPath, audioUrl, duration
  - [ ] provider (OLLAMA, GOOGLE), generatedAt, expiresAt
- [ ] Criar relação: `Chat → AudioMessage[]`
- [ ] Criar índices: `@@index([language, expiresAt])`
- [ ] Executar: `npx prisma migrate dev --name add_audio_models`

### 1.4 Modelos Prisma - WhatsApp & Config

- [ ] Criar model `TenantWhatsAppConfig` com campos:
  - [ ] id, tenantId, vendorPhoneNumber, vendorPhoneName
  - [ ] autoSendOrder, includePaymentProof, invoiceTemplate
- [ ] Atualizar model `Tenant`:
  - [ ] Adicionar `operationMode: VendorMode`
  - [ ] Adicionar `vendorPhone: String?`
  - [ ] Adicionar `enableInvoices: Boolean`
  - [ ] Adicionar `invoiceTemplate: String?`
  - [ ] Criar relação `whatsappConfig: TenantWhatsAppConfig?`
- [ ] Executar: `npx prisma migrate dev --name add_whatsapp_config`

### 1.5 Validar Schema

- [ ] Rodar: `npx prisma generate` (gerar tipos TypeScript)
- [ ] Rodar: `npx prisma db push` (sincronizar com BD)
- [ ] Verificar no banco: tabelas criadas?
- [ ] Testar: `npx prisma studio` (visualizar dados)

---

## 👤 FASE 2: Setup de Usuário & Onboarding (Semana 1)

### 2.1 Backend - Admin Cria Usuário

- [ ] Criar DTO: `CreateUserDto` (email, name, tenantId)
- [ ] Criar endpoint: `POST /admin/users/create`
  - [ ] Gerar `setupToken` (JWT, válido 7 dias)
  - [ ] User.status = `PENDING_ONBOARDING`
  - [ ] Enviar email com link onboarding
  - [ ] Retornar: `{ id, email, status, setupToken }`
- [ ] Criar serviço: `AdminService.createUser()`
- [ ] Integrar envio de email (usar nodemailer ou SendGrid)

### 2.2 Backend - Onboarding Setup

- [ ] Criar DTO: `OnboardingSetupDto`
  ```typescript
  {
    token: string,
    mode: 'VENDOR' | 'ATTENDANT',
    profile: { name, phone },
    botSettings: { language, timezone },
    whatsappPhone?: string  // se VENDOR
  }
  ```
- [ ] Criar endpoint: `POST /onboarding/setup`
  - [ ] Validar token
  - [ ] Criar `UserPreferences` (operationMode, audioEnabled, etc)
  - [ ] Atualizar `User` (role, status = ACTIVE)
  - [ ] Se VENDOR: criar `TenantWhatsAppConfig` com vendorPhoneNumber
  - [ ] Retornar: `{ user, redirectTo: '/dashboard' }`
- [ ] Criar serviço: `OnboardingService`

### 2.3 Frontend - Telas de Onboarding

- [ ] Criar componente: `OnboardingComponent`
- [ ] Step 1: Escolher Modo
  - [ ] Botão: VENDEDOR (com descrição)
  - [ ] Botão: ATENDENTE (com descrição)
- [ ] Step 2: Dados Pessoais
  - [ ] Input: Nome completo
  - [ ] Input: Telefone
- [ ] Step 3: Preferências Bot
  - [ ] Select: Idioma (pt-BR, en-US, es-ES)
  - [ ] Select: Timezone
  - [ ] Toggle: Áudio ativado?
  - [ ] Select: Velocidade áudio (0.5x, 1.0x, 1.5x, 2.0x)
- [ ] Step 4: WhatsApp (condicional - apenas VENDOR)
  - [ ] Input: Número WhatsApp (+55 11 98765-4321)
  - [ ] Validar número
  - [ ] Testar conexão (opcional)
- [ ] Botão: "Finalizar" → chamar `/onboarding/setup`

### 2.4 Testes

- [ ] Teste: Admin cria usuário ✓
- [ ] Teste: Email recebido com link ✓
- [ ] Teste: Usuário acessa onboarding ✓
- [ ] Teste: VENDOR vs ATTENDANT salvo corretamente ✓
- [ ] Teste: UserPreferences criado ✓
- [ ] Teste: TenantWhatsAppConfig criado (VENDOR) ✓

---

## 🛍️ FASE 3: Cart Service + Order (Semana 2)

### 3.1 Redis Service

- [ ] Criar/Atualizar: `RedisService`
  - [ ] Método: `get(key)`
  - [ ] Método: `setex(key, seconds, value)`
  - [ ] Método: `del(key)`
  - [ ] Método: `incr(key)`
  - [ ] Método: `publish(channel, message)`
  - [ ] Método: `subscribe(channel)`

### 3.2 Cart Service

- [ ] Criar: `CartService` com métodos:
  - [ ] `getOrCreateCart(chatId, contactId, tenantId)` - busca Redis → BD → cria novo
  - [ ] `addItem(chatId, dto)` - adiciona OrderItem, atualiza total
  - [ ] `updateItemQuantity(itemId, quantity, chatId)` - atualiza qty
  - [ ] `removeItem(itemId, chatId)` - deleta item
  - [ ] `listItems(chatId)` - lista itens
  - [ ] `getCartSummary(chatId)` - formata resumo para cliente
  - [ ] `confirmOrder(chatId)` - DRAFT → CONFIRMED, remove cache
  - [ ] `cancelOrder(chatId)` - DRAFT → CANCELLED, remove cache
  - [ ] `findItemByName(chatId, productName)` - busca item no cart

### 3.3 Order Service

- [ ] Criar: `OrderService` com métodos:
  - [ ] `updateOrderStatus(orderId, newStatus, notes)`
  - [ ] `getOrder(orderId)` com incluir items
  - [ ] `calculateTotals(orderId)` - atualiza subtotal/total
  - [ ] `getOrdersByStatus(tenantId, status)`

### 3.4 DTOs

- [ ] Criar DTO: `CreateCartItemDto`
- [ ] Criar DTO: `UpdateCartItemDto`

### 3.5 Testes

- [ ] Teste: Criar carrinho vazio ✓
- [ ] Teste: Adicionar item ✓
- [ ] Teste: Atualizar quantidade ✓
- [ ] Teste: Remover item ✓
- [ ] Teste: Confirmar pedido ✓
- [ ] Teste: Cache Redis funciona ✓

---

## 🤖 FASE 4: Payment + Comprovante (Semana 2)

### 4.1 Payment Service

- [ ] Criar: `PaymentService` com métodos:
  - [ ] `processPaymentProof(orderId, file, proofType)` - main
  - [ ] `downloadAudio(url)` - baixar arquivo seguro
  - [ ] `convertPdfToImage(buffer)` - PDF → PNG (ImageMagick)
  - [ ] `optimizeImage(path)` - redimensionar para Ollama
  - [ ] `analyzeReceiptWithOllama(imagePath, proofType)` - chamar Ollama LLaVA
  - [ ] `validatePaymentData(extractedData, orderId)` - validar valor/data/confiança
  - [ ] `hashText(text)` - para cache

### 4.2 Ollama Integration

- [ ] Configurar Ollama com modelo `llava` instalado
- [ ] Criar: `OllamaService` (se não existir)
  - [ ] Método: `generateWithImage(model, prompt, imageBase64)`
  - [ ] Retornar: `{ text, confidence }`

### 4.3 Payment Controller

- [ ] Criar endpoint: `POST /payment-proof/:orderId`
  - [ ] Upload file (multipart)
  - [ ] Chamar PaymentService.processPaymentProof()
  - [ ] Retornar: `{ success, proof, validation }`

### 4.4 Prompts Ollama

- [ ] Definir prompt: `PIX_RECEIPT` (extrai valor, hora, ID transação)
- [ ] Definir prompt: `BANK_SLIP` (extrai valor, vencimento, códigos)
- [ ] Definir prompt: `SCREENSHOT` (genérico)

### 4.5 Validações

- [ ] Validar tamanho arquivo (<25MB)
- [ ] Validar valor (±5% do Order.total)
- [ ] Validar data (não >24h no passado)
- [ ] Validar confidence (>80%)
- [ ] Se passar: Order.paymentStatus = PAID

### 4.6 Testes

- [ ] Teste: Upload imagem PIX ✓
- [ ] Teste: Ollama extrai dados corretos ✓
- [ ] Teste: Validação automática ✓
- [ ] Teste: Erro valor incorreto ✓
- [ ] Teste: Rejeitar imagem baixa qualidade ✓

---

## 📱 FASE 5: Audio Processing (Semana 2-3)

### 5.1 Audio Service - Recebimento

- [ ] Criar: `AudioService` com métodos:
  - [ ] `receiveAudio(chatId, contactId, audioUrl, mimeType, duration)`
  - [ ] `downloadAudio(url)` - seguro
  - [ ] `transcribeAudio(audioId)` - worker
  - [ ] `convertToWav(buffer, mimeType)` - OGG → WAV

### 5.2 Storage Service

- [ ] Criar: `StorageService` (se não existir)
  - [ ] `save(path, buffer)` - S3 ou local
  - [ ] `get(path)` - S3 ou local
  - [ ] `getPublicUrl(path)` - URL pública
- [ ] Suportar: S3 (recomendado) ou filesystem local
- [ ] Variáveis de ambiente:
  - [ ] `STORAGE_PROVIDER` (S3 ou LOCAL)
  - [ ] `AWS_S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`

### 5.3 Audio Models & Database

- [ ] Criar model: `AudioMessage` (já feito acima)
- [ ] Adicionar relação: `Chat → AudioMessage[]`
- [ ] Criar índices para queries rápidas

### 5.4 Transcrição com Ollama Whisper

- [ ] Verificar: Ollama tem modelo `whisper` instalado?
- [ ] Criar método: `OllamaService.transcribe(wavBuffer, language)`
- [ ] Retornar: `{ text, confidence, language }`
- [ ] Suportar: pt-BR, pt-PT, en-US, es-ES

### 5.5 Testes

- [ ] Teste: Webhook recebe áudio ✓
- [ ] Teste: Download arquivo ✓
- [ ] Teste: Conversão OGG → WAV ✓
- [ ] Teste: Transcrição Ollama ✓
- [ ] Teste: Salvar em storage ✓

---

## 🔊 FASE 6: Text-to-Speech & Intent Detection (Semana 3)

### 6.1 TTS Service

- [ ] Criar: `TTSService` com métodos:
  - [ ] `generateSpeech(text, language, options)` - main
  - [ ] `generateWithOllama(text, language, options)` - Ollama TTS (gratuito)
  - [ ] `generateWithGoogle(text, language, options)` - Google Cloud (pago)
  - [ ] `selectVoice(language, gender)` - escolher voz
  - [ ] `hashText(text)` - para cache

### 6.2 TTS Cache

- [ ] Implementar cache em BD (TTSCache model)
- [ ] TTL: 7 dias
- [ ] Hit rate esperado: 60%+ em produção

### 6.3 Ollama TTS Setup

- [ ] Instalar modelo: `piper-tts` em Ollama
  - [ ] Suportar: pt-BR, pt-PT, en-US, es-ES
  - [ ] Vozes: male, female
- [ ] Ou usar: Google Cloud TTS se preferir qualidade

### 6.4 Intent Detector

- [ ] Criar: `IntentDetector` (classe estática)
  - [ ] Método: `detect(message)` - retorna `DetectedIntent`
  - [ ] Padrões regex:
    - [ ] PRICE_CHECK: "qual.*preço|quanto custa"
    - [ ] ADD_TO_CART: "quero|vou|levo"
    - [ ] CONFIRM: "confirma|ok|pronto"
    - [ ] CANCEL: "cancela|não|nunca"
    - [ ] VIEW_CART: "mostra|resumo|total"
    - [ ] GENERAL: fallback
  - [ ] Método: `extractProductName(message)`
  - [ ] Método: `extractQuantity(message)`

### 6.5 Testes

- [ ] Teste: Gerar áudio Ollama ✓
- [ ] Teste: Cache TTS funciona ✓
- [ ] Teste: Detectar intenção PRICE_CHECK ✓
- [ ] Teste: Detectar intenção ADD_TO_CART ✓
- [ ] Teste: Detectar intenção CONFIRM ✓

---

## 🔄 FASE 7: IA Service Integration (Semana 3)

### 7.1 Atualizar IAService

- [ ] Importar: `CartService`, `PaymentService`, `AudioService`, `TTSService`
- [ ] Atualizar método: `processMessage(dto)` para:
  - [ ] Se `dto.audioId`: buscar transcrição de `AudioMessage`
  - [ ] Se não tiver transcrição ainda: retornar erro com delay
  - [ ] Detectar intenção (IntentDetector.detect)
  - [ ] Processar conforme intenção:
    - [ ] PRICE_CHECK → `handlePriceCheck()`
    - [ ] ADD_TO_CART → `handleAddToCart()`
    - [ ] CONFIRM → `handleConfirmOrder()`
    - [ ] CANCEL → `handleCancelOrder()`
    - [ ] VIEW_CART → `handleViewCart()`
    - [ ] GENERAL → `handleGeneralMessage()` (chamar IA)

### 7.2 Handlers - Price Check

- [ ] Método: `handlePriceCheck(productName, tenantId, chatId, contactId)`
  - [ ] Buscar em WordPress
  - [ ] Retornar preço
  - [ ] Criar/atualizar cart vazio

### 7.3 Handlers - Add to Cart

- [ ] Método: `handleAddToCart(message, quantity, chatId, contactId, tenantId)`
  - [ ] Extrair nome do produto
  - [ ] Buscar em WordPress
  - [ ] Adicionar via CartService
  - [ ] Retornar resumo atualizado

### 7.4 Handlers - Confirm Order

- [ ] Método: `handleConfirmOrder(chatId)`
  - [ ] CartService.confirmOrder()
  - [ ] Gerar número de pedido (#YYMMDD-XXXX)
  - [ ] Salvar em BD (Order.status = CONFIRMED)
  - [ ] Retornar mensagem confirmação

### 7.5 Handlers - Cancel Order

- [ ] Método: `handleCancelOrder(chatId)`
  - [ ] CartService.cancelOrder()
  - [ ] Order.status = CANCELLED
  - [ ] Retornar mensagem

### 7.6 Handlers - View Cart

- [ ] Método: `handleViewCart(chatId)`
  - [ ] CartService.getCartSummary()
  - [ ] Retornar formatado

### 7.7 Audio Response

- [ ] Se `User.preferences.audioEnabled`:
  - [ ] Chamar TTSService.generateSpeech()
  - [ ] Retornar junto com texto
  - [ ] Enviar áudio via WhatsApp

### 7.8 Testes

- [ ] Teste: Mensagem texto → processamento normal ✓
- [ ] Teste: Mensagem áudio → transcrição + processamento ✓
- [ ] Teste: Fluxo PRICE_CHECK ✓
- [ ] Teste: Fluxo ADD_TO_CART ✓
- [ ] Teste: Fluxo CONFIRM (salva em BD) ✓
- [ ] Teste: Resposta em áudio ✓

---

## 📬 FASE 8: Vendor Notification (Semana 3)

### 8.1 Vendor Notification Service

- [ ] Criar: `VendorNotificationService` com métodos:
  - [ ] `sendOrderToVendor(orderId)` - main
  - [ ] `formatOrderMessage(order, config)` - HTML formatado
  - [ ] `generateOrderNumber(order)` - #YYMMDD-XXXX
  - [ ] `generateInvoice(order, config)` - HTML → PDF
  - [ ] `generateProofLink(order)` - link para validar comprovante
  - [ ] `sendViaWhatsApp(phone, message, invoiceUrl, proofLink, order)`

### 8.2 Invoice Generation

- [ ] Criar template HTML padrão (ou customizável)
- [ ] Usar puppeteer ou similar: HTML → PDF
- [ ] Salvar em storage (S3/local)
- [ ] Retornar URL pública

### 8.3 WhatsApp com Botões

- [ ] Integrar: Evolution API com botões interativos
- [ ] Botões:
  - [ ] "Ver Comprovante" → abre URL/PDF
  - [ ] "Confirmar Recebimento" → webhook
  - [ ] "Rejeitar Pedido" → webhook

### 8.4 Webhook de Resposta

- [ ] Endpoint: `POST /vendor/confirm-order/:orderId`
  - [ ] Order: PAID → PROCESSING
  - [ ] Notificar cliente
- [ ] Endpoint: `POST /vendor/reject-order/:orderId`
  - [ ] Order: PENDING_PAYMENT → CANCELLED
  - [ ] Notificar cliente
- [ ] Endpoint: `POST /vendor/mark-delivered/:orderId`
  - [ ] Order: PROCESSING → DELIVERED
  - [ ] Notificar cliente

### 8.5 Testes

- [ ] Teste: Enviar pedido ao WhatsApp ✓
- [ ] Teste: Gerar PDF do recibo ✓
- [ ] Teste: Botões no WhatsApp funcionam ✓
- [ ] Teste: Webhook confirmar recebimento ✓
- [ ] Teste: Webhook rejeitar ✓

---

## ⚡ FASE 9: Fila & Escalabilidade (Semana 3-4)

### 9.1 Bull Queue Setup

- [ ] Instalar: `npm install bull @nestjs/bull`
- [ ] Configurar Redis Queue:
  - [ ] Host: `$REDIS_HOST`
  - [ ] Port: `$REDIS_PORT`
- [ ] Criar filas:
  - [ ] `transcribe` - transcrição de áudio
  - [ ] `tts` - geração de voz
  - [ ] `send-audio` - envio de áudio WhatsApp

### 9.2 Transcribe Processor

- [ ] Criar: `TranscribeProcessor` (worker)
  - [ ] `@Process({ concurrency: 3 })` - 3 em paralelo
  - [ ] Retry: 3 tentativas
  - [ ] Timeout: 60s
  - [ ] Chamar: `AudioService.transcribeAudio()`

### 9.3 TTS Processor

- [ ] Criar: `TTSProcessor` (worker)
  - [ ] `@Process({ concurrency: 2 })`
  - [ ] Retry: 2 tentativas
  - [ ] Timeout: 30s
  - [ ] Chamar: `TTSService.generateSpeech()`

### 9.4 Send Audio Processor

- [ ] Criar: `SendAudioProcessor` (worker)
  - [ ] `@Process({ concurrency: 5 })`
  - [ ] Retry: 3 tentativas
  - [ ] Enviar via WhatsApp API
  - [ ] Salvar log

### 9.5 Monitoring

- [ ] Instalar: `npm install bull-board` (dashboard)
- [ ] Acessar: `http://localhost:3000/admin/queues`
- [ ] Monitorar:
  - [ ] Jobs ativos
  - [ ] Jobs com erro
  - [ ] Performance por fila

### 9.6 Testes de Carga

- [ ] Teste: 10 áudios simultâneos ✓
- [ ] Teste: 20 gerações de TTS ✓
- [ ] Teste: Falha de um worker (outro toma) ✓
- [ ] Teste: Retry automático ✓

---

## 🧪 FASE 10: Testes & QA (Semana 4)

### 10.1 Testes Unitários

- [ ] Test: `CartService.addItem()`
- [ ] Test: `CartService.confirmOrder()`
- [ ] Test: `PaymentService.validatePaymentData()`
- [ ] Test: `IntentDetector.detect()`
- [ ] Test: `AudioService.receiveAudio()`
- [ ] Test: `TTSService.generateSpeech()`

### 10.2 Testes de Integração

- [ ] Test: Admin cria user → onboarding ✓
- [ ] Test: Cliente envia áudio → transcrição → resposta ✓
- [ ] Test: Cliente adiciona ao cart → confirma → paga ✓
- [ ] Test: Ollama valida comprovante ✓
- [ ] Test: Envia pedido ao WhatsApp vendedor ✓

### 10.3 Testes E2E

- [ ] Test: Fluxo completo VENDEDOR
  1. Admin cria user
  2. User faz onboarding (VENDOR)
  3. Cliente conversa (texto + áudio)
  4. Cliente compra
  5. Cliente envia comprovante
  6. Vendedor recebe no WhatsApp
  7. Vendedor confirma

- [ ] Test: Fluxo completo ATENDENTE
  1. Admin cria user
  2. User faz onboarding (ATTENDANT)
  3. Cliente conversa (suporte)
  4. Bot responde sem cart

### 10.4 Testes de Performance

- [ ] Latência: Texto → Resposta (<2s)
- [ ] Latência: Áudio → Transcrição + Resposta (<10s)
- [ ] Latência: TTS Cache hit (<100ms)
- [ ] Latência: Payment validation (<15s)
- [ ] Throughput: 10+ usuarios simultâneos

### 10.5 Testes de Segurança

- [ ] Validar: setupToken expira após 7 dias
- [ ] Validar: Usuário não acessa dados de outro tenant
- [ ] Validar: Arquivo upload (validar tipo, tamanho)
- [ ] Validar: Rate limiting em endpoints públicos
- [ ] Testar: SQL injection, XSS, CSRF

### 10.6 Documentação

- [ ] README atualizado com arquitetura
- [ ] API docs (Swagger/OpenAPI)
- [ ] Guia de setup (dev + prod)
- [ ] Guia de troubleshooting

---

## 🚀 FASE 11: Deployment & Produção

### 11.1 Environment Setup

- [ ] Variáveis `.env`:
  ```
  DATABASE_URL=postgresql://...
  REDIS_HOST=localhost
  REDIS_PORT=6379
  OLLAMA_BASE_URL=http://localhost:11434
  STORAGE_PROVIDER=S3 | LOCAL
  AWS_S3_BUCKET=...
  EVOLUTION_API_URL=...
  EVOLUTION_API_KEY=...
  TTS_PROVIDER=OLLAMA | GOOGLE
  EMAIL_PROVIDER=SENDGRID | NODEMAILER
  ```

### 11.2 Docker Setup

- [ ] Atualizar: `docker-compose.yml`
  - [ ] Serviço: PostgreSQL 16
  - [ ] Serviço: Redis 7
  - [ ] Serviço: Ollama (whisper + llava + piper)
  - [ ] Serviço: Backend (NestJS)
  - [ ] Serviço: Bull Board (opcional)

### 11.3 Database Migrations

- [ ] Rodar todas as migrations em produção
- [ ] Backup antes de migrar
- [ ] Verificar: índices criados corretamente

### 11.4 Ollama Models

- [ ] Download: `whisper` (transcrição)
- [ ] Download: `llava` (payment proof)
- [ ] Download: `piper` (TTS)
- [ ] Verificar espaço em disco (10-20GB total)

### 11.5 Deployment

- [ ] Build: `npm run build`
- [ ] Test: `npm run test`
- [ ] Deploy: Heroku / AWS / DigitalOcean
- [ ] Verificar: Health checks
- [ ] Monitorar: Logs, erros

### 11.6 Monitoring & Logs

- [ ] Setup: CloudWatch / Datadog / New Relic
- [ ] Alertas:
  - [ ] Taxa de erro > 5%
  - [ ] Latência > 5s
  - [ ] Fila backlog > 100
  - [ ] Storage > 80%

---

## 📊 RESUMO DE PRIORIDADE

### 🔴 CRÍTICO (Fazer Primeiro)
- [x] Fase 1: Database models
- [x] Fase 2: User setup & onboarding
- [x] Fase 3: Cart service

### 🟠 IMPORTANTE (Fazer Segundo)
- [x] Fase 4: Payment + Ollama
- [x] Fase 5: Audio processing
- [x] Fase 6: TTS + Intent detection

### 🟡 NECESSÁRIO (Fazer Terceiro)
- [x] Fase 7: IA integration
- [x] Fase 8: Vendor notification
- [x] Fase 9: Fila & escalabilidade

### 🟢 EXTRAS (Depois)
- [x] Fase 10: Testes completos
- [x] Fase 11: Production deployment

---

## 📈 Timeline Estimado

| Semana | O quê | % Completo |
|--------|-------|-----------|
| **Semana 1** | DB + User Setup | 30% |
| **Semana 2** | Cart + Payment | 60% |
| **Semana 3** | Audio + IA | 85% |
| **Semana 4** | Testes + Deploy | 100% |

---

## ✨ Checklist Rápida (Copy-Paste)

```
FASE 1 - Database
  - [ ] Models: Order, OrderItem, PaymentProof
  - [ ] Models: User roles, UserPreferences
  - [ ] Models: AudioMessage, TTSCache
  - [ ] Models: TenantWhatsAppConfig
  - [ ] Migrations rodadas

FASE 2 - User Setup
  - [ ] Admin create user endpoint
  - [ ] Onboarding endpoint
  - [ ] Frontend: 4 steps
  - [ ] Email setup

FASE 3 - Cart
  - [ ] CartService (8 métodos)
  - [ ] Order saving
  - [ ] Cache Redis

FASE 4 - Payment
  - [ ] PaymentService
  - [ ] Ollama LLaVA integration
  - [ ] Validação automática

FASE 5 - Audio
  - [ ] AudioService
  - [ ] Webhook WhatsApp
  - [ ] Storage (S3/local)
  - [ ] Transcrição Whisper

FASE 6 - TTS
  - [ ] TTSService
  - [ ] IntentDetector
  - [ ] Cache 7 dias

FASE 7 - IA
  - [ ] IAService atualizado
  - [ ] 5 handlers (price, cart, confirm, cancel, view)
  - [ ] Audio response

FASE 8 - Vendor
  - [ ] VendorNotificationService
  - [ ] Invoice generation
  - [ ] WhatsApp buttons
  - [ ] Webhooks resposta

FASE 9 - Escalabilidade
  - [ ] Bull Queue setup
  - [ ] Transcribe processor (concurrency: 3)
  - [ ] TTS processor (concurrency: 2)
  - [ ] Send audio processor (concurrency: 5)

FASE 10 - Testes
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] E2E tests
  - [ ] Performance tests

FASE 11 - Deploy
  - [ ] .env produção
  - [ ] docker-compose.yml
  - [ ] Ollama models
  - [ ] Migrations BD
  - [ ] Health checks
```

---

**Status Atual:** 📍 Pronto para começar FASE 1  
**Próximo Passo:** Rodar migrações Prisma da Fase 1  
**Tempo Estimado:** 4 semanas (com dev full-time)

Quer começar pelo quê? 🚀
