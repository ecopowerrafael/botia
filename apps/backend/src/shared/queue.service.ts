import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

/**
 * Queue Service
 *
 * Interface centralizada para enfileirar jobs:
 * ✅ Áudio: transcription, processamento de conversa
 * ✅ Notificação: envio com retry automático
 * ✅ Cleanup: limpeza programada
 * ✅ Sync: sincronização com WordPress
 *
 * Todos os jobs têm timeout de 30-120 segundos
 * e retry automático com backoff exponencial
 */
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('audio') private audioQueue: Queue,
    @InjectQueue('notification') private notificationQueue: Queue,
    @InjectQueue('cleanup') private cleanupQueue: Queue,
    @InjectQueue('sync') private syncQueue: Queue,
  ) {}

  /**
   * Enfileirar transcrição de áudio
   *
   * @returns jobId para rastreamento
   */
  async queueAudioTranscription(data: {
    audioUrl: string;
    chatId: string;
    tenantId: string;
    language?: string;
  }) {
    const job = await this.audioQueue.add(
      'transcribe',
      data,
      {
        priority: 10, // Prioridade: alta
        timeout: 120000, // 120 segundos (Ollama Whisper é lento)
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 3600, // Remove após 1 hora
        },
        removeOnFail: {
          age: 86400, // Keep por 24 horas para debug
        },
      },
    );

    this.logger.log(
      `📝 Audio job enfileirado: #${job.id} (${data.audioUrl.substring(0, 30)}...)`,
    );

    return {
      jobId: job.id,
      message: 'Áudio enfileirado para transcrição',
    };
  }

  /**
   * Enfileirar processamento completo de conversa
   */
  async queueConversationProcessing(data: {
    transcript: string;
    chatId: string;
    tenantId: string;
    aiProvider?: string;
  }) {
    const job = await this.audioQueue.add(
      'process-conversation',
      data,
      {
        priority: 8,
        timeout: 90000, // 90 segundos
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: true,
      },
    );

    this.logger.log(
      `🤖 Conversation job enfileirado: #${job.id}`,
    );

    return {
      jobId: job.id,
      message: 'Conversa enfileirada para processamento',
    };
  }

  /**
   * Enfileirar notificação de pagamento ao vendedor
   *
   * Priority: ALTA (negócio crítico)
   * Retry: 3 tentativas
   */
  async queueVendorNotification(data: {
    orderId: string;
    tenantId: string;
    clientPhoneNumber: string;
    paymentProofUrl: string;
    orderTotal: number;
    orderItems: Array;
  }) {
    const job = await this.notificationQueue.add(
      'send-vendor-payment-notification',
      data,
      {
        priority: 20, // Máxima prioridade
        timeout: 30000, // 30 segundos
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 3600,
        },
        removeOnFail: {
          age: 604800, // 7 dias para investigação
        },
      },
    );

    this.logger.log(
      `💬 Vendor notification job enfileirado: #${job.id} (Order: ${data.orderId})`,
    );

    return {
      jobId: job.id,
      message: 'Notificação ao vendedor enfileirada',
    };
  }

  /**
   * Enfileirar notificação de status ao cliente
   *
   * Priority: ALTA
   * Retry: 3 tentativas
   */
  async queueClientStatusNotification(data: {
    orderId: string;
    clientPhoneNumber: string;
    status: 'CONFIRMED' | 'REJECTED';
    reason?: string;
  }) {
    const job = await this.notificationQueue.add(
      'send-client-order-status-notification',
      data,
      {
        priority: 15,
        timeout: 30000,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
      },
    );

    this.logger.log(
      `💬 Client notification job enfileirado: #${job.id} (Order: ${data.orderId}, Status: ${data.status})`,
    );

    return {
      jobId: job.id,
      message: 'Notificação ao cliente enfileirada',
    };
  }

  /**
   * Enfileirar tarefa de limpeza (baixa prioridade)
   */
  async queueCleanupTask(
    taskName:
      | 'cleanup-tts-cache'
      | 'cleanup-old-conversations'
      | 'cleanup-old-notifications'
      | 'update-system-stats',
  ) {
    const job = await this.cleanupQueue.add(
      taskName,
      {},
      {
        priority: 1, // Baixa prioridade
        timeout: 300000, // 5 minutos
        removeOnComplete: true,
      },
    );

    this.logger.log(
      `🧹 Cleanup job enfileirado: #${job.id} (${taskName})`,
    );

    return {
      jobId: job.id,
      message: `Tarefa de limpeza '${taskName}' enfileirada`,
    };
  }

  /**
   * Obter status de um job
   */
  async getJobStatus(queueName: string, jobId: number) {
    let queue: Queue;

    switch (queueName) {
      case 'audio':
        queue = this.audioQueue;
        break;
      case 'notification':
        queue = this.notificationQueue;
        break;
      case 'cleanup':
        queue = this.cleanupQueue;
        break;
      case 'sync':
        queue = this.syncQueue;
        break;
      default:
        throw new Error(`Queue desconhecida: ${queueName}`);
    }

    const job = await queue.getJob(jobId);

    if (!job) {
      return {
        found: false,
        message: `Job #${jobId} não encontrado`,
      };
    }

    const state = await job.getState();
    const progress = job.progress();
    const data = job.data;

    return {
      found: true,
      jobId: job.id,
      state,
      progress,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      data,
      timestamp: new Date(),
    };
  }

  /**
   * Obter estatísticas das filas
   */
  async getQueuesStats() {
    return {
      audio: await this.getQueueStats(this.audioQueue),
      notification: await this.getQueueStats(this.notificationQueue),
      cleanup: await this.getQueueStats(this.cleanupQueue),
      sync: await this.getQueueStats(this.syncQueue),
    };
  }

  /**
   * Helper para obter stats de uma fila
   */
  private async getQueueStats(queue: Queue) {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      name: queue.name,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Limpar fila (cuidado!)
   */
  async clearQueue(queueName: string) {
    let queue: Queue;

    switch (queueName) {
      case 'audio':
        queue = this.audioQueue;
        break;
      case 'notification':
        queue = this.notificationQueue;
        break;
      case 'cleanup':
        queue = this.cleanupQueue;
        break;
      default:
        throw new Error(`Queue desconhecida: ${queueName}`);
    }

    const count = await queue.clean(0, 'failed');

    this.logger.warn(`🗑️ Fila '${queueName}' limpa: ${count} jobs removidos`);

    return {
      queueName,
      jobsRemoved: count,
    };
  }
}
