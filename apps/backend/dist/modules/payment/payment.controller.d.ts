import { PaymentService } from './payment.service';
import { UploadPaymentProofDto, ValidatePaymentProofDto } from './dto/payment.dto';
export declare class PaymentController {
    private paymentService;
    constructor(paymentService: PaymentService);
    uploadPaymentProof(dto: UploadPaymentProofDto): Promise<import("./dto/payment.dto").PaymentProofResponseDto>;
    validatePaymentProof(dto: ValidatePaymentProofDto): Promise<import("./dto/payment.dto").ValidationResultDto>;
    getPaymentProof(orderId: string): Promise<import("./dto/payment.dto").PaymentProofResponseDto>;
}
