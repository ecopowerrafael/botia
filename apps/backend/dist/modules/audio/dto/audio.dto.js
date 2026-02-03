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
exports.AudioListDto = exports.TranscriptionResultDto = exports.AudioMessageResponseDto = exports.TranscribeAudioDto = exports.ReceiveAudioDto = void 0;
const class_validator_1 = require("class-validator");
class ReceiveAudioDto {
    chatId;
    contactId;
    tenantId;
    audioPath;
    mimeType;
    sizeBytes;
    durationSeconds;
}
exports.ReceiveAudioDto = ReceiveAudioDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReceiveAudioDto.prototype, "chatId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReceiveAudioDto.prototype, "contactId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReceiveAudioDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReceiveAudioDto.prototype, "audioPath", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReceiveAudioDto.prototype, "mimeType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ReceiveAudioDto.prototype, "sizeBytes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ReceiveAudioDto.prototype, "durationSeconds", void 0);
class TranscribeAudioDto {
    audioMessageId;
    audioPath;
    mimeType;
    language;
}
exports.TranscribeAudioDto = TranscribeAudioDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscribeAudioDto.prototype, "audioMessageId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscribeAudioDto.prototype, "audioPath", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscribeAudioDto.prototype, "mimeType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscribeAudioDto.prototype, "language", void 0);
class AudioMessageResponseDto {
    id;
    chatId;
    contactId;
    audioPath;
    mimeType;
    sizeBytes;
    duration;
    status;
    transcript;
    transcriptConfidence;
    transcribedAt;
    transcriptionTimeMs;
    errorMessage;
    createdAt;
    updatedAt;
}
exports.AudioMessageResponseDto = AudioMessageResponseDto;
class TranscriptionResultDto {
    success;
    audioMessageId;
    transcript;
    confidence;
    language;
    duration;
    processTimeMs;
    error;
}
exports.TranscriptionResultDto = TranscriptionResultDto;
class AudioListDto {
    chatId;
    audioMessages;
    totalCount;
    lastUpdated;
}
exports.AudioListDto = AudioListDto;
//# sourceMappingURL=audio.dto.js.map