import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Logger,
  HttpCode,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueSchedulerService } from './queue-scheduler.service';

/**
 * Queue Monitoring Controller
 *
 * Endpoints para monitorar e gerenciar filas:
 * ✅ Ver status das filas
 * ✅ Ver status de um job específico
 * ✅ Dispara tarefas manualmente
 * ✅ Ver jobs agendados
 *
 * Nota: Estes endpoints são tipicamente restritos a admin
 */
@Controller('queue')
export class QueueMonitoringController {
  private readonly logger = new Logger(QueueMonitoringController.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly schedulerService: QueueSchedulerService,
  ) {}

  /**
   * GET /queue/status
   *
   * Obter status de todas as filas
   *
   * Response:
   * {
   *   audio: { waiting: 2, active: 1, completed: 100, failed: 0 },
   *   notification: { ... },
   *   cleanup: { ... },
   *   sync: { ... }
   * }
   */
  @Get('status')
  async getQueuesStatus() {
    this.logger.log('📊 Requerimento: status das filas');

    const stats = await this.queueService.getQueuesStats();

    return {
      timestamp: new Date(),
      queues: stats,
      healthStatus: this.calculateHealthStatus(stats),
    };
  }

  /**
   * GET /queue/job/:queueName/:jobId
   *
   * Obter status de um job específico
   *
   * Example: GET /queue/job/audio/123
   */
  @Get('job/:queueName/:jobId')
  async getJobStatus(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ) {
    this.logger.log(
      `📋 Requerimento: status do job #${jobId} na fila '${queueName}'`,
    );

    const status = await this.queueService.getJobStatus(
      queueName,
      parseInt(jobId, 10),
    );

    return status;
  }

  /**
   * POST /queue/cleanup/:taskName
   *
   * Disparar tarefa de limpeza manualmente
   *
   * Example: POST /queue/cleanup/cleanup-tts-cache
   */
  @Post('cleanup/:taskName')
  @HttpCode(202) // Accepted
  async triggerCleanupTask(
    @Param('taskName') taskName: string,
  ) {
    this.logger.log(
      `🧹 Disparando manualmente: ${taskName}`,
    );

    // Validar nome da tarefa
    const validTasks = [
      'cleanup-tts-cache',
      'cleanup-old-conversations',
      'cleanup-old-notifications',
      'update-system-stats',
    ];

    if (!validTasks.includes(taskName)) {
      return {
        success: false,
        error: `Tarefa inválida: ${taskName}`,
        validTasks,
      };
    }

    const result = await this.queueService.queueCleanupTask(
      taskName as any,
    );

    return {
      success: true,
      ...result,
    };
  }

  /**
   * GET /queue/scheduled-jobs
   *
   * Ver lista de jobs agendados
   */
  @Get('scheduled-jobs')
  getScheduledJobs() {
    this.logger.log('📅 Requerimento: lista de jobs agendados');

    const jobs = this.schedulerService.getScheduledJobs();

    return {
      timestamp: new Date(),
      ...jobs,
    };
  }

  /**
   * POST /queue/test
   *
   * Teste: enfileirar jobs de teste
   *
   * Body:
   * {
   *   queueType: 'audio' | 'notification' | 'cleanup'
   * }
   */
  @Post('test')
  @HttpCode(202)
  async testQueue(
    @Body() body: { queueType: string },
  ) {
    this.logger.log(`🧪 Teste de fila: ${body.queueType}`);

    switch (body.queueType) {
      case 'audio':
        return await this.queueService.queueAudioTranscription({
          audioUrl: 'https://example.com/test-audio.mp3',
          chatId: 'test-chat-123',
          tenantId: 'test-tenant',
          language: 'pt',
        });

      case 'notification':
        return await this.queueService.queueVendorNotification({
          orderId: 'test-order-123',
          tenantId: 'test-tenant',
          clientPhoneNumber: '5511988887777',
          paymentProofUrl:
            'https://example.com/test-proof.jpg',
          orderTotal: 100.00,
          orderItems: [
            {
              productName: 'Test Product',
              quantity: 1,
              price: 100.00,
            },
          ],
        });

      case 'cleanup':
        return await this.queueService.queueCleanupTask(
          'update-system-stats',
        );

      default:
        return {
          success: false,
          error: `Queue type desconhecido: ${body.queueType}`,
          validTypes: ['audio', 'notification', 'cleanup'],
        };
    }
  }

  /**
   * POST /queue/clear/:queueName
   *
   * Limpar fila (CUIDADO!)
   *
   * ⚠️ Apenas para desenvolvimento/testes
   */
  @Post('clear/:queueName')
  @HttpCode(200)
  async clearQueue(@Param('queueName') queueName: string) {
    this.logger.warn(
      `🗑️ LIMPANDO FILA: ${queueName}`,
    );

    if (
      !['audio', 'notification', 'cleanup'].includes(
        queueName,
      )
    ) {
      return {
        success: false,
        error: `Queue desconhecida: ${queueName}`,
      };
    }

    const result = await this.queueService.clearQueue(queueName);

    return {
      success: true,
      ...result,
      warning: 'Jobs foram removidos da fila',
    };
  }

  /**
   * Helper: calcular saúde das filas
   */
  private calculateHealthStatus(stats: any) {
    const queues = [stats.audio, stats.notification, stats.cleanup];

    let healthScore = 100;

    // Reduzir score por jobs ativos > 5
    queues.forEach((q) => {
      if (q.active > 5) healthScore -= 10;
      if (q.failed > 0) healthScore -= 5;
      if (q.waiting > 20) healthScore -= 10;
    });

    return {
      score: Math.max(0, healthScore),
      status:
        healthScore >= 80
          ? '✅ HEALTHY'
          : healthScore >= 50
            ? '⚠️ WARNING'
            : '❌ CRITICAL',
    };
  }
}
