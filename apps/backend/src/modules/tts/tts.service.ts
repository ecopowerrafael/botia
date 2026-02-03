import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../shared/prisma.service';
import {
  GenerateTTSDto,
  GenerateTTSResponseDto,
  ListCacheResponseDto,
  TTSStatusResponseDto,
  GetCachedTTSDto,
  ProcessAndRespondDto,
  ProcessAndRespondResponseDto,
} from './tts.dto';
import * as crypto from 'crypto';

@Injectable()
export class TTSService {
  private ollamaApiUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';

  constructor(
    private httpService: HttpService,
    private prisma: PrismaService,
  ) {}

  /**
   * Gera áudio a partir de texto usando Ollama TTS
   * Usa cache (7 dias) para textos repetidos
   */
  async generateTTS(dto: GenerateTTSDto): Promise<GenerateTTSResponseDto> {
    const { text, language = 'pt', voice = 'pt-br-female', speed = 1.0 } = dto;

    // Validar texto
    if (!text || text.trim().length === 0) {
      throw new BadRequestException('Texto não pode ser vazio');
    }

    if (text.length > 1000) {
      throw new BadRequestException('Texto muito longo (máx 1000 caracteres)');
    }

    const textHash = this.hashText(text, language, voice);

    // Passo 1: Verificar cache
    const cached = await this.getCachedTTS(textHash);
    if (cached) {
      return {
        success: true,
        audioUrl: cached.audioUrl,
        audioFormat: 'ogg',
        durationSeconds: cached.duration || 0,
        text,
        language,
        cacheHit: true,
        model: 'piper',
        processingTimeMs: 0,
        message: 'Áudio gerado a partir do cache (7 dias)',
      };
    }

    // Passo 2: Gerar novo áudio com Ollama
    const startTime = Date.now();
    let audioUrl: string;
    let durationSeconds: number = 0;

    try {
      const response = await this.callOllamaTTS(text, language, voice, speed);
      audioUrl = response.audioUrl;
      durationSeconds = response.duration || this.estimateDuration(text);
    } catch (error) {
      console.error('Erro ao gerar TTS com Ollama:', error);
      throw new BadRequestException('Falha ao gerar áudio: ' + error.message);
    }

    const processingTimeMs = Date.now() - startTime;

    // Passo 3: Salvar no cache
    try {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
      await this.prisma.tTSCache.create({
        data: {
          textHash,
          originalText: text,
          audioUrl,
          audioFormat: 'ogg',
          duration: durationSeconds,
          language,
          voice,
          expiresAt,
          hitCount: 1,
        },
      });
    } catch (error) {
      console.warn('Erro ao salvar cache TTS:', error);
    }

    return {
      success: true,
      audioUrl,
      audioFormat: 'ogg',
      durationSeconds,
      text,
      language,
      cacheHit: false,
      model: 'piper',
      processingTimeMs,
      message: 'Áudio gerado com sucesso',
    };
  }

  /**
   * Listar itens em cache
   */
  async listCache(): Promise<ListCacheResponseDto> {
    const items = await this.prisma.tTSCache.findMany({
      where: {
        expiresAt: { gt: new Date() }, // não expirados
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      total: items.length,
      cached: items.map((item: any) => ({
        id: item.id,
        text: item.originalText,
        language: item.language,
        audioUrl: item.audioUrl,
        createdAt: item.createdAt.toISOString(),
        expiresAt: item.expiresAt.toISOString(),
        hitCount: item.hitCount,
      })),
    };
  }

  /**
   * Obter status e saúde do TTS
   */
  async getStatus(): Promise<TTSStatusResponseDto> {
    let ollamaHealthy = false;
    let ttsModelAvailable = false;

    try {
      const response = await this.httpService.axiosRef.get(
        `${this.ollamaApiUrl}/api/tags`,
        { timeout: 5000 },
      );
      ollamaHealthy = true;

      // Verificar se modelo TTS está disponível
      const models = response.data.models || [];
      ttsModelAvailable = models.some(
        (m: any) => m.name && m.name.includes('piper'),
      );
    } catch (error) {
      console.warn('Ollama não está saudável:', error.message);
    }

    // Stats de cache
    const cacheItems = await this.prisma.tTSCache.findMany({
      where: {
        expiresAt: { gt: new Date() },
      },
    });

    const oldestDate = cacheItems.length > 0 ? cacheItems[0].createdAt : null;
    const newestDate =
      cacheItems.length > 0
        ? cacheItems[cacheItems.length - 1].createdAt
        : null;

    return {
      ollamaHealthy,
      ttsModelAvailable,
      ttsModel: 'piper',
      cacheStats: {
        totalCached: cacheItems.length,
        diskUsageMB: 0, // estimado: ~100KB por áudio = 100 items = 10MB
        oldestCacheDate: oldestDate?.toISOString() || 'N/A',
        newestCacheDate: newestDate?.toISOString() || 'N/A',
      },
    };
  }

  /**
   * Processar transcrição completa:
   * 1. Detectar intenção (delegado ao IntentService)
   * 2. Gerar resposta em texto
   * 3. Gerar áudio da resposta (TTS)
   * 4. Retornar tudo ao cliente
   */
  async processAndRespond(
    dto: ProcessAndRespondDto,
  ): Promise<ProcessAndRespondResponseDto> {
    const { transcript, chatId, intent, responseText, voice } = dto;

    // A intenção e resposta já devem ter vindo do IntentService
    // Aqui apenas geramos o áudio da resposta

    let responseAudioUrl: string | undefined;
    let responseAudioDuration: number | undefined;

    if (responseText) {
      try {
        const ttsResult = await this.generateTTS({
          text: responseText,
          language: 'pt',
          voice: voice || 'pt-br-female',
        });
        responseAudioUrl = ttsResult.audioUrl;
        responseAudioDuration = ttsResult.durationSeconds;
      } catch (error) {
        console.warn('Erro ao gerar áudio de resposta:', error);
        // Continuar mesmo sem áudio
      }
    }

    return {
      transcript,
      intent: intent || 'PERGUNTA',
      responseText: responseText || 'Entendi sua mensagem!',
      responseAudioUrl,
      responseAudioDuration,
      cartItemsAdded: dto.cartItems,
      nextStep: this.suggestNextStep(intent, responseText || 'Entendi sua mensagem!'),
      message: 'Resposta processada com sucesso',
    };
  }

  /**
   * Limpeza de cache expirado
   */
  async cleanupExpiredCache(): Promise<number> {
    const result = await this.prisma.tTSCache.deleteMany({
      where: {
        expiresAt: { lte: new Date() },
      },
    });

    console.log(`Limpeza de TTS cache: ${result.count} itens removidos`);
    return result.count;
  }

  /**
   * ==================== PRIVATE METHODS ====================
   */

  /**
   * Chamar Ollama para gerar TTS
   */
  private async callOllamaTTS(
    text: string,
    language: string,
    voice: string,
    speed: number,
  ): Promise<{ audioUrl: string; duration: number }> {
    try {
      const response = await this.httpService.axiosRef.post(
        `${this.ollamaApiUrl}/api/generate`,
        {
          model: 'piper', // TTS model
          prompt: `Gere áudio em português com o texto: "${text}". Use voz ${voice} e velocidade ${speed}.`,
          stream: false,
        },
        { timeout: 60000 }, // TTS pode demorar
      );

      // Parsear resposta - assumindo que Ollama retorna URL do áudio
      const audioUrl = this.extractAudioUrl(response.data.response) || 'audio.ogg';
      const duration = this.estimateDuration(text);

      return { audioUrl, duration };
    } catch (error) {
      console.error('Erro ao chamar Ollama TTS:', error.message);
      throw error;
    }
  }

  /**
   * Obter cache por hash
   */
  private async getCachedTTS(textHash: string): Promise<any | null> {
    const cached = await this.prisma.tTSCache.findFirst({
      where: {
        textHash,
        expiresAt: { gt: new Date() }, // não expirado
      },
    });

    if (cached) {
      // Incrementar hit count
      await this.prisma.tTSCache.update({
        where: { id: cached.id },
        data: { hitCount: { increment: 1 } },
      });

      return cached;
    }

    return null;
  }

  /**
   * Hash do texto para cache
   */
  private hashText(text: string, language: string, voice: string): string {
    return crypto
      .createHash('sha256')
      .update(`${text}:${language}:${voice}`)
      .digest('hex');
  }

  /**
   * Estimar duração do áudio (aproximado)
   * Português: ~4 caracteres por segundo
   */
  private estimateDuration(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Extrair URL do áudio da resposta Ollama
   */
  private extractAudioUrl(response: string): string | null {
    try {
      const parsed = JSON.parse(response);
      return parsed.audioUrl || parsed.audio_url || null;
    } catch {
      return null;
    }
  }

  /**
   * Sugerir próximo passo baseado na intenção
   */
  private suggestNextStep(intent: string | undefined, responseText: string): string {
    if (!intent) {
      return 'AGUARDAR_ENTRADA';
    }

    switch (intent) {
      case 'COMPRA':
        return 'MOSTRAR_CARRINHO';
      case 'PERGUNTA':
      case 'CARDAPIO':
        return 'AGUARDAR_ENTRADA';
      case 'CANCELAR_PEDIDO':
        return 'PEDIR_CONFIRMACAO';
      case 'RECLAMACAO':
        return 'ESCALAR_SUPORTE';
      default:
        return 'AGUARDAR_ENTRADA';
    }
  }
}
