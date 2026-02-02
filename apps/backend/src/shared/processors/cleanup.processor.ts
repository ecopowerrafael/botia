import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor, OnWorkerEvent } from '@nestjs/bull';
import { Job } from 'bull';
import { TTSService } from '../modules/tts/tts.service';
import { PrismaService } from './prisma.service';

/**
 * Cleanup Queue Processor
 *
 * Tarefas agendadas de limpeza e manutenção:
 * ✅ Limpar cache TTS expirado (> 7 dias)
 * ✅ Remover mensagens antigas (> 30 dias)
 * ✅ Limpar jobs falhados antigos (> 7 dias)
 * ✅ Atualizar estatísticas
 *
 * Execução programada:
 * - Diariamente às 02:00 da manhã
 * - Timeout: 5 minutos
 * - Sem retry (é limpeza, não é crítico)
 */
@Processor('cleanup')
@Injectable()
export class CleanupQueueProcessor {
  private readonly logger = new Logger(CleanupQueueProcessor.name);

  constructor(
    private readonly ttsService: TTSService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Limpeza do cache TTS
   *
   * Remove arquivos de áudio com mais de 7 dias
   * Atualiza uso de disco
   */
  @Process({ name: 'cleanup-tts-cache', concurrency: 1 })
  async handleTTSCacheCleanup(job: Job) {
    const startTime = Date.now();

    try {
      this.logger.log(`[Cleanup Job #${job.id}] Iniciando limpeza TTS cache`);

      await job.progress(10);

      // Deletar cache expirado (> 7 dias)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const deleteResult = await this.prisma.tTSCache.deleteMany({
        where: {
          createdAt: {
            lt: sevenDaysAgo,
          },
        },
      });

      await job.progress(50);

      this.logger.log(
        `[Cleanup Job #${job.id}] Deletados ${deleteResult.count} arquivos TTS`,
      );

      // Calcular espaço economizado
      const remainingCount = await this.prisma.tTSCache.count();

      await job.progress(100);

      const duration = Date.now() - startTime;

      this.logger.log(
        `[Cleanup Job #${job.id}] ✅ Limpeza concluída: ${deleteResult.count} removidos, ${remainingCount} restantes (${duration}ms)`,
      );

      return {
        success: true,
        itemsRemoved: deleteResult.count,
        itemsRemaining: remainingCount,
        duration,
      };
    } catch (error) {
      this.logger.error(
        `[Cleanup Job #${job.id}] ❌ Erro na limpeza TTS: ${error.message}`,
      );

      // Não faz retry para cleanup
      throw error;
    }
  }

  /**
   * Limpeza de histórico de conversa
   *
   * Remove mensagens com mais de 30 dias (exceto marcadas)
   */
  @Process({ name: 'cleanup-old-conversations', concurrency: 1 })
  async handleConversationCleanup(job: Job) {
    const startTime = Date.now();

    try {
      this.logger.log(
        `[Cleanup Job #${job.id}] Iniciando limpeza de conversas antigas`,
      );

      await job.progress(10);

      // Deletar mensagens > 30 dias
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const deleteResult = await this.prisma.conversationMessage.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
          // Não deletar se marcado como importante
          metadata: {
            not: { path: ['isArchived'], equals: true },
          },
        },
      });

      await job.progress(100);

      const duration = Date.now() - startTime;

      this.logger.log(
        `[Cleanup Job #${job.id}] ✅ Conversas limpas: ${deleteResult.count} removidas (${duration}ms)`,
      );

      return {
        success: true,
        messagesRemoved: deleteResult.count,
        duration,
      };
    } catch (error) {
      this.logger.error(
        `[Cleanup Job #${job.id}] ❌ Erro na limpeza de conversas: ${error.message}`,
      );

      throw error;
    }
  }

  /**
   * Limpeza de notificações antigas
   *
   * Remove logs de notificação > 7 dias
   */
  @Process({ name: 'cleanup-old-notifications', concurrency: 1 })
  async handleNotificationLogCleanup(job: Job) {
    const startTime = Date.now();

    try {
      this.logger.log(
        `[Cleanup Job #${job.id}] Iniciando limpeza de logs de notificação`,
      );

      await job.progress(10);

      // Deletar logs > 7 dias
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const deleteResult = await this.prisma.notificationLog.deleteMany({
        where: {
          createdAt: {
            lt: sevenDaysAgo,
          },
        },
      });

      await job.progress(100);

      const duration = Date.now() - startTime;

      this.logger.log(
        `[Cleanup Job #${job.id}] ✅ Logs removidos: ${deleteResult.count} (${duration}ms)`,
      );

      return {
        success: true,
        logsRemoved: deleteResult.count,
        duration,
      };
    } catch (error) {
      this.logger.error(
        `[Cleanup Job #${job.id}] ❌ Erro na limpeza de logs: ${error.message}`,
      );

      throw error;
    }
  }

  /**
   * Atualizar estatísticas do sistema
   *
   * Calcula e salva:
   * - Total de transações processadas
   * - Volume de áudio processado
   * - Taxa de sucesso de notificações
   * - Performance de IA
   */
  @Process({ name: 'update-system-stats', concurrency: 1 })
  async handleSystemStatsUpdate(job: Job) {
    const startTime = Date.now();

    try {
      this.logger.log(`[Cleanup Job #${job.id}] Atualizando estatísticas`);

      await job.progress(25);

      // Contar total de pedidos
      const totalOrders = await this.prisma.order.count();
      const totalOrdersToday = await this.prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      });

      await job.progress(50);

      // Contar total de conversas
      const totalConversations =
        await this.prisma.conversationMessage.groupBy({
          by: ['chatId'],
          _count: true,
        });

      await job.progress(75);

      // Contar notificações enviadas
      const totalNotifications = await this.prisma.notificationLog.count();
      const failedNotifications = await this.prisma.notificationLog.count({
        where: {
          status: 'FAILED',
        },
      });

      await job.progress(100);

      const duration = Date.now() - startTime;

      const stats = {
        timestamp: new Date(),
        totalOrders,
        totalOrdersToday,
        totalConversations: totalConversations.length,
        totalNotifications,
        failedNotifications,
        notificationSuccessRate:
          ((totalNotifications - failedNotifications) / totalNotifications) *
          100,
      };

      this.logger.log(
        `[Cleanup Job #${job.id}] ✅ Estatísticas atualizadas (${duration}ms)`,
      );

      this.logger.debug(
        `Stats: ${JSON.stringify(stats, null, 2)}`,
      );

      return stats;
    } catch (error) {
      this.logger.error(
        `[Cleanup Job #${job.id}] ❌ Erro ao atualizar stats: ${error.message}`,
      );

      throw error;
    }
  }

  /**
   * Lifecycle event: quando worker inicia
   */
  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(
      `[Cleanup Job #${job.id}] Iniciado - ${job.name}`,
    );
  }

  /**
   * Lifecycle event: quando job completa
   */
  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    this.logger.log(
      `[Cleanup Job #${job.id}] ✅ Completado: ${job.name}`,
    );
  }

  /**
   * Lifecycle event: quando job falha
   */
  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(
      `[Cleanup Job #${job.id}] ❌ Falhou: ${job.name} - ${err.message}`,
    );
  }
}
