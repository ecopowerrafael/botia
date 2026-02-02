# 🎤 Fluxo de Áudio Escalável + Setup de Usuário

## 📋 Requisitos

```
✅ Admin Master cria conta para usuário
✅ Usuário escolhe: VENDEDOR ou ATENDENTE
✅ Escolha persiste no banco
✅ Bot adapta respostas conforme modo
✅ Recebimento de áudio (WhatsApp)
✅ Transcrição (Ollama Whisper)
✅ Resposta em áudio (TTS)
✅ Escalável (filas, workers, cache)
```

---

## 🏗️ Arquitetura de Áudio Escalável

```
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp/Cliente                          │
│                   [Envia áudio]                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ (OGG, MP4, AAC)
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Evolution API / Webhook                         │
│         [Recebe arquivo + metadados]                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│         Audio Processing Service (Fila)                      │
│  - Baixa arquivo para storage                               │
│  - Valida tipo/tamanho                                      │
│  - Enfileira para transcrição                               │
└──────────────────────┬──────────────────────────────────────┘
                       │ (Redis Queue)
                       ↓
┌─────────────────────────────────────────────────────────────┐
│         Transcription Worker (Parallelizado)                │
│  - Ollama Whisper transcreve                                │
│  - Salva em cache (60s para retry)                          │
│  - Publica evento: "transcript_ready"                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Message Processing (IA)                         │
│  - Recebe transcript                                         │
│  - Processa conforme modo (VENDOR/ATTENDANT)                │
│  - Responde em texto                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│         Text-to-Speech (TTS) - Parallelizado                │
│  - Google Cloud TTS ou Ollama TTS                           │
│  - Gera áudio MP3                                           │
│  - Salva em storage (S3/local)                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Evolution API / Envio                           │
│         [Envia áudio de volta]                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp/Cliente                          │
│                   [Recebe áudio]                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 👤 Setup de Usuário: Fluxo Completo

### 1️⃣ Admin Master cria usuário

```typescript
// admin.controller.ts

@Post('users/create')
async createUser(@Body() dto: CreateUserDto) {
  return await this.adminService.createUser({
    email: 'vendedor@shop.com',
    name: 'João Vendedor',
    tenantId: 'tenant-123',
    // ✨ NOVO: Não define role/mode ainda
    // Usuário vai escolher na próxima tela
  });
}

// Response:
{
  id: 'user-456',
  email: 'vendedor@shop.com',
  status: 'PENDING_ONBOARDING',  // ✨ NOVO
  setupToken: 'token-xxx...'      // ✨ NOVO (válido 7 dias)
}
```

### 2️⃣ Usuário recebe email com link

```
Olá João Vendedor,

Sua conta foi criada! 🎉

Para começar, complete sua configuração:
→ https://app.com/onboarding?token=token-xxx...

O link expira em 7 dias.
```

### 3️⃣ Frontend: Tela de Onboarding

```typescript
// onboarding.component.ts

interface OnboardingStep {
  step: 1 | 2 | 3 | 4;
  completed: boolean;
}

class OnboardingComponent {
  steps: OnboardingStep[] = [
    { step: 1, completed: false }, // Definir Modo
    { step: 2, completed: false }, // Dados Pessoais
    { step: 3, completed: false }, // Configurações Bot
    { step: 4, completed: false }, // WhatsApp (se vendedor)
  ];

  // STEP 1: Escolher Modo
  selectMode(mode: 'VENDOR' | 'ATTENDANT') {
    // Mostrar descrição de cada modo
  }

  // STEP 2: Dados Pessoais
  updateProfile(name: string, phone: string) {
    // Salvar dados
  }

  // STEP 3: Configurações Bot
  configureBot(settings: BotSettings) {
    // Language, timezone, etc
  }

  // STEP 4: WhatsApp (apenas se VENDOR)
  configureWhatsApp(vendorPhone: string) {
    // Validar e salvar número
  }
}
```

### 4️⃣ Backend: Endpoint de Onboarding

```typescript
// onboarding.controller.ts

@Post('onboarding/setup')
async setupUser(@Body() dto: OnboardingSetupDto) {
  const { token, mode, profile, botSettings, whatsappPhone } = dto;

  // [1] Validar token
  const userData = await this.onboardingService.validateToken(token);

  // [2] Atualizar usuário
  const user = await this.prisma.user.update({
    where: { id: userData.userId },
    data: {
      role: mode === 'VENDOR' ? 'VENDOR' : 'ATTENDANT',
      name: profile.name,
      phone: profile.phone,
      status: 'ACTIVE',
      onboardingCompletedAt: new Date(),
      // ✨ NOVO: Guarda modo original
      userPreferences: {
        create: {
          operationMode: mode,
          language: botSettings.language,
          timezone: botSettings.timezone,
        },
      },
    },
  });

  // [3] Se VENDOR: Criar configuração WhatsApp
  if (mode === 'VENDOR' && whatsappPhone) {
    await this.prisma.tenantWhatsAppConfig.upsert({
      where: { tenantId: user.tenantId },
      create: {
        tenantId: user.tenantId,
        vendorPhoneNumber: whatsappPhone,
      },
      update: {
        vendorPhoneNumber: whatsappPhone,
      },
    });
  }

  return {
    message: 'Configuração concluída!',
    user,
    redirectTo: '/dashboard',
  };
}
```

### 5️⃣ Modelo Prisma: UserPreferences

```prisma
model User {
  id                String   @id @default(uuid())
  tenantId          String   @db.Uuid
  tenant            Tenant   @relation(fields: [tenantId], references: [id])
  
  email             String
  name              String
  phone             String?
  
  // ✨ NOVO: Status do onboarding
  status            UserStatus @default(PENDING_ONBOARDING)
  onboardingCompletedAt DateTime?
  
  role              UserRole @default(CUSTOMER)
  
  // ✨ NOVO: Preferências
  preferences       UserPreferences?
  
  whatsAppInstances WhatsAppInstance[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([tenantId, email])
}

enum UserStatus {
  PENDING_ONBOARDING
  ACTIVE
  INACTIVE
  SUSPENDED
}

model UserPreferences {
  id                String   @id @default(uuid())
  userId            String   @db.Uuid
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // ✨ NOVO: Modo do bot
  operationMode     VendorMode @default(SELLER)  // SELLER, SERVICE, SUPPORT
  audioEnabled      Boolean  @default(true)
  audioLanguage     String   @default("pt-BR")
  audioSpeed        Float    @default(1.0)        // 0.5 a 2.0
  
  language          String   @default("pt-BR")
  timezone          String   @default("America/Sao_Paulo")
  
  notificationEmail Boolean  @default(true)
  notificationSMS   Boolean  @default(false)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([userId])
}
```

---

## 🎤 Fluxo de Áudio: Implementação

### 1️⃣ Audio Processing Service (Recebimento)

```typescript
// audio.service.ts

@Injectable()
export class AudioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly storageService: StorageService,
    private readonly queueService: QueueService,
    private readonly logger: Logger = new Logger(AudioService.name),
  ) {}

  /**
   * Webhook: Receber áudio do WhatsApp
   */
  async receiveAudio(
    chatId: string,
    contactId: string,
    audioUrl: string,
    mimeType: string,
    duration: number,
  ) {
    const audioId = generateId();
    
    this.logger.log(`📥 Áudio recebido: ${audioId} (${duration}s)`);

    try {
      // [1] Baixar arquivo
      const audioBuffer = await this.downloadAudio(audioUrl);
      const audioPath = `audio/raw/${audioId}.ogg`;
      await this.storageService.save(audioPath, audioBuffer);

      // [2] Validar tamanho (max 25MB para WhatsApp)
      if (audioBuffer.length > 25 * 1024 * 1024) {
        throw new Error('Áudio muito grande');
      }

      // [3] Salvar metadados
      const audioRecord = await this.prisma.audioMessage.create({
        data: {
          id: audioId,
          chatId,
          contactId,
          audioPath,
          mimeType,
          duration,
          sizeBytes: audioBuffer.length,
          status: 'RECEIVED',
        },
      });

      // [4] Enfileirar para transcrição
      await this.queueService.enqueue('transcribe', {
        audioId,
        chatId,
        contactId,
        mimeType,
      });

      // [5] Cache: marca para retry (60s)
      await this.redisService.setex(
        `audio:pending:${audioId}`,
        60,
        JSON.stringify(audioRecord),
      );

      return { audioId, status: 'QUEUED' };
    } catch (error) {
      this.logger.error(`Audio receive error: ${error.message}`);
      await this.prisma.audioMessage.update({
        where: { id: audioId },
        data: { status: 'ERROR', errorMessage: error.message },
      });
      throw error;
    }
  }

  /**
   * Download seguro de arquivo
   */
  private async downloadAudio(url: string): Promise<Buffer> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });
    return response.data;
  }

  /**
   * Worker: Transcrever áudio
   * Processa em paralelo (múltiplos workers)
   */
  async transcribeAudio(audioId: string): Promise<void> {
    this.logger.log(`🎙️ Transcrevendo: ${audioId}`);

    try {
      // [1] Buscar arquivo
      const audio = await this.prisma.audioMessage.findUnique({
        where: { id: audioId },
      });

      if (!audio) {
        throw new Error('Áudio não encontrado');
      }

      const audioBuffer = await this.storageService.get(audio.audioPath);

      // [2] Converter para WAV se necessário
      let wavBuffer = audioBuffer;
      if (audio.mimeType !== 'audio/wav') {
        wavBuffer = await this.convertToWav(audioBuffer, audio.mimeType);
      }

      // [3] Chamar Ollama Whisper
      const transcript = await this.ollama.transcribe(wavBuffer, 'pt');
      // resposta:
      // {
      //   text: "Quero 2 garrafas de vinho tinto",
      //   confidence: 0.95,
      //   language: "pt"
      // }

      // [4] Salvar transcrição
      await this.prisma.audioMessage.update({
        where: { id: audioId },
        data: {
          transcript: transcript.text,
          transcriptConfidence: transcript.confidence,
          status: 'TRANSCRIBED',
          transcribedAt: new Date(),
          transcriptionTimeMs: Date.now() - audio.createdAt.getTime(),
        },
      });

      // [5] Publicar evento (para processamento da mensagem)
      await this.redisService.publish('audio:transcribed', {
        audioId,
        chatId: audio.chatId,
        contactId: audio.contactId,
        transcript: transcript.text,
      });

      this.logger.log(`✓ Transcrito com sucesso: "${transcript.text}"`);
    } catch (error) {
      this.logger.error(`Transcription error: ${error.message}`);
      await this.prisma.audioMessage.update({
        where: { id: audioId },
        data: {
          status: 'TRANSCRIPTION_FAILED',
          errorMessage: error.message,
        },
      });
      throw error;
    }
  }

  /**
   * Converter áudio para WAV (formato esperado por Whisper)
   */
  private async convertToWav(buffer: Buffer, mimeType: string): Promise<Buffer> {
    // Usar ffmpeg-static ou similar
    // Placeholder: implementar com ffmpeg
    
    // Exemplo com ffmpeg:
    // ffmpeg -i input.ogg -acodec pcm_s16le -ar 16000 output.wav
    
    // Por enquanto, assumir que é OGG e converter
    const { execSync } = require('child_process');
    const inputPath = `/tmp/audio-${Date.now()}.ogg`;
    const outputPath = `/tmp/audio-${Date.now()}.wav`;

    fs.writeFileSync(inputPath, buffer);
    execSync(
      `ffmpeg -i ${inputPath} -acodec pcm_s16le -ar 16000 ${outputPath} -y`,
      { stdio: 'ignore' },
    );

    const wavBuffer = fs.readFileSync(outputPath);
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    return wavBuffer;
  }
}
```

### 2️⃣ Message Processing (Usa transcrição)

```typescript
// ia.service.ts - atualizado

@Injectable()
export class IAService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audioService: AudioService,
    private readonly ttsService: TTSService,
    // ... outros
  ) {}

  /**
   * Processar mensagem (texto OU áudio)
   */
  async processMessage(dto: ProcessMessageDto) {
    let userMessage = dto.userMessage;
    let audioId = dto.audioId; // ✨ NOVO

    // Se for áudio, pegar transcrição
    if (audioId) {
      const audio = await this.prisma.audioMessage.findUnique({
        where: { id: audioId },
      });

      if (!audio?.transcript) {
        return {
          error: 'Áudio ainda sendo processado. Tente novamente em alguns segundos.',
          audioId,
        };
      }

      userMessage = audio.transcript;
    }

    // [RESTO DO PROCESSAMENTO NORMAL]
    // Detectar intenção, processar cart, etc...
    const response = await this.handleMessage(
      dto.tenantId,
      dto.chatId,
      dto.contactId,
      userMessage,
      dto.userRole || 'CUSTOMER',
    );

    // ✨ NOVO: Se usuário preferir, enviar resposta em áudio
    if (dto.preferAudio) {
      const audioResponse = await this.ttsService.generateSpeech(
        response.text,
        dto.audioLanguage || 'pt-BR',
        { speed: dto.audioSpeed || 1.0 },
      );

      return {
        ...response,
        audio: {
          url: audioResponse.url,
          duration: audioResponse.duration,
        },
      };
    }

    return response;
  }

  /**
   * Processar mensagem conforme modo (VENDOR ou ATTENDANT)
   */
  private async handleMessage(
    tenantId: string,
    chatId: string,
    contactId: string,
    message: string,
    userRole: UserRole,
  ) {
    // Detectar intenção
    const intent = IntentDetector.detect(message);

    // ✨ NOVO: Adaptar resposta conforme modo
    const user = await this.prisma.user.findFirst({
      where: { tenantId, role: userRole },
      include: { preferences: true },
    });

    const operationMode = user?.preferences?.operationMode;

    // [RESTO DO PROCESSAMENTO]
    // ...

    return { text: response };
  }
}
```

### 3️⃣ Text-to-Speech Service

```typescript
// tts.service.ts

@Injectable()
export class TTSService {
  constructor(
    private readonly redisService: RedisService,
    private readonly storageService: StorageService,
    private readonly logger: Logger = new Logger(TTSService.name),
  ) {}

  /**
   * Gerar áudio a partir de texto
   * Opção 1: Google Cloud TTS (pago)
   * Opção 2: Ollama TTS (local, gratuito)
   */
  async generateSpeech(
    text: string,
    language: string = 'pt-BR',
    options?: {
      speed?: number; // 0.5 a 2.0
      pitch?: number; // -20 a +20
      voiceGender?: 'MALE' | 'FEMALE';
    },
  ): Promise<{ url: string; duration: number }> {
    const cacheKey = `tts:${this.hashText(text)}:${language}`;

    // [1] Verificar cache
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.debug(`TTS cache hit: ${cacheKey}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn('TTS cache check failed');
    }

    const audioId = generateId();
    let audioPath: string;
    let duration: number;

    try {
      // [2] Gerar áudio
      if (process.env.TTS_PROVIDER === 'GOOGLE') {
        // Google Cloud TTS
        const result = await this.generateWithGoogle(
          text,
          language,
          options,
        );
        audioPath = result.path;
        duration = result.duration;
      } else {
        // Ollama TTS (padrão - gratuito)
        const result = await this.generateWithOllama(text, language, options);
        audioPath = result.path;
        duration = result.duration;
      }

      // [3] Salvar em storage
      const audioUrl = await this.storageService.getPublicUrl(audioPath);

      const result = {
        url: audioUrl,
        duration,
        audioPath,
        generatedAt: new Date(),
      };

      // [4] Cache por 7 dias
      await this.redisService.setex(cacheKey, 7 * 24 * 60 * 60, JSON.stringify(result));

      this.logger.log(`✓ TTS gerado: ${duration}s`);
      return result;
    } catch (error) {
      this.logger.error(`TTS generation failed: ${error.message}`);
      // Fallback: texto em HTML
      return {
        url: null,
        duration: 0,
        error: error.message,
      };
    }
  }

  /**
   * TTS com Ollama (gratuito, local)
   */
  private async generateWithOllama(
    text: string,
    language: string,
    options?: any,
  ): Promise<{ path: string; duration: number }> {
    // Usar Ollama com plugin TTS
    // Modelos: gpt-tts, piper-tts (se instalado)
    
    // Exemplo usando piper-tts (offline)
    const { execSync } = require('child_process');
    const audioId = generateId();
    const outputPath = `/audio/tts/${audioId}.wav`;

    try {
      // Language code: pt_BR, pt_PT, etc
      const langCode = language.replace('-', '_');
      
      // Executar piper-tts
      execSync(
        `echo "${text.replace(/"/g, '\\"')}" | piper --model ${langCode} --output_file ${outputPath}`,
        { stdio: 'ignore' },
      );

      // Calcular duração (aproximado: 150 chars por minuto)
      const duration = Math.ceil((text.length / 150) * 60);

      return { path: outputPath, duration };
    } catch (error) {
      this.logger.error(`Ollama TTS failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * TTS com Google Cloud (pago, mas melhor qualidade)
   */
  private async generateWithGoogle(
    text: string,
    language: string,
    options?: any,
  ): Promise<{ path: string; duration: number }> {
    // Usar Google Cloud Text-to-Speech API
    // Requer credenciais
    
    const client = new TextToSpeechClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    const request = {
      input: { text },
      voice: {
        languageCode: language,
        name: this.selectVoice(language, options?.voiceGender),
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: options?.speed || 1.0,
        pitch: options?.pitch || 0,
      },
    };

    const [response] = await client.synthesizeSpeech(request);
    const audioId = generateId();
    const outputPath = `/audio/tts/${audioId}.mp3`;

    await this.storageService.save(outputPath, response.audioContent);

    // Calcular duração (aproximado)
    const duration = Math.ceil((text.length / 150) * 60);

    return { path: outputPath, duration };
  }

  private selectVoice(language: string, gender?: string): string {
    const voices = {
      'pt-BR': {
        MALE: 'pt-BR-Neural2-B',
        FEMALE: 'pt-BR-Neural2-A',
      },
      'pt-PT': {
        MALE: 'pt-PT-Neural2-B',
        FEMALE: 'pt-PT-Neural2-A',
      },
    };

    const defaultGender = gender || 'FEMALE';
    return voices[language]?.[defaultGender] || 'pt-BR-Neural2-A';
  }

  private hashText(text: string): string {
    return require('crypto')
      .createHash('md5')
      .update(text)
      .digest('hex');
  }
}
```

### 4️⃣ Models: AudioMessage

```prisma
model AudioMessage {
  id                String   @id @default(uuid())
  
  chatId            String   @db.Uuid
  chat              Chat     @relation(fields: [chatId], references: [id])
  
  contactId         String   @db.Uuid
  contact           Contact  @relation(fields: [contactId], references: [id])
  
  // ===== Áudio Original =====
  audioPath         String   // s3://bucket/audio/raw/xxx.ogg
  mimeType          String   // audio/ogg, audio/wav, etc
  sizeBytes         Int
  duration          Int      // em segundos
  
  // ===== Status =====
  status            AudioStatus @default(RECEIVED)
  // RECEIVED → TRANSCRIBED → PROCESSED
  // ou: RECEIVED → TRANSCRIPTION_FAILED
  
  // ===== Transcrição =====
  transcript        String?
  transcriptConfidence Float?  // 0.0 a 1.0
  transcribedAt     DateTime?
  transcriptionTimeMs Int?      // tempo levado
  
  // ===== Erros =====
  errorMessage      String?
  
  createdAt         DateTime @default(now())
}

enum AudioStatus {
  RECEIVED
  CONVERTING
  TRANSCRIBED
  TRANSCRIPTION_FAILED
  PROCESSING_ERROR
  PROCESSED
}

model TTSCache {
  id                String   @id @default(uuid())
  
  textHash          String   @unique  // hash do texto
  language          String
  
  audioPath         String   // s3://bucket/audio/tts/xxx.mp3
  audioUrl          String   // URL pública
  duration          Int
  
  provider          String   // OLLAMA, GOOGLE
  generatedAt       DateTime @default(now())
  expiresAt         DateTime // 7 dias
  
  @@index([language, expiresAt])
}
```

---

## 🔄 Fluxo Completo: Áudio + Modo

```
┌─────────────────────────────────────────────┐
│           ONBOARDING (1ª vez)                │
├─────────────────────────────────────────────┤

Admin: Cria usuário → email com link
         ↓
Usuário: Acessa onboarding
    ├─ Step 1: Escolhe VENDEDOR ou ATENDENTE
    ├─ Step 2: Dados pessoais
    ├─ Step 3: Preferências bot (áudio on/off)
    └─ Step 4: WhatsApp (se VENDEDOR)
         ↓
User.role = VENDOR
UserPreferences.operationMode = SELLER
UserPreferences.audioEnabled = true
UserPreferences.audioLanguage = pt-BR
         ↓
[Setup concluído ✓]

└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│    CONVERSA (Cliente com Bot)                │
├─────────────────────────────────────────────┤

Cliente: Envia áudio 🎤
    ↓
[WhatsApp] → Webhook (audioUrl)
    ↓
AudioService.receiveAudio()
├─ Download arquivo
├─ Validar tamanho
├─ Salvar em storage
└─ Enfileirar transcrição
    ↓
[Redis Queue] → "transcribe"
    ↓
Worker: Ollama Whisper.transcribe()
├─ Converter para WAV
├─ Chamar Ollama
└─ Salvar transcrição
    ↓
[Redis Pub/Sub] → "audio:transcribed"
{
  audioId: "...",
  transcript: "Quero 2 vinhos",
  confidence: 0.95
}
    ↓
IAService.processMessage()
├─ Buscar transcript
├─ Detectar intenção
├─ Processar conforme modo (VENDOR/ATTENDANT)
└─ Retorna resposta em texto
    ↓
[User.preferences.audioEnabled = true?]
    ├─ SIM: Gerar áudio
    │   └─ TTSService.generateSpeech()
    │       ├─ Cache hit? Retornar
    │       └─ Ollama TTS / Google TTS
    │
    └─ NÃO: Só texto
    ↓
Enviar resposta
├─ Texto: via message.text
└─ Áudio: via WhatsApp media

└─────────────────────────────────────────────┘
```

---

## 📊 Escalabilidade: Arquitetura em Produção

### Fila de Processamento (Bull Queue)

```typescript
// queue.module.ts

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
    }),
    BullModule.registerQueue({
      name: 'transcribe',        // Fila de transcrição
      name: 'tts',               // Fila de TTS
      name: 'send-audio',        // Fila de envio
    }),
  ],
})
export class QueueModule {}
```

### Workers Paralelos

```typescript
// transcribe.processor.ts

@Processor('transcribe')
export class TranscribeProcessor {
  constructor(private readonly audioService: AudioService) {}

  @Process({ concurrency: 3 }) // 3 transcrições em paralelo
  async handle(job: Job) {
    return await this.audioService.transcribeAudio(job.data.audioId);
  }

  @OnQueueFailed()
  async handleFailed(job: Job, err: Error) {
    // Retry: 3 tentativas, esperar 5 segundos
    console.error(`Job ${job.id} failed: ${err.message}`);
  }
}
```

### Storage (S3 ou Local)

```typescript
// storage.service.ts

@Injectable()
export class StorageService {
  private s3: AWS.S3;

  async save(path: string, buffer: Buffer): Promise<void> {
    // Opção 1: S3
    if (process.env.STORAGE_PROVIDER === 'S3') {
      await this.s3.putObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: path,
        Body: buffer,
        ContentType: this.getMimeType(path),
      }).promise();
    }
    // Opção 2: Local
    else {
      const fullPath = path.join(process.env.UPLOAD_DIR, path);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, buffer);
    }
  }

  async get(path: string): Promise<Buffer> {
    if (process.env.STORAGE_PROVIDER === 'S3') {
      const result = await this.s3
        .getObject({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: path,
        })
        .promise();
      return result.Body as Buffer;
    } else {
      return fs.readFileSync(path.join(process.env.UPLOAD_DIR, path));
    }
  }
}
```

---

## ⚙️ Checklist de Implementação

```
FASE 1: Setup de Usuário
  [ ] Atualizar User model (role, status)
  [ ] Criar UserPreferences model
  [ ] Endpoint: Create user (admin)
  [ ] Endpoint: Onboarding setup
  [ ] Frontend: Telas de onboarding

FASE 2: Áudio (Recebimento)
  [ ] Criar AudioMessage model
  [ ] AudioService.receiveAudio()
  [ ] Validação de arquivo
  [ ] Upload para storage (S3/local)
  [ ] Enfileirar para transcrição

FASE 3: Transcrição (Ollama Whisper)
  [ ] Integrar Ollama Whisper
  [ ] AudioService.transcribeAudio()
  [ ] Converter OGG → WAV
  [ ] Salvar transcrição
  [ ] Publicar evento Redis

FASE 4: Processamento (IA)
  [ ] IAService.processMessage() com áudio
  [ ] Adaptar resposta conforme modo (VENDOR/ATTENDANT)
  [ ] Integração com CartService

FASE 5: Text-to-Speech
  [ ] Criar TTSService
  [ ] Integrar Ollama TTS (gratuito)
  [ ] Integrar Google TTS (opcional)
  [ ] Cache de TTS (7 dias)
  [ ] Criar TTSCache model

FASE 6: Envio de Áudio
  [ ] Enviar áudio via WhatsApp
  [ ] Enviar áudio via Evolution API
  [ ] Testar fila de envio

FASE 7: Escalabilidade
  [ ] Setup Bull Queue (Redis)
  [ ] Workers paralelos (concurrency: 3)
  [ ] Retry logic (3 tentativas)
  [ ] Monitoramento (logs, métricas)

FASE 8: Testes
  [ ] Teste E2E: texto + áudio
  [ ] Teste modo VENDOR + ATTENDANT
  [ ] Teste transcrição (idiomas)
  [ ] Teste TTS (vozes)
  [ ] Teste carga (10+ áudios simultâneos)
```

---

## 📊 Métricas de Performance Esperadas

| Métrica | Esperado | Com Cache |
|---------|----------|-----------|
| Recebimento | 100ms | - |
| Transcrição | 5-30s | - |
| IA (processamento) | 1-2s | - |
| TTS (geração) | 3-10s | **<100ms** |
| TTS (google) | 2-5s | **<100ms** |
| **TOTAL (1ª vez)** | **10-45s** | - |
| **TOTAL (com cache)** | **8-35s** | **2-4s** |

---

## 📱 Experiência do Usuário

```
VENDEDOR:
"Quero saber o preço do vinho tinto" 🎤
  ↓
[3s depois]
"R$ 45 por garrafa. Pode levar?" 🔊

ATENDENTE:
"Qual é o seu problema?" 🎤
  ↓
[2s depois]
"Desculpe, não entendi. Pode repetir?" 🔊
```

---

## 🚀 Próximas Etapas

Qual fase quer implementar primeiro?

1. **FASE 1**: Setup de usuário (onboarding + persistência)
2. **FASE 2**: Recebimento de áudio (webhook + storage)
3. **FASE 3**: Transcrição (Ollama Whisper)
4. **FASE 4**: Processamento (adaptar IAService)
5. **FASE 5**: Text-to-Speech (áudio de volta)

Recomendo: **FASE 1 → FASE 2 → FASE 3** primeiro (esses são base para as outras).

Ou quer um **teste rápido da transcrição com Ollama** antes de mexer no banco?
