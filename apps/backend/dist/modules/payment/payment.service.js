"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma.service");
const payment_dto_1 = require("./dto/payment.dto");
const axios_1 = __importDefault(require("axios"));
let PaymentService = class PaymentService {
    prisma;
    ollamaApiUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    constructor(prisma) {
        this.prisma = prisma;
    }
    async uploadPaymentProof(dto) {
        const order = await this.prisma.order.findUnique({
            where: { id: dto.orderId },
        });
        if (!order) {
            throw new common_1.BadRequestException('Pedido não encontrado');
        }
        const existingProof = await this.prisma.paymentProof.findUnique({
            where: { orderId: dto.orderId },
        });
        if (existingProof && existingProof.isVerified) {
            throw new common_1.BadRequestException('Este pedido já tem comprovante verificado');
        }
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
    async validatePaymentProof(dto) {
        const proof = await this.prisma.paymentProof.findUnique({
            where: { orderId: dto.orderId },
        });
        if (!proof) {
            throw new common_1.BadRequestException('Comprovante não encontrado');
        }
        const order = await this.prisma.order.findUnique({
            where: { id: dto.orderId },
        });
        if (!order) {
            throw new common_1.BadRequestException('Pedido não encontrado');
        }
        let extractedData;
        try {
            extractedData = await this.extractDataFromImage(dto.proofUrl, dto.proofType);
        }
        catch (error) {
            throw new common_1.HttpException(`Erro ao processar imagem: ${error.message}`, common_1.HttpStatus.BAD_REQUEST);
        }
        const isValid = this.validateAmount(extractedData.amount, order.total, extractedData.confidence);
        await this.prisma.paymentProof.update({
            where: { orderId: dto.orderId },
            data: {
                proofData: extractedData,
                isVerified: isValid,
                verifiedBy: isValid ? 'OLLAMA_LLAVA' : null,
                verifiedAt: isValid ? new Date() : null,
                verificationNotes: isValid
                    ? 'Validado por IA'
                    : 'Falha na validação: montante não corresponde',
            },
        });
        if (isValid) {
            await this.prisma.order.update({
                where: { id: dto.orderId },
                data: {
                    paymentStatus: 'PAID',
                    status: 'CONFIRMED',
                },
            });
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
    async extractDataFromImage(imageUrl, proofType) {
        try {
            const prompt = this.buildPrompt(proofType);
            const response = await axios_1.default.post(`${this.ollamaApiUrl}/api/generate`, {
                model: 'llava',
                prompt: prompt,
                images: [imageUrl],
                stream: false,
            }, { timeout: 30000 });
            const extractedData = this.parseOllamaResponse(response.data.response, proofType);
            return extractedData;
        }
        catch (error) {
            console.error('Erro ao chamar Ollama:', error.message);
            throw new common_1.HttpException('Erro ao processar imagem com IA', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    buildPrompt(proofType) {
        switch (proofType) {
            case payment_dto_1.ProofType.PIX_RECEIPT:
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
            case payment_dto_1.ProofType.BANK_SLIP:
                return `
          Analise este boleto bancário e extraia:
          1. Valor do boleto (número apenas)
          2. Data de vencimento
          3. Código de barras
          4. Beneficiário
          
          Responda em JSON estruturado.
          Confiança da leitura (0-1).
        `;
            case payment_dto_1.ProofType.SCREENSHOT:
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
    parseOllamaResponse(response, proofType) {
        try {
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
                confidence: extracted.confidence || 0.7,
                rawText: response,
            };
        }
        catch (error) {
            console.error('Erro ao fazer parse da resposta Ollama:', error);
            return {
                confidence: 0,
                rawText: response,
            };
        }
    }
    validateAmount(extractedAmount, expectedAmount, confidence) {
        if (!extractedAmount) {
            return false;
        }
        const tolerance = expectedAmount * 0.01;
        const isWithinRange = Math.abs(extractedAmount - expectedAmount) <= tolerance;
        return isWithinRange && confidence > 0.6;
    }
    async getPaymentProof(orderId) {
        const proof = await this.prisma.paymentProof.findUnique({
            where: { orderId },
        });
        if (!proof) {
            throw new common_1.BadRequestException('Comprovante não encontrado');
        }
        return this.mapToResponseDto(proof);
    }
    mapToResponseDto(proof) {
        return {
            id: proof.id,
            orderId: proof.orderId,
            proofType: proof.proofType,
            proofUrl: proof.proofUrl,
            proofData: proof.proofData,
            isVerified: proof.isVerified,
            verifiedBy: proof.verifiedBy,
            verifiedAt: proof.verifiedAt,
            verificationNotes: proof.verificationNotes,
            uploadedAt: proof.uploadedAt,
        };
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map