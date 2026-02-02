import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { NotificationService } from './notification.service';
import {
  NotifyVendorPaymentApprovedDto,
  NotifyClientOrderStatusDto,
  NotificationSentResponseDto,
  VendorWhatsAppConfigDto,
  VendorWhatsAppConfigResponseDto,
  GetVendorConfigDto,
} from './notification.dto';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * POST /notification/config/vendor
   * ADMIN PAINEL: Configurar número WhatsApp do vendedor
   *
   * Body:
   * {
   *   "tenantId": "tenant-789",
   *   "vendorWhatsAppNumber": "5511999999999",
   *   "vendorWhatsAppName": "João - Vendedor"
   * }
   *
   * Response (201 CREATED):
   * {
   *   "success": true,
   *   "config": {
   *     "tenantId": "tenant-789",
   *     "vendorWhatsAppNumber": "5511999999999",
   *     "vendorWhatsAppName": "João - Vendedor",
   *     "createdAt": "2026-02-01T19:00:00Z",
   *     "updatedAt": "2026-02-01T19:00:00Z"
   *   }
   * }
   */
  @Post('config/vendor')
  async configureVendorWhatsApp(
    @Body() dto: VendorWhatsAppConfigDto,
  ): Promise<VendorWhatsAppConfigResponseDto> {
    return await this.notificationService.configureVendorWhatsApp(dto);
  }

  /**
   * GET /notification/config/:tenantId
   * Obter configuração de WhatsApp do vendedor
   *
   * Response (200 OK):
   * {
   *   "tenantId": "tenant-789",
   *   "vendorWhatsAppNumber": "5511999999999",
   *   "vendorWhatsAppName": "João - Vendedor"
   * }
   */
  @Get('config/:tenantId')
  async getVendorConfig(@Param('tenantId') tenantId: string): Promise<any> {
    return await this.notificationService.getVendorConfig(tenantId);
  }

  /**
   * POST /notification/vendor/payment-approved
   * Notificar vendedor quando PAGAMENTO FOI APROVADO
   *
   * DISPARA AUTOMATICAMENTE EM:
   * PaymentService.validatePaymentProof() → sucesso
   *
   * Body:
   * {
   *   "orderId": "order-uuid-123",
   *   "tenantId": "tenant-789",
   *   "clientPhoneNumber": "5511988887777",
   *   "paymentProofUrl": "s3://bucket/proofs/pix-12345.jpg",
   *   "paymentProofType": "PIX_RECEIPT",
   *   "orderTotal": 162.00,
   *   "orderItems": [
   *     {
   *       "productName": "Vinho Tinto Reserva",
   *       "quantity": 2,
   *       "price": 75.00
   *     }
   *   ]
   * }
   *
   * Mensagem Enviada ao Vendedor (WhatsApp):
   * ════════════════════════════════════════════
   * 🎉 NOVO PEDIDO CONFIRMADO!
   *
   * 📋 Número do Pedido: order-uuid-123
   * 👤 Número do Cliente: 5511988887777
   *
   * 📦 Itens:
   * • Vinho Tinto Reserva (2x) = R$ 150.00
   *
   * 💰 Total: R$ 162.00
   * 💳 Comprovante Anexado: (PIX_RECEIPT)
   *
   * [✅ ACEITAR] [❌ REJEITAR]
   * ════════════════════════════════════════════
   *
   * Response (200 OK):
   * {
   *   "success": true,
   *   "messageId": "wamid.ABC123XYZ",
   *   "status": "sent",
   *   "timestamp": "2026-02-01T19:45:30Z"
   * }
   */
  @Post('vendor/payment-approved')
  async notifyVendorPaymentApproved(
    @Body() dto: NotifyVendorPaymentApprovedDto,
  ): Promise<NotificationSentResponseDto> {
    return await this.notificationService.notifyVendorPaymentApproved(dto);
  }

  /**
   * POST /notification/client/order-status
   * Notificar cliente quando vendedor ACEITA ou REJEITA
   *
   * DISPARA AUTOMATICAMENTE EM:
   * Webhook recebe resposta do vendedor (clicou em [ACEITAR] ou [REJEITAR])
   *
   * Body:
   * {
   *   "orderId": "order-uuid-123",
   *   "clientPhoneNumber": "5511988887777",
   *   "status": "CONFIRMED",
   *   "reason": ""
   * }
   *
   * Ou se rejeitado:
   * {
   *   "orderId": "order-uuid-123",
   *   "clientPhoneNumber": "5511988887777",
   *   "status": "REJECTED",
   *   "reason": "Produto indisponível no momento"
   * }
   *
   * Mensagem Enviada ao Cliente:
   * ════════════════════════════════════════════
   * Se CONFIRMADO:
   * ✅ SUA COMPRA FOI CONFIRMADA!
   *
   * Seu vendedor confirmou seu pedido e vai começar
   * a processar. Você receberá atualizações em breve.
   *
   * Obrigado por comprar! 🎉
   *
   * Se REJEITADO:
   * ❌ SEU PEDIDO FOI REJEITADO
   *
   * Motivo: Produto indisponível no momento
   * Você pode fazer um novo pedido ou entrar
   * em contato para mais informações.
   * ════════════════════════════════════════════
   *
   * Response (200 OK):
   * {
   *   "success": true,
   *   "messageId": "wamid.DEF456UVW",
   *   "status": "sent",
   *   "timestamp": "2026-02-01T19:46:15Z"
   * }
   */
  @Post('client/order-status')
  async notifyClientOrderStatus(
    @Body() dto: NotifyClientOrderStatusDto,
  ): Promise<NotificationSentResponseDto> {
    return await this.notificationService.notifyClientOrderStatus(dto);
  }
}
