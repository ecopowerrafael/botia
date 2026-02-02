import { Module } from '@nestjs/common';
import { BullModule as NestBullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * BullModule - Configuração centralizada de filas
 *
 * Este módulo configura o Bull (queue library) para processamento
 * assíncrono de tarefas em background:
 *
 * ✅ Processamento de áudio (transcription)
 * ✅ Envio de notificações com retry automático
 * ✅ Limpeza de cache programada
 * ✅ Sincronização com WordPress
 *
 * Filas registradas:
 * - audio: Processamento de áudio (Ollama Whisper)
 * - notification: Envio de mensagens WhatsApp
 * - cleanup: Limpeza de cache expirado
 * - sync: Sincronização com WordPress
 */
@Module({
  imports: [
    ConfigModule,
    NestBullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Redis configuration
        const redisHost = configService.get('REDIS_HOST', 'localhost');
        const redisPort = configService.get('REDIS_PORT', 6379);
        const redisPassword = configService.get('REDIS_PASSWORD');
        const redisDb = configService.get('REDIS_DB', 0);

        return {
          redis: {
            host: redisHost,
            port: parseInt(String(redisPort), 10),
            password: redisPassword || undefined,
            db: parseInt(String(redisDb), 10),
          },
          // Queue settings
          settings: {
            // Default job options
            defaultJobOptions: {
              // Attempts antes de falhar
              attempts: 3,
              // Delay entre tentativas (em ms)
              backoff: {
                type: 'exponential',
                delay: 2000, // 2s inicial
              },
              // Remover job após completar (em ms)
              removeOnComplete: {
                age: 3600, // 1 hora
              },
              // Remover job após falhar (em ms)
              removeOnFail: {
                age: 86400, // 24 horas (keep for debugging)
              },
            },
            // Workers
            maxStalledCount: 2, // Max stalled retries
            lockDuration: 30000, // Lock duration em ms
            lockRenewTime: 15000, // Lock renew interval
          },
        };
      },
    }),

    // Audio processing queue
    NestBullModule.registerQueue({
      name: 'audio',
    }),

    // Notification queue
    NestBullModule.registerQueue({
      name: 'notification',
    }),

    // Cleanup queue
    NestBullModule.registerQueue({
      name: 'cleanup',
    }),

    // WordPress sync queue
    NestBullModule.registerQueue({
      name: 'sync',
    }),
  ],
  exports: [NestBullModule],
})
export class BullQueueModule {}
