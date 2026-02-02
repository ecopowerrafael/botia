import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { AudioService } from '../modules/audio/audio.service';
import { ConversationService } from '../modules/conversation/conversation.service';

/**
 * Audio Queue Processor
 *
 * Processa tarefas de áudio em background:
 * ✅ Transcrição com Ollama Whisper
 * ✅ Detecção de intenção
 * ✅ Geração de resposta com IA
 * ✅ Síntese de voz (TTS)
 *
 * Job timeout: 120 segundos (suficiente para Ollama)
 * Retry: 3 tentativas com backoff exponencial
 */
@Processor('audio')
@Injectable()
export class AudioQueueProcessor {
  private readonly logger = new Logger(AudioQueueProcessor.name);

  constructor(
    private readonly audioService: AudioService,
    private readonly conversationService: ConversationService,
  ) {}

  /**
   * Processar transcrição de áudio em background
   *
   * Dados esperados:
   * {
   *   audioUrl: string;
   *   chatId: string;
   *   tenantId: string;
   *   language?: string; // Padrão: 'pt'
   * }
   */
  @Process({ name: 'transcribe', concurrency: 2 })
  async handleAudioTranscription(
    job: Job<{
      audioUrl: string;
      chatId: string;
      tenantId: string;
      language?: string;
    }>,
  ) {
    const { audioUrl, chatId, tenantId, language = 'pt' } = job.data;

    try {
      this.logger.log(
        `[Audio Job #${job.id}] Iniciando transcrição: ${audioUrl.substring(0, 50)}...`,
      );

      // Progress update
      await job.progress(10);

      // Transcrever áudio
      const transcript = await this.audioService.transcribeAudio({
        audioUrl,
        language,
      });

      await job.progress(50);

      // Salvar transcrição no histórico
      await this.conversationService.saveMessage(
        chatId,
        {
          text: transcript,
          type: 'user_message',
          source: 'audio',
        },
        tenantId,
      );

      await job.progress(100);

      this.logger.log(
        `[Audio Job #${job.id}] ✅ Transcrição completa: "${transcript.substring(0, 50)}..."`,
      );

      return {
        success: true,
        transcript,
        chatId,
        processingTime: job.progress() / 100 * 120, // Estimado
      };
    } catch (error) {
      this.logger.error(
        `[Audio Job #${job.id}] ❌ Erro na transcrição: ${error.message}`,
      );

      // Re-throw para Bull fazer retry
      throw new Error(
        `Audio transcription failed: ${error.message} (Attempt: ${job.attemptsMade}/${job.opts.attempts})`,
      );
    }
  }

  /**
   * Processar pipeline completo de conversa em background
   *
   * Dados esperados:
   * {
   *   transcript: string;
   *   chatId: string;
   *   tenantId: string;
   *   aiProvider?: string;
   * }
   */
  @Process({ name: 'process-conversation', concurrency: 3 })
  async handleConversationProcessing(
    job: Job<{
      transcript: string;
      chatId: string;
      tenantId: string;
      aiProvider?: string;
    }>,
  ) {
    const { transcript, chatId, tenantId, aiProvider = 'OLLAMA' } = job.data;

    try {
      this.logger.log(
        `[Conversation Job #${job.id}] Processando: "${transcript.substring(0, 40)}..."`,
      );

      await job.progress(20);

      // Processar conversa (intent + entities + IA response)
      const result = await this.conversationService.processConversation({
        transcript,
        chatId,
        tenantId,
        aiProvider,
      });

      await job.progress(100);

      this.logger.log(
        `[Conversation Job #${job.id}] ✅ Processamento completo`,
      );

      return {
        success: true,
        result,
        chatId,
      };
    } catch (error) {
      this.logger.error(
        `[Conversation Job #${job.id}] ❌ Erro no processamento: ${error.message}`,
      );

      throw new Error(
        `Conversation processing failed: ${error.message} (Attempt: ${job.attemptsMade}/${job.opts.attempts})`,
      );
    }
  }

  /**
   * Handler para falha de job
   */
  @Process({ name: 'failed' })
  async handleFailedJob(job: Job) {
    this.logger.error(`[Audio Job #${job.id}] ❌ FALHOU PERMANENTEMENTE`);
    this.logger.error(`Error: ${job.failedReason}`);
    this.logger.error(
      `Tentativas: ${job.attemptsMade}/${job.opts.attempts}`,
    );

    // Aqui você poderia:
    // 1. Notificar usuário que processamento falhou
    // 2. Reenviar para fila com diferentes parâmetros
    // 3. Registrar em banco de dados para auditoria
  }

  /**
   * Handler para job completado
   */
  @Process({ name: 'completed' })
  async handleCompletedJob(job: Job) {
    this.logger.debug(
      `[Audio Job #${job.id}] ✅ Completado em ${Date.now() - job.timestamp}ms`,
    );
  }
}
