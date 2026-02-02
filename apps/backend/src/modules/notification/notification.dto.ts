import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

/**
 * DTO: Notificar vendedor sobre novo pagamento aprovado
 */
export class NotifyVendorPaymentApprovedDto {
  @IsString()
  orderId: string; // ID do pedido

  @IsString()
  tenantId: string; // Loja/vendor

  @IsString()
  clientPhoneNumber: string; // Número do cliente

  @IsString()
  paymentProofUrl: string; // URL do comprovante (PIX, nota fiscal, etc)

  @IsString()
  @IsOptional()
  paymentProofType?: string; // PIX_RECEIPT, BANK_SLIP, SCREENSHOT, INVOICE

  @IsNumber()
  orderTotal: number; // Valor total do pedido

  @IsArray()
  @IsOptional()
  orderItems?: any[]; // Itens do pedido
}

/**
 * DTO: Notificar cliente sobre pedido confirmado/rejeitado pelo vendedor
 */
export class NotifyClientOrderStatusDto {
  @IsString()
  orderId: string;

  @IsString()
  clientPhoneNumber: string;

  @IsString()
  status: 'CONFIRMED' | 'REJECTED'; // Vendedor confirmou ou rejeitou

  @IsString()
  @IsOptional()
  reason?: string; // Motivo da rejeição (opcional)
}

/**
 * Resposta: Notificação enviada
 */
export class NotificationSentResponseDto {
  success: boolean;
  messageId?: string; // ID da mensagem WhatsApp
  status: 'sent' | 'failed' | 'pending';
  error?: string;
  timestamp: string;
}

/**
 * Configuração WhatsApp para notificações do vendor
 */
export class VendorWhatsAppConfigDto {
  @IsString()
  tenantId: string;

  @IsString()
  vendorWhatsAppNumber: string; // Número do vendedor (ex: 5511999999999)

  @IsString()
  @IsOptional()
  vendorWhatsAppName?: string; // Nome do vendedor

  @IsString()
  @IsOptional()
  vendorInstanceKey?: string; // Qual instância WhatsApp usar
}

/**
 * Resposta: Config salva
 */
export class VendorWhatsAppConfigResponseDto {
  success: boolean;
  config: {
    tenantId: string;
    vendorWhatsAppNumber: string;
    vendorWhatsAppName: string;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * DTO: Obter config WhatsApp do vendor
 */
export class GetVendorConfigDto {
  @IsString()
  tenantId: string;
}

/**
 * Webhook: Vendedor responde [ACEITAR] ou [REJEITAR]
 */
export class VendorResponseWebhookDto {
  orderId: string;
  vendorPhoneNumber: string;
  response: 'ACCEPT' | 'REJECT'; // Vendedor clicou em qual botão
  responseTime: string;
  reason?: string; // Se rejeitou, qual motivo
}

/**
 * Resposta: Webhook processado
 */
export class VendorResponseWebhookResponseDto {
  success: boolean;
  orderId: string;
  orderStatus: 'CONFIRMED' | 'REJECTED';
  message: string;
  timestamp: string;
}
