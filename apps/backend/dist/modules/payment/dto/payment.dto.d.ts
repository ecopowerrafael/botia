export declare enum ProofType {
    PIX_RECEIPT = "PIX_RECEIPT",
    BANK_SLIP = "BANK_SLIP",
    SCREENSHOT = "SCREENSHOT",
    INVOICE = "INVOICE"
}
export declare class UploadPaymentProofDto {
    orderId: string;
    proofType: ProofType;
    proofUrl: string;
    notes?: string;
}
export declare class ValidatePaymentProofDto {
    orderId: string;
    proofUrl: string;
    proofType: ProofType;
}
export declare class PaymentProofResponseDto {
    id: string;
    orderId: string;
    proofType: ProofType;
    proofUrl: string;
    proofData?: {
        amount?: number;
        datetime?: string;
        txId?: string;
        payer?: string;
        confidence?: number;
        extractedText?: string;
    };
    isVerified: boolean;
    verifiedBy?: string;
    verifiedAt?: Date;
    verificationNotes?: string;
    uploadedAt: Date;
}
export declare class ValidationResultDto {
    success: boolean;
    orderId: string;
    proofType: ProofType;
    isVerified: boolean;
    confidence: number;
    extractedData: {
        amount?: number;
        datetime?: string;
        txId?: string;
        payer?: string;
        notes?: string;
    };
    message: string;
}
export declare class OllamaExtractionDto {
    amount?: number;
    datetime?: string;
    txId?: string;
    payer?: string;
    confidence: number;
    rawText: string;
}
