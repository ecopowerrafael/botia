import { Controller, Post, Body, Get } from '@nestjs/common';
import { TTSService } from './tts.service';
import {
  GenerateTTSDto,
  GenerateTTSResponseDto,
  ListCacheResponseDto,
  TTSStatusResponseDto,
  GetCachedTTSDto,
  ProcessAndRespondDto,
  ProcessAndRespondResponseDto,
} from './tts.dto';

@Controller('tts')
export class TTSController {
  constructor(private readonly ttsService: TTSService) {}

  /**
   * POST /tts/generate
   * Gera áudio a partir de texto (Text-to-Speech)
   * Usa cache de 7 dias para textos repetidos
   *
   * Body:
   * {
   *   "text": "Olá, bem-vindo!",
   *   "language": "pt",
   *   "voice": "pt-br-female",
   *   "speed": 1.0
   * }
   *
   * Response (200 OK):
   * {
   *   "success": true,
   *   "audioUrl": "s3://bucket/tts/audio-hash.ogg",
   *   "audioFormat": "ogg",
   *   "durationSeconds": 3,
   *   "text": "Olá, bem-vindo!",
   *   "language": "pt",
   *   "cacheHit": false,
   *   "model": "piper",
   *   "processingTimeMs": 2500,
   *   "message": "Áudio gerado com sucesso"
   * }
   */
  @Post('generate')
  async generateTTS(
    @Body() dto: GenerateTTSDto,
  ): Promise<GenerateTTSResponseDto> {
    return await this.ttsService.generateTTS(dto);
  }

  /**
   * GET /tts/cached
   * Verifica se um texto já tem áudio em cache
   *
   * Body:
   * {
   *   "text": "Olá, bem-vindo!",
   *   "language": "pt"
   * }
   */
  @Post('cached')
  async getCachedTTS(@Body() dto: GetCachedTTSDto): Promise<any> {
    return await this.ttsService.getCachedTTS(dto);
  }

  /**
   * GET /tts/cache/list
   * Lista todos os áudios em cache (não expirados)
   *
   * Response (200 OK):
   * {
   *   "total": 42,
   *   "cached": [
   *     {
   *       "id": "cache-uuid-1",
   *       "text": "Olá, bem-vindo!",
   *       "language": "pt",
   *       "audioUrl": "s3://bucket/tts/hash1.ogg",
   *       "createdAt": "2026-02-01T10:00:00Z",
   *       "expiresAt": "2026-02-08T10:00:00Z",
   *       "hitCount": 15
   *     }
   *   ]
   * }
   */
  @Get('cache/list')
  async listCache(): Promise<ListCacheResponseDto> {
    return await this.ttsService.listCache();
  }

  /**
   * GET /tts/status
   * Obter status de saúde do TTS e Ollama
   *
   * Response (200 OK):
   * {
   *   "ollamaHealthy": true,
   *   "ttsModelAvailable": true,
   *   "ttsModel": "piper",
   *   "cacheStats": {
   *     "totalCached": 42,
   *     "diskUsageMB": 4.2,
   *     "oldestCacheDate": "2026-01-31T10:00:00Z",
   *     "newestCacheDate": "2026-02-01T15:30:00Z"
   *   }
   * }
   */
  @Get('status')
  async getStatus(): Promise<TTSStatusResponseDto> {
    return await this.ttsService.getStatus();
  }

  /**
   * POST /tts/process-and-respond
   * Processar transcrição + gerar resposta em áudio
   * Fluxo completo: texto → intenção → resposta → áudio
   *
   * Body:
   * {
   *   "transcript": "Quero dois vinhos",
   *   "chatId": "chat-123",
   *   "intent": "COMPRA",
   *   "responseText": "✓ Adicionei 2x vinho ao seu carrinho",
   *   "voice": "pt-br-female"
   * }
   *
   * Response (200 OK):
   * {
   *   "transcript": "Quero dois vinhos",
   *   "intent": "COMPRA",
   *   "responseText": "✓ Adicionei 2x vinho ao seu carrinho",
   *   "responseAudioUrl": "s3://bucket/tts/response-hash.ogg",
   *   "responseAudioDuration": 4,
   *   "cartItemsAdded": [
   *     { "productName": "vinho", "quantity": 2 }
   *   ],
   *   "nextStep": "MOSTRAR_CARRINHO",
   *   "message": "Resposta processada com sucesso"
   * }
   */
  @Post('process-and-respond')
  async processAndRespond(
    @Body() dto: ProcessAndRespondDto,
  ): Promise<ProcessAndRespondResponseDto> {
    return await this.ttsService.processAndRespond(dto);
  }

  /**
   * GET /tts/cleanup-cache
   * Limpar cache expirado (executar periodicamente)
   *
   * Response (200 OK):
   * {
   *   "removed": 5,
   *   "message": "5 itens de cache expirado removidos"
   * }
   */
  @Get('cleanup-cache')
  async cleanupCache(): Promise<{ removed: number; message: string }> {
    const removed = await this.ttsService.cleanupExpiredCache();
    return {
      removed,
      message: `${removed} itens de cache expirado removidos`,
    };
  }
}
