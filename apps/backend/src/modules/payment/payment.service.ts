import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import {
  UploadPaymentProofDto,
  ValidatePaymentProofDto,
  PaymentProofResponseDto,
  ValidationResultDto,
  OllamaExtractionDto,
  ProofType,
} from './dto/payment.dto';
import axios from 'axios';

/**
 * PaymentService gerencia:
 * - Upload de comprovante de pagamento
 * - Validação com Ollama LLaVA (IA para análise de imagem)
 * - Atualização do status do pedido
 * - Notificação ao vendedor
 */
@Injectable()
export class PaymentService {
  private ollamaApiUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';

  constructor(private prisma: PrismaService) {}

  /**
   * Upload do comprovante de pagamento
   */
  async uploadPaymentProof(
    dto: UploadPaymentProofDto,
  ): Promise<PaymentProofResponseDto> {
    // Validar se ordem existe
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new BadRequestException('Pedido não encontrado');
    }

    // Verificar se já existe comprovante
    const existingProof = await this.prisma.paymentProof.findUnique({
      where: { orderId: dto.orderId },
    });

    if (existingProof && existingProof.isVerified) {
      throw new BadRequestException('Este pedido já tem comprovante verificado');
    }

    // Criar ou atualizar comprovante
    const proof = await this.prisma.paymentProof.upsert({
      where: { orderId: dto.orderId },
      create: {
        orderId: dto.orderId,
        proofType: dto.proofType,
        proofUrl: dto.proofUrl,
        isVerified: false,
      },
      update: {
        proofType: dto.proofType,
        proofUrl: dto.proofUrl,
        isVerified: false,
        verifiedAt: null,
      },
    });

    return this.mapToResponseDto(proof);
  }

  /**
   * Validar comprovante com Ollama LLaVA
   * Extrai dados da imagem e verifica se é válida
   */
  async validatePaymentProof(
    dto: ValidatePaymentProofDto,
  ): Promise<ValidationResultDto> {
    // Obter comprovante
    const proof = await this.prisma.paymentProof.findUnique({
      where: { orderId: dto.orderId },
    });

    if (!proof) {
      throw new BadRequestException('Comprovante não encontrado');
    }

    // Obter ordem para saber o valor esperado
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new BadRequestException('Pedido não encontrado');
    }

    // Chamar Ollama para análise
    let extractedData: OllamaExtractionDto;
    try {
      extractedData = await this.extractDataFromImage(
        dto.proofUrl,
        dto.proofType,
      );
    } catch (error) {
      throw new HttpException(
        `Erro ao processar imagem: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validar montante
    const isValid = this.validateAmount(
      extractedData.amount,
      order.total,
      extractedData.confidence,
    );

    // Atualizar comprovante no banco
    await this.prisma.paymentProof.update({
      where: { orderId: dto.orderId },
      data: {
        proofData: extractedData as any,
        isVerified: isValid,
        verifiedBy: isValid ? 'OLLAMA_LLAVA' : null,
        verifiedAt: isValid ? new Date() : null,
        verificationNotes: isValid
          ? 'Validado por IA'
          : 'Falha na validação: montante não corresponde',
      },
    });

    // Se válido, atualizar status do pedido
    if (isValid) {
      await this.prisma.order.update({
        where: { id: dto.orderId },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
        },
      });

      // TODO: Notificar vendedor via WhatsApp
      console.log(`✅ Pagamento verificado para pedido: ${dto.orderId}`);
    }

    return {
      success: isValid,
      orderId: dto.orderId,
      proofType: dto.proofType,
      isVerified: isValid,
      confidence: extractedData.confidence,
      extractedData: {
        amount: extractedData.amount,
        datetime: extractedData.datetime,
        txId: extractedData.txId,
        payer: extractedData.payer,
        notes: extractedData.rawText,
      },
      message: isValid
        ? 'Pagamento validado com sucesso!'
        : 'Falha na validação do pagamento',
    };
  }

  /**
   * Chamar Ollama LLaVA para extrair dados da imagem
   * LLaVA é um modelo de visão computacional que lê texto em imagens
   */
  private async extractDataFromImage(
    imageUrl: string,
    proofType: ProofType,
  ): Promise<OllamaExtractionDto> {
    try {
      // TODO: Baixar imagem se necessário
      // Por enquanto, assumimos que a URL já é acessível

      const prompt = this.buildPrompt(proofType);

      // Chamar Ollama endpoint
      const response = await axios.post(
        `${this.ollamaApiUrl}/api/generate`,
        {
          model: 'llava', // Modelo de visão
          prompt: prompt,
          images: [imageUrl], // Base64 ou URL
          stream: false,
        },
        { timeout: 30000 },
      );

      // Parser do response
      const extractedData = this.parseOllamaResponse(
        response.data.response,
        proofType,
      );

      return extractedData;
    } catch (error) {
      console.error('Erro ao chamar Ollama:', error.message);
      throw new HttpException(
        'Erro ao processar imagem com IA',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Construir prompt para Ollama baseado no tipo de comprovante
   */
  private buildPrompt(proofType: ProofType): string {
    switch (proofType) {
      case ProofType.PIX_RECEIPT:
        return `
          Analise esta imagem de comprovante PIX e extraia:
          1. Valor transferido (número apenas, ex: 194.18)
          2. Data e hora (formato ISO)
          3. ID da transação/chave PIX (txId)
          4. Nome do pagador
          
          Responda em JSON: { "amount": X, "datetime": "...", "txId": "...", "payer": "..." }
          Se não conseguir extrair algum campo, deixe como null.
          Indique seu nível de confiança (0-1) no campo "confidence".
        `;

      case ProofType.BANK_SLIP:
        return `
          Analise este boleto bancário e extraia:
          1. Valor do boleto (número apenas)
          2. Data de vencimento
          3. Código de barras
          4. Beneficiário
          
          Responda em JSON estruturado.
          Confiança da leitura (0-1).
        `;

      case ProofType.SCREENSHOT:
        return `
          Analise esta screenshot e extraia dados de pagamento:
          1. Valor (procure por "R$" ou número grande)
          2. Data/hora (procure por timestamp)
          3. Status (pago, confirmado, etc)
          4. Referência ou ID
          
          JSON: { "amount": X, "datetime": "...", "txId": "...", "status": "..." }
        `;

      default:
        return `Extraia dados de pagamento desta imagem em formato JSON.`;
    }
  }

  /**
   * Parser do response do Ollama
   */
  private parseOllamaResponse(
    response: string,
    proofType: ProofType,
  ): OllamaExtractionDto {
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON não encontrado na resposta');
      }

      const extracted = JSON.parse(jsonMatch[0]);

      return {
        amount: extracted.amount ? parseFloat(extracted.amount) : undefined,
        datetime: extracted.datetime || undefined,
        txId: extracted.txId || extracted.transactionId || undefined,
        payer: extracted.payer || undefined,
        confidence: extracted.confidence || 0.7, // Default 70%
        rawText: response,
      };
    } catch (error) {
      console.error('Erro ao fazer parse da resposta Ollama:', error);
      // Retornar default se falhar
      return {
        confidence: 0,
        rawText: response,
      };
    }
  }

  /**
   * Validar se o montante extraído corresponde ao pedido
   */
  private validateAmount(
    extractedAmount: number | undefined,
    expectedAmount: number,
    confidence: number,
  ): boolean {
    if (!extractedAmount) {
      return false; // Não conseguiu extrair montante
    }

    // Tolerância de 1% para diferenças de arredondamento
    const tolerance = expectedAmount * 0.01;
    const isWithinRange =
      Math.abs(extractedAmount - expectedAmount) <= tolerance;

    // Precisa de alta confiança E montante correto
    return isWithinRange && confidence > 0.6;
  }

  /**
   * Obter histórico de comprovantes de um pedido
   */
  async getPaymentProof(orderId: string): Promise<PaymentProofResponseDto> {
    const proof = await this.prisma.paymentProof.findUnique({
      where: { orderId },
    });

    if (!proof) {
      throw new BadRequestException('Comprovante não encontrado');
    }

    return this.mapToResponseDto(proof);
  }

  /**
   * Mapper para response DTO
   */
  private mapToResponseDto(proof: any): PaymentProofResponseDto {
    return {
      id: proof.id,
      orderId: proof.orderId,
      proofType: proof.proofType as ProofType,
      proofUrl: proof.proofUrl,
      proofData: proof.proofData as any,
      isVerified: proof.isVerified,
      verifiedBy: proof.verifiedBy,
      verifiedAt: proof.verifiedAt,
      verificationNotes: proof.verificationNotes,
      uploadedAt: proof.uploadedAt,
    };
  }
}
