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
exports.KNOWN_INTENTS = exports.ProcessTranscriptResponseDto = exports.ProcessTranscriptDto = exports.ExtractEntitiesResponseDto = exports.EntityDto = exports.DetectIntentResponseDto = exports.ExtractEntitiesDto = exports.DetectIntentDto = void 0;
const class_validator_1 = require("class-validator");
class DetectIntentDto {
    text;
    language;
    context;
    chatId;
}
exports.DetectIntentDto = DetectIntentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DetectIntentDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DetectIntentDto.prototype, "language", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DetectIntentDto.prototype, "context", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DetectIntentDto.prototype, "chatId", void 0);
class ExtractEntitiesDto {
    text;
    intent;
    knownEntities;
    language;
}
exports.ExtractEntitiesDto = ExtractEntitiesDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExtractEntitiesDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExtractEntitiesDto.prototype, "intent", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ExtractEntitiesDto.prototype, "knownEntities", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ExtractEntitiesDto.prototype, "language", void 0);
class DetectIntentResponseDto {
    intent;
    confidence;
    subIntents;
    entities;
    sentiment;
    suggestedAction;
    rawText;
    language;
}
exports.DetectIntentResponseDto = DetectIntentResponseDto;
class EntityDto {
    type;
    value;
    confidence;
    position;
}
exports.EntityDto = EntityDto;
class ExtractEntitiesResponseDto {
    text;
    entities;
    totalEntities;
    language;
}
exports.ExtractEntitiesResponseDto = ExtractEntitiesResponseDto;
class ProcessTranscriptDto {
    audioMessageId;
    transcript;
    confidence;
    chatId;
    context;
}
exports.ProcessTranscriptDto = ProcessTranscriptDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcessTranscriptDto.prototype, "audioMessageId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcessTranscriptDto.prototype, "transcript", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ProcessTranscriptDto.prototype, "confidence", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcessTranscriptDto.prototype, "chatId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProcessTranscriptDto.prototype, "context", void 0);
class ProcessTranscriptResponseDto {
    audioMessageId;
    transcript;
    intent;
    confidence;
    entities;
    suggestedAction;
    shouldAddToCart;
    shouldGenerateResponse;
    shouldNotifyVendor;
    cartItems;
    responseText;
}
exports.ProcessTranscriptResponseDto = ProcessTranscriptResponseDto;
exports.KNOWN_INTENTS = {
    COMPRA: 'Usuário deseja comprar algo',
    PERGUNTA: 'Usuário tem dúvida',
    RECLAMACAO: 'Usuário está insatisfeito',
    SAUDACAO: 'Cumprimento simples',
    HORARIO: 'Pergunta sobre horário de atendimento',
    LOCALIZACAO: 'Pergunta sobre endereço',
    CARDAPIO: 'Pede para ver cardápio',
    CANCELAR_PEDIDO: 'Deseja cancelar pedido',
    REEMBOLSO: 'Solicita reembolso',
    RASTREAMENTO: 'Pergunta sobre status do pedido',
    PROMOÇÃO: 'Pergunta sobre promoções/descontos',
    FEEDBACK: 'Deixar avaliação ou comentário',
    SUPORTE: 'Solicita suporte técnico',
    AGENTE_HUMANO: 'Quer falar com pessoa',
};
//# sourceMappingURL=intent.dto.js.map