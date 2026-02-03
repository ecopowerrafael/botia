import { PrismaService } from '../../shared/prisma.service';
import { UploadPaymentProofDto, ValidatePaymentProofDto, PaymentProofResponseDto, ValidationResultDto } from './dto/payment.dto';
export declare class PaymentService {
    private prisma;
    private ollamaApiUrl;
    constructor(prisma: PrismaService);
    uploadPaymentProof(dto: UploadPaymentProofDto): Promise<PaymentProofResponseDto>;
    validatePaymentProof(dto: ValidatePaymentProofDto): Promise<ValidationResultDto>;
    private extractDataFromImage;
    private buildPrompt;
    private parseOllamaResponse;
    private validateAmount;
    getPaymentProof(orderId: string): Promise<PaymentProofResponseDto>;
    private mapToResponseDto;
}
