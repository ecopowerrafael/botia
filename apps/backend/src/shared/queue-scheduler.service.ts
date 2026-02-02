import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

/**
 * Scheduler Service
 *
 * Agenda jobs para execução recorrente:
 * ✅ Limpeza de cache TTS - 02:00 da manhã
 * ✅ Limpeza de conversas - 03:00 da manhã
 * ✅ Limpeza de logs - 04:00 da manhã
 * ✅ Atualizar stats - 05:00 da manhã
 *
 * Cron format: 'minuto hora dia mês diaSemana'
 * Timezone: UTC (recomendado para servidores)
 */
@Injectable()
export class QueueSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(QueueSchedulerService.name);

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    @InjectQueue('cleanup') private cleanupQueue: Queue,
  ) {}

  /**
   * Registrar todas as tarefas agendadas quando módulo inicia
   */
  onModuleInit() {
    this.scheduleCleanupJobs();
    this.logger.log('✅ Scheduled jobs registrados com sucesso');
  }

  /**
   * Agendar todas as tarefas de cleanup
   */
  private scheduleCleanupJobs() {
    // Limpeza de TTS cache - 02:00 da manhã
    this.scheduleCronJob(
      'cleanup-tts-cache',
      '0 2 * * *', // 02:00 every day
      async () => {
        this.logger.log('⏰ Agendamento: Iniciando limpeza TTS cache');
        await this.cleanupQueue.add(
          'cleanup-tts-cache',
          {},
          {
            jobId: `tts-cleanup-${Date.now()}`,
            removeOnComplete: true,
          },
        );
      },
    );

    // Limpeza de conversas antigas - 03:00 da manhã
    this.scheduleCronJob(
      'cleanup-conversations',
      '0 3 * * *', // 03:00 every day
      async () => {
        this.logger.log(
          '⏰ Agendamento: Iniciando limpeza de conversas antigas',
        );
        await this.cleanupQueue.add(
          'cleanup-old-conversations',
          {},
          {
            jobId: `conv-cleanup-${Date.now()}`,
            removeOnComplete: true,
          },
        );
      },
    );

    // Limpeza de logs de notificação - 04:00 da manhã
    this.scheduleCronJob(
      'cleanup-notification-logs',
      '0 4 * * *', // 04:00 every day
      async () => {
        this.logger.log(
          '⏰ Agendamento: Iniciando limpeza de logs de notificação',
        );
        await this.cleanupQueue.add(
          'cleanup-old-notifications',
          {},
          {
            jobId: `notif-cleanup-${Date.now()}`,
            removeOnComplete: true,
          },
        );
      },
    );

    // Atualizar estatísticas - 05:00 da manhã
    this.scheduleCronJob(
      'update-system-stats',
      '0 5 * * *', // 05:00 every day
      async () => {
        this.logger.log('⏰ Agendamento: Atualizando estatísticas do sistema');
        await this.cleanupQueue.add(
          'update-system-stats',
          {},
          {
            jobId: `stats-update-${Date.now()}`,
            removeOnComplete: true,
          },
        );
      },
    );

    // Verificação de saúde do sistema - a cada 30 minutos
    this.scheduleCronJob(
      'health-check',
      '*/30 * * * *', // Every 30 minutes
      async () => {
        // Aqui você poderia verificar:
        // - Conexão com Redis
        // - Conexão com PostgreSQL
        // - Saúde do Ollama
        // - Filas pendentes
      },
    );
  }

  /**
   * Registrar um cron job
   */
  private scheduleCronJob(
    name: string,
    cronExpression: string,
    callback: () => Promise<void>,
  ) {
    const job = new CronJob(cronExpression, callback, null, true, 'UTC');

    this.schedulerRegistry.addCronJob(name, job);

    this.logger.log(
      `✅ Job agendado: ${name} (cron: "${cronExpression}")`,
    );
  }

  /**
   * Obter lista de jobs agendados
   */
  getScheduledJobs() {
    const jobs = this.schedulerRegistry.getCronJobs();
    const jobNames = Array.from(jobs.keys());

    return {
      total: jobNames.length,
      jobs: jobNames.map((name) => {
        const job = jobs.get(name);
        return {
          name,
          running: job.running,
          nextDate: job.nextDate().toISOString(),
        };
      }),
    };
  }

  /**
   * Executar job manualmente (para testes)
   */
  async triggerCleanupManually(jobName: string) {
    this.logger.log(`🔄 Executando manualmente: ${jobName}`);

    try {
      await this.cleanupQueue.add(jobName, {}, {
        jobId: `manual-${jobName}-${Date.now()}`,
        removeOnComplete: true,
      });

      return {
        success: true,
        message: `Job '${jobName}' adicionado à fila`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
