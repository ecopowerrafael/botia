import { Module } from '@nestjs/common';
import { BullModule as NestBullMQModule } from '@nestjs/bullmq';
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
    NestBullMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Redis configuration
        const redisHost = configService.get('REDIS_HOST', 'localhost');
        const redisPort = configService.get('REDIS_PORT', 6379);
        const redisPassword = configService.get('REDIS_PASSWORD');
        const redisDb = configService.get('REDIS_DB', 0);

        return {
          connection: {
            host: redisHost,
            port: parseInt(String(redisPort), 10),
            password: redisPassword || undefined,
            db: parseInt(String(redisDb), 10),
          },
        };
      },
    }),

    // Audio processing queue
    NestBullMQModule.registerQueue({
      name: 'audio',
    }),

    // Notification queue
    NestBullMQModule.registerQueue({
      name: 'notification',
    }),

    // Cleanup queue
    NestBullMQModule.registerQueue({
      name: 'cleanup',
    }),

    // WordPress sync queue
    NestBullMQModule.registerQueue({
      name: 'sync',
    }),
  ],
  exports: [NestBullMQModule],
})
export class BullQueueModule {}
