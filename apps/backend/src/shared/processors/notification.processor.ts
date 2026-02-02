import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { NotificationService } from '../modules/notification/notification.service';

/**
 * Notification Queue Processor
 *
 * Envia notificações via WhatsApp com retry automático:
 * ✅ Notificação de pagamento aprovado
 * ✅ Notificação de status do pedido
 * ✅ Retry automático em caso de falha
 * ✅ Exponential backoff (2s, 4s, 8s)
 * ✅ Timeout de 30 segundos por tentativa
 *
 * Job lifetime:
 * - Remove após 1 hora se sucesso
 * - Keep por 24 horas se erro (para debug)
 * - Tenta 3 vezes com backoff
 */
@Processor('notification')
@Injectable()
export class NotificationQueueProcessor {
  private readonly logger = new Logger(NotificationQueueProcessor.name);

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Enviar notificação de pagamento ao vendedor
   *
   * Job data:
   * {
   *   orderId: string;
   *   tenantId: string;
   *   clientPhoneNumber: string;
   *   paymentProofUrl: string;
   *   orderTotal: number;
   *   orderItems: Array;
   *   delay?: number; // Segundos antes de processar
   * }
   *
   * Retry automático:
   * - 1ª tentativa: imediato
   * - 2ª tentativa: +2 segundos
   * - 3ª tentativa: +4 segundos
   */
  @Process({ name: 'send-vendor-payment-notification', concurrency: 5 })
  async handleVendorNotification(
    job: Job<{
      orderId: string;
      tenantId: string;
      clientPhoneNumber: string;
      paymentProofUrl: string;
      orderTotal: number;
      orderItems: Array;
    }>,
  ) {
    const {
      orderId,
      tenantId,
      clientPhoneNumber,
      paymentProofUrl,
      orderTotal,
      orderItems,
    } = job.data;

    try {
      this.logger.log(
        `[Notification Job #${job.id}] Enviando para vendedor: Order=${orderId}`,
      );

      await job.progress(25);

      // Enviar notificação
      const result =
        await this.notificationService.notifyVendorPaymentApproved({
          orderId,
          tenantId,
          clientPhoneNumber,
          paymentProofUrl,
          paymentProofType: 'PIX_RECEIPT',
          orderTotal,
          orderItems,
        });

      await job.progress(100);

      this.logger.log(
        `[Notification Job #${job.id}] ✅ Notificação enviada: messageId=${result.messageId}`,
      );

      return {
        success: true,
        messageId: result.messageId,
        orderId,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.warn(
        `[Notification Job #${job.id}] ⚠️ Tentativa ${job.attemptsMade} falhou: ${error.message}`,
      );

      // Se for a última tentativa, logar erro crítico
      if (job.attemptsMade >= job.opts.attempts) {
        this.logger.error(
          `[Notification Job #${job.id}] ❌ FALHOU APÓS 3 TENTATIVAS: ${orderId}`,
        );

        // Notificar administrador ou registrar em banco
        // await this.alertAdministrator('Vendor notification failed', job.data);
      }

      // Re-throw para Bull fazer retry
      throw new Error(
        `Failed to send vendor notification: ${error.message} (Attempt: ${job.attemptsMade}/${job.opts.attempts})`,
      );
    }
  }

  /**
   * Enviar notificação de status do pedido ao cliente
   *
   * Job data:
   * {
   *   orderId: string;
   *   clientPhoneNumber: string;
   *   status: 'CONFIRMED' | 'REJECTED';
   *   reason?: string;
   * }
   */
  @Process({
    name: 'send-client-order-status-notification',
    concurrency: 5,
  })
  async handleClientStatusNotification(
    job: Job<{
      orderId: string;
      clientPhoneNumber: string;
      status: 'CONFIRMED' | 'REJECTED';
      reason?: string;
    }>,
  ) {
    const { orderId, clientPhoneNumber, status, reason } = job.data;

    try {
      this.logger.log(
        `[Notification Job #${job.id}] Notificando cliente: Order=${orderId}, Status=${status}`,
      );

      await job.progress(25);

      // Enviar notificação
      const result = await this.notificationService.notifyClientOrderStatus(
        orderId,
        clientPhoneNumber,
        status,
        reason,
      );

      await job.progress(100);

      this.logger.log(
        `[Notification Job #${job.id}] ✅ Status enviado ao cliente: ${status}`,
      );

      return {
        success: true,
        orderId,
        status,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.warn(
        `[Notification Job #${job.id}] ⚠️ Tentativa ${job.attemptsMade} falhou: ${error.message}`,
      );

      if (job.attemptsMade >= job.opts.attempts) {
        this.logger.error(
          `[Notification Job #${job.id}] ❌ Cliente não notificado: ${orderId}`,
        );
      }

      throw new Error(
        `Failed to send client notification: ${error.message} (Attempt: ${job.attemptsMade}/${job.opts.attempts})`,
      );
    }
  }

  /**
   * Reenviar mensagem falhada
   * Pode ser chamado manualmente para job que falhou
   */
  @Process({ name: 'retry-failed-notification', concurrency: 2 })
  async handleRetryFailedNotification(
    job: Job<{
      failedJobId: string;
      reason: string;
    }>,
  ) {
    const { failedJobId, reason } = job.data;

    this.logger.warn(
      `[Notification Job #${job.id}] Reenviando job falho: ${failedJobId}`,
    );
    this.logger.warn(`Motivo anterior: ${reason}`);

    // Aqui você reimplementaria a lógica de retry
    // Com possível delay mais longo ou diferentes estratégias
  }

  /**
   * Fallback para notificação crítica falhar
   * Enviar notificação alternativa (SMS, email, etc)
   */
  @Process({ name: 'critical-notification-failure', concurrency: 1 })
  async handleCriticalNotificationFailure(
    job: Job<{
      orderId: string;
      type: 'vendor' | 'client';
      error: string;
    }>,
  ) {
    const { orderId, type, error } = job.data;

    this.logger.error(
      `[CRITICAL] Notification failed for ${type}: ${orderId}`,
    );
    this.logger.error(`Error: ${error}`);

    // Aqui você poderia:
    // 1. Enviar SMS como fallback
    // 2. Registrar em banco com status CRITICAL
    // 3. Alertar administrador via email
    // 4. Gerar ticket de suporte
  }
}
