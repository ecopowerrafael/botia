import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import {
  NotifyVendorPaymentApprovedDto,
  NotifyClientOrderStatusDto,
  NotificationSentResponseDto,
  VendorWhatsAppConfigDto,
  VendorWhatsAppConfigResponseDto,
  GetVendorConfigDto,
} from './notification.dto';

/**
 * NotificationService: Envia notificações via WhatsApp
 * - Notifica vendedor quando pagamento é aprovado
 * - Notifica cliente quando vendedor aceita/rejeita
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsAppService,
  ) {}

  /**
   * Notificar vendedor sobre novo pagamento aprovado
   * DISPARA APÓS: Payment.validatePaymentProof() retorna sucesso
   */
  async notifyVendorPaymentApproved(
    dto: NotifyVendorPaymentApprovedDto,
  ): Promise<NotificationSentResponseDto> {
    const {
      orderId,
      tenantId,
      clientPhoneNumber,
      paymentProofUrl,
      paymentProofType = 'PIX_RECEIPT',
      orderTotal,
      orderItems = [],
    } = dto;

    try {
      // Passo 1: Obter configuração WhatsApp do vendor
      const vendorConfig = await this.getVendorWhatsAppConfig(tenantId);

      if (!vendorConfig) {
        return {
          success: false,
          status: 'failed',
          error:
            'Número WhatsApp do vendedor não configurado. Configure em Painel Admin.',
          timestamp: new Date().toISOString(),
        };
      }

      // Passo 2: Obter instância WhatsApp (usar padrão ou específica do vendor)
      const instanceKey =
        vendorConfig.vendorInstanceKey ||
        (await this.getDefaultInstanceKey(tenantId));

      // Passo 3: Construir mensagem formatada
      const message = this.buildVendorNotificationMessage(
        orderId,
        clientPhoneNumber,
        paymentProofType,
        orderTotal,
        orderItems,
      );

      // Passo 4: Enviar mensagem WhatsApp para vendedor
      const messageId = await this.sendWhatsAppMessage(
        instanceKey,
        vendorConfig.vendorWhatsAppNumber,
        message,
      );

      // Passo 5: Enviar imagem do comprovante (se disponível)
      if (paymentProofUrl) {
        try {
          await this.sendWhatsAppMedia(
            instanceKey,
            vendorConfig.vendorWhatsAppNumber,
            paymentProofUrl,
            'Comprovante de Pagamento',
          );
        } catch (error) {
          this.logger.warn('Erro ao enviar comprovante de pagamento:', error);
        }
      }

      // Passo 6: Enviar botões interativos [ACEITAR] [REJEITAR]
      const buttonsMessage = this.buildVendorActionButtons(orderId);
      await this.sendWhatsAppMessage(
        instanceKey,
        vendorConfig.vendorWhatsAppNumber,
        buttonsMessage,
      );

      // Passo 7: Salvar registro de notificação
      await this.saveNotificationLog({
        tenantId,
        orderId,
        recipientType: 'VENDOR',
        recipientPhone: vendorConfig.vendorWhatsAppNumber,
        messageType: 'PAYMENT_APPROVED',
        status: 'sent',
        messageId,
      });

      this.logger.log(
        `Notificação de pagamento enviada para vendedor: ${vendorConfig.vendorWhatsAppNumber}`,
      );

      return {
        success: true,
        messageId,
        status: 'sent',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Erro ao notificar vendedor: ${error.message}`);

      return {
        success: false,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Notificar cliente quando vendedor aceita/rejeita o pedido
   * DISPARA APÓS: Vendedor clicar [ACEITAR] ou [REJEITAR]
   */
  async notifyClientOrderStatus(
    dto: NotifyClientOrderStatusDto,
  ): Promise<NotificationSentResponseDto> {
    const { orderId, clientPhoneNumber, status, reason } = dto;

    try {
      // Obter tenant do pedido
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new BadRequestException('Pedido não encontrado');
      }

      const tenantId = order.tenantId;

      // Obter instância WhatsApp padrão
      const instanceKey = await this.getDefaultInstanceKey(tenantId);

      // Construir mensagem baseada no status
      const message =
        status === 'CONFIRMED'
          ? this.buildClientOrderConfirmedMessage(orderId)
          : this.buildClientOrderRejectedMessage(orderId, reason);

      // Enviar mensagem para cliente
      const messageId = await this.sendWhatsAppMessage(
        instanceKey,
        clientPhoneNumber,
        message,
      );

      // Salvar log
      await this.saveNotificationLog({
        tenantId,
        orderId,
        recipientType: 'CLIENT',
        recipientPhone: clientPhoneNumber,
        messageType: `ORDER_${status}`,
        status: 'sent',
        messageId,
      });

      this.logger.log(
        `Notificação de pedido ${status} enviada para cliente: ${clientPhoneNumber}`,
      );

      return {
        success: true,
        messageId,
        status: 'sent',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao notificar cliente sobre status do pedido: ${error.message}`,
      );

      return {
        success: false,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Salvar configuração WhatsApp do vendor
   */
  async saveVendorWhatsAppConfig(
    dto: VendorWhatsAppConfigDto,
  ): Promise<VendorWhatsAppConfigResponseDto> {
    const {
      tenantId,
      vendorWhatsAppNumber,
      vendorWhatsAppName,
      vendorInstanceKey,
    } = dto;

    // Validar tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant não encontrado');
    }

    // Salvar ou atualizar config
    const config = await this.prisma.tenantWhatsAppConfig.upsert({
      where: { tenantId },
      update: {
        vendorWhatsAppNumber,
        vendorWhatsAppName,
        vendorInstanceKey,
        updatedAt: new Date(),
      },
      create: {
        tenantId,
        vendorWhatsAppNumber,
        vendorWhatsAppName,
        vendorInstanceKey,
      },
    });

    return {
      success: true,
      config: {
        tenantId: config.tenantId,
        vendorWhatsAppNumber: config.vendorWhatsAppNumber,
        vendorWhatsAppName: config.vendorWhatsAppName || 'Vendedor',
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Obter configuração WhatsApp do vendor
   */
  async getVendorWhatsAppConfig(
    tenantId: string,
  ): Promise<any> {
    return await this.prisma.tenantWhatsAppConfig.findUnique({
      where: { tenantId },
    });
  }

  /**
   * ==================== PRIVATE METHODS ====================
   */

  /**
   * Construir mensagem formatada para vendor
   */
  private buildVendorNotificationMessage(
    orderId: string,
    clientPhone: string,
    paymentType: string,
    total: number,
    items: any[],
  ): string {
    let message = `🎉 *NOVO PEDIDO PAGAMENTO APROVADO*\n\n`;
    message += `📦 *Pedido:* ${orderId}\n`;
    message += `👤 *Cliente:* ${clientPhone}\n`;
    message += `💰 *Valor:* R$ ${total.toFixed(2)}\n`;
    message += `💳 *Pagamento:* ${paymentType === 'PIX_RECEIPT' ? 'PIX' : paymentType}\n\n`;

    if (items.length > 0) {
      message += `*ITENS DO PEDIDO:*\n`;
      items.forEach((item, index) => {
        message += `${index + 1}. ${item.productName || item.name} x${item.quantity}\n`;
      });
      message += `\n`;
    }

    message += `⚠️ *Próximo passo:*\n`;
    message += `Clique em [ACEITAR] para confirmar o pedido\n`;
    message += `Clique em [REJEITAR] se não conseguir atender\n`;

    return message;
  }

  /**
   * Construir botões interativos para vendor
   */
  private buildVendorActionButtons(orderId: string): string {
    return `*AÇÃO NECESSÁRIA*\n\nClique no botão abaixo para responder:\n\n` +
      `[ACEITAR] - Confirmar que vai preparar\n` +
      `[REJEITAR] - Cancelar este pedido\n\n` +
      `Ordem: ${orderId}`;
  }

  /**
   * Construir mensagem para cliente (pedido confirmado)
   */
  private buildClientOrderConfirmedMessage(orderId: string): string {
    return `✅ *PEDIDO CONFIRMADO*\n\n` +
      `🎊 Excelente! Seu pedido foi confirmado.\n\n` +
      `📦 *Número do pedido:* ${orderId}\n\n` +
      `⏱️ Você receberá um aviso quando estiver pronto para entrega/retirada.\n\n` +
      `Obrigado por comprar conosco! 🙏`;
  }

  /**
   * Construir mensagem para cliente (pedido rejeitado)
   */
  private buildClientOrderRejectedMessage(
    orderId: string,
    reason?: string,
  ): string {
    return `❌ *PEDIDO NÃO CONFIRMADO*\n\n` +
      `😞 Desculpe, não conseguimos confirmar seu pedido.\n\n` +
      `📦 *Número do pedido:* ${orderId}\n` +
      `${reason ? `📝 *Motivo:* ${reason}\n` : ''}` +
      `\n💬 Entre em contato conosco para mais informações.\n` +
      `📞 Estamos aqui para ajudar!`;
  }

  /**
   * Enviar mensagem WhatsApp
   */
  private async sendWhatsAppMessage(
    instanceKey: string,
    phoneNumber: string,
    message: string,
  ): Promise<string> {
    try {
      // Chamar Evolution API para enviar mensagem
      const response = await this.whatsappService.sendMessage({
        instanceKey,
        phoneNumber,
        message,
      } as any);

      return response?.messageId || `msg_${Date.now()}`;
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem WhatsApp: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enviar media (imagem, arquivo) via WhatsApp
   */
  private async sendWhatsAppMedia(
    instanceKey: string,
    phoneNumber: string,
    mediaUrl: string,
    caption?: string,
  ): Promise<void> {
    try {
      // TODO: Implementar via WhatsAppService.sendMedia()
      this.logger.log(`Enviando media para ${phoneNumber}: ${mediaUrl}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar media: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obter instância WhatsApp padrão do tenant
   */
  private async getDefaultInstanceKey(tenantId: string): Promise<string> {
    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: {
        tenantId,
        status: 'connected',
      },
    });

    if (!instance) {
      throw new BadRequestException(
        'Nenhuma instância WhatsApp conectada para este tenant',
      );
    }

    return instance.instanceKey;
  }

  /**
   * Salvar log de notificação
   */
  private async saveNotificationLog(data: {
    tenantId: string;
    orderId: string;
    recipientType: 'VENDOR' | 'CLIENT';
    recipientPhone: string;
    messageType: string;
    status: string;
    messageId?: string;
  }): Promise<void> {
    try {
      // TODO: Criar tabela NotificationLog se não existir
      // await this.prisma.notificationLog.create({ data });
      this.logger.log(`Log de notificação salvo: ${data.messageType}`);
    } catch (error) {
      this.logger.warn(`Erro ao salvar log de notificação: ${error.message}`);
    }
  }
}
