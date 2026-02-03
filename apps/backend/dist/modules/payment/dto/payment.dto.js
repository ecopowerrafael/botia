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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaExtractionDto = exports.ValidationResultDto = exports.PaymentProofResponseDto = exports.ValidatePaymentProofDto = exports.UploadPaymentProofDto = exports.ProofType = void 0;
const class_validator_1 = require("class-validator");
var ProofType;
(function (ProofType) {
    ProofType["PIX_RECEIPT"] = "PIX_RECEIPT";
    ProofType["BANK_SLIP"] = "BANK_SLIP";
    ProofType["SCREENSHOT"] = "SCREENSHOT";
    ProofType["INVOICE"] = "INVOICE";
})(ProofType || (exports.ProofType = ProofType = {}));
class UploadPaymentProofDto {
    orderId;
    proofType;
    proofUrl;
    notes;
}
exports.UploadPaymentProofDto = UploadPaymentProofDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadPaymentProofDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(ProofType),
    __metadata("design:type", String)
], UploadPaymentProofDto.prototype, "proofType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadPaymentProofDto.prototype, "proofUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadPaymentProofDto.prototype, "notes", void 0);
class ValidatePaymentProofDto {
    orderId;
    proofUrl;
    proofType;
}
exports.ValidatePaymentProofDto = ValidatePaymentProofDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ValidatePaymentProofDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ValidatePaymentProofDto.prototype, "proofUrl", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(ProofType),
    __metadata("design:type", String)
], ValidatePaymentProofDto.prototype, "proofType", void 0);
class PaymentProofResponseDto {
    id;
    orderId;
    proofType;
    proofUrl;
    proofData;
    isVerified;
    verifiedBy;
    verifiedAt;
    verificationNotes;
    uploadedAt;
}
exports.PaymentProofResponseDto = PaymentProofResponseDto;
class ValidationResultDto {
    success;
    orderId;
    proofType;
    isVerified;
    confidence;
    extractedData;
    message;
}
exports.ValidationResultDto = ValidationResultDto;
class OllamaExtractionDto {
    amount;
    datetime;
    txId;
    payer;
    confidence;
    rawText;
}
exports.OllamaExtractionDto = OllamaExtractionDto;
//# sourceMappingURL=payment.dto.js.map