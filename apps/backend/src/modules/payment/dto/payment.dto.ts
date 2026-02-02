import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';

export enum ProofType {
  PIX_RECEIPT = 'PIX_RECEIPT',
  BANK_SLIP = 'BANK_SLIP',
  SCREENSHOT = 'SCREENSHOT',
  INVOICE = 'INVOICE',
}

export class UploadPaymentProofDto {
  @IsString()
  orderId: string;

  @IsEnum(ProofType)
  proofType: ProofType;

  @IsString()
  proofUrl: string; // URL da imagem (S3, local, etc)

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ValidatePaymentProofDto {
  @IsString()
  orderId: string;

  @IsString()
  proofUrl: string;

  @IsEnum(ProofType)
  proofType: ProofType;
}

export class PaymentProofResponseDto {
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

export class ValidationResultDto {
  success: boolean;
  orderId: string;
  proofType: ProofType;
  isVerified: boolean;
  confidence: number; // 0-1 (quanto o Ollama tem certeza)
  extractedData: {
    amount?: number;
    datetime?: string;
    txId?: string;
    payer?: string;
    notes?: string;
  };
  message: string;
}

export class OllamaExtractionDto {
  amount?: number;
  datetime?: string;
  txId?: string;
  payer?: string;
  confidence: number;
  rawText: string;
}
