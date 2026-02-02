import { Controller, Post, Body, Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';

/**
 * Webhook Controller: Recebe respostas do vendedor (clicou em botão)
 * Integrado com Evolution API
 */
@Controller('webhook/vendor')
export class VendorWebhookController {
  private readonly logger = new Logger(VendorWebhookController.name);

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * POST /webhook/vendor/response
   * Webhook recebido quando vendedor clica [ACEITAR] ou [REJEITAR]
   *
   * Fluxo:
   * 1. Vendedor recebe mensagem com botões no WhatsApp
   * 2. Vendedor clica em [✅ ACEITAR] ou [❌ REJEITAR]
   * 3. WhatsApp envia webhook para Evolution API
   * 4. Evolution API encaminha para este endpoint
   * 5. Processamos a resposta e notificamos cliente
   *
   * Body (exemplo):
   * {
   *   "event": "messages.upsert",
   *   "data": {
   *     "instanceId": "instance-key-123",
   *     "messages": [
   *       {
   *         "key": {
   *           "remoteJid": "5511999999999@s.whatsapp.net",
   *           "fromMe": false,
   *           "id": "ABCD1234..."
   *         },
   *         "message": {
   *           "buttonsResponseMessage": {
   *             "selectedButtonId": "accept_order-uuid-123"
   *           }
   *         },
   *         "messageTimestamp": 1675270800
   *       }
   *     ]
   *   }
   * }
   *
   * Processamento:
   * 1. Extrair orderId do selectedButtonId ("accept_order-uuid-123")
   * 2. Extrair resposta (accept = ACEITAR, reject = REJEITAR)
   * 3. Chamar NotificationService.processVendorResponse()
   * 4. Atualizar status do pedido (CONFIRMED ou REJECTED)
   * 5. Notificar cliente automaticamente
   *
   * Response (200 OK):
   * {
   *   "success": true,
   *   "orderId": "order-uuid-123",
   *   "orderStatus": "CONFIRMED",
   *   "message": "Resposta do vendedor processada",
   *   "timestamp": "2026-02-01T19:46:30Z"
   * }
   */
  @Post('response')
  async handleVendorResponse(@Body() payload: any): Promise<any> {
    try {
      this.logger.log('Webhook recebido do vendedor');

      // Extrair dados do webhook Evolution API
      const { data } = payload;
      if (!data || !data.messages || data.messages.length === 0) {
        return { success: false, message: 'Webhook inválido' };
      }

      const message = data.messages[0];
      const senderPhone =
        message.key?.remoteJid?.split('@')[0] || 'unknown';

      // Verificar se é uma resposta de botão
      const buttonResponse =
        message.message?.buttonsResponseMessage?.selectedButtonId;
      if (!buttonResponse) {
        return {
          success: false,
          message: 'Não é uma resposta de botão',
        };
      }

      // Extrair orderId e resposta do buttonId
      // Formato esperado: "accept_order-uuid-123" ou "reject_order-uuid-123"
      const parts = buttonResponse.split('_');
      const responseType = parts[0]; // "accept" ou "reject"
      const orderId = parts.slice(1).join('_'); // resto é o orderId

      if (!orderId) {
        return {
          success: false,
          message: 'OrderId não encontrado',
        };
      }

      // Processar resposta do vendedor
      const response = await this.notificationService.processVendorResponse({
        orderId,
        vendorPhoneNumber: senderPhone,
        response: responseType === 'accept' ? 'ACCEPT' : 'REJECT',
        responseTime: new Date().toISOString(),
      });

      this.logger.log(
        `✓ Resposta do vendedor processada: ${orderId} = ${responseType}`,
      );

      return response;
    } catch (error) {
      this.logger.error('Erro ao processar webhook:', error);
      return {
        success: false,
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * POST /webhook/vendor/status
   * Webhook para status de mensagem (entregue, lido, falhou)
   *
   * Body:
   * {
   *   "event": "message.status.update",
   *   "data": {
   *     "messageId": "wamid.ABC123",
   *     "status": "delivered" | "read" | "failed",
   *     "timestamp": 1675270800
   *   }
   * }
   */
  @Post('status')
  async handleMessageStatus(@Body() payload: any): Promise<any> {
    try {
      const { data } = payload;
      const { messageId, status } = data;

      this.logger.log(
        `Status de mensagem atualizado: ${messageId} = ${status}`,
      );

      // Aqui você pode atualizar o status no banco de dados
      // await this.notificationService.updateMessageStatus(messageId, status);

      return {
        success: true,
        message: 'Status atualizado',
      };
    } catch (error) {
      this.logger.error('Erro ao processar status:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
