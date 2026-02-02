import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import {
  UploadPaymentProofDto,
  ValidatePaymentProofDto,
} from './dto/payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  /**
   * POST /payment/upload-proof
   * Cliente envia comprovante de pagamento (imagem ou URL)
   *
   * Body:
   * {
   *   orderId: "order-uuid",
   *   proofType: "PIX_RECEIPT" | "BANK_SLIP" | "SCREENSHOT",
   *   proofUrl: "https://s3.../receipt.jpg",
   *   notes?: "PIX enviado para João"
   * }
   *
   * Resposta (201 CREATED):
   * {
   *   id: "proof-uuid",
   *   orderId: "order-uuid",
   *   proofType: "PIX_RECEIPT",
   *   proofUrl: "...",
   *   isVerified: false,
   *   uploadedAt: "2026-02-01T19:30:00Z"
   * }
   */
  @Post('upload-proof')
  @HttpCode(HttpStatus.CREATED)
  async uploadPaymentProof(@Body() dto: UploadPaymentProofDto) {
    return this.paymentService.uploadPaymentProof(dto);
  }

  /**
   * POST /payment/validate-proof
   * Validar comprovante com Ollama LLaVA
   *
   * Body:
   * {
   *   orderId: "order-uuid",
   *   proofUrl: "https://s3.../receipt.jpg",
   *   proofType: "PIX_RECEIPT"
   * }
   *
   * O que acontece:
   * 1. Ollama LLaVA analisa a imagem
   * 2. Extrai: valor, data/hora, ID transação
   * 3. Compara com valor esperado do pedido
   * 4. Se válido:
   *    - Marca como verificado
   *    - Muda status do pedido para PAID
   *    - Notifica vendedor (TODO)
   *
   * Resposta (200 OK):
   * {
   *   success: true,
   *   orderId: "order-uuid",
   *   proofType: "PIX_RECEIPT",
   *   isVerified: true,
   *   confidence: 0.95,
   *   extractedData: {
   *     amount: 194.18,
   *     datetime: "2026-02-01T19:25:00Z",
   *     txId: "e1a1b2c3d4e5f6g7",
   *     payer: "João Silva"
   *   },
   *   message: "Pagamento validado com sucesso!"
   * }
   */
  @Post('validate-proof')
  @HttpCode(HttpStatus.OK)
  async validatePaymentProof(@Body() dto: ValidatePaymentProofDto) {
    return this.paymentService.validatePaymentProof(dto);
  }

  /**
   * GET /payment/proof/:orderId
   * Obter comprovante de um pedido
   *
   * Resposta (200 OK):
   * {
   *   id: "proof-uuid",
   *   orderId: "order-uuid",
   *   proofType: "PIX_RECEIPT",
   *   proofUrl: "...",
   *   proofData: {
   *     amount: 194.18,
   *     datetime: "2026-02-01T19:25:00Z",
   *     txId: "e1a1b2c3d4e5f6g7",
   *     confidence: 0.95
   *   },
   *   isVerified: true,
   *   verifiedBy: "OLLAMA_LLAVA",
   *   verifiedAt: "2026-02-01T19:26:00Z",
   *   uploadedAt: "2026-02-01T19:25:30Z"
   * }
   */
  @Get('proof/:orderId')
  async getPaymentProof(@Param('orderId') orderId: string) {
    return this.paymentService.getPaymentProof(orderId);
  }
}
