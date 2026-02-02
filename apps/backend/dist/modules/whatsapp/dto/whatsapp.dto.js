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
exports.DisconnectInstanceDto = exports.ConnectInstanceDto = exports.WebhookPayloadDto = exports.SendMessageDto = exports.CreateInstanceDto = exports.WebhookEventType = void 0;
const class_validator_1 = require("class-validator");
var WebhookEventType;
(function (WebhookEventType) {
    WebhookEventType["MESSAGE"] = "message";
    WebhookEventType["STATUS"] = "status";
    WebhookEventType["PRESENCE"] = "presence";
    WebhookEventType["INSTANCE_CONNECTED"] = "instance.connected";
    WebhookEventType["INSTANCE_DISCONNECTED"] = "instance.disconnected";
})(WebhookEventType || (exports.WebhookEventType = WebhookEventType = {}));
class CreateInstanceDto {
    tenantId;
    name;
    description;
}
exports.CreateInstanceDto = CreateInstanceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInstanceDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInstanceDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstanceDto.prototype, "description", void 0);
class SendMessageDto {
    tenantId;
    instanceKey;
    phoneNumber;
    message;
    mediaUrl;
}
exports.SendMessageDto = SendMessageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "instanceKey", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], SendMessageDto.prototype, "mediaUrl", void 0);
class WebhookPayloadDto {
    event;
    instanceKey;
    from;
    to;
    message;
    data;
    status;
}
exports.WebhookPayloadDto = WebhookPayloadDto;
__decorate([
    (0, class_validator_1.IsEnum)(WebhookEventType),
    __metadata("design:type", String)
], WebhookPayloadDto.prototype, "event", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WebhookPayloadDto.prototype, "instanceKey", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], WebhookPayloadDto.prototype, "from", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], WebhookPayloadDto.prototype, "to", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], WebhookPayloadDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], WebhookPayloadDto.prototype, "data", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], WebhookPayloadDto.prototype, "status", void 0);
class ConnectInstanceDto {
    tenantId;
    instanceKey;
}
exports.ConnectInstanceDto = ConnectInstanceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConnectInstanceDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConnectInstanceDto.prototype, "instanceKey", void 0);
class DisconnectInstanceDto {
    tenantId;
    instanceKey;
}
exports.DisconnectInstanceDto = DisconnectInstanceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DisconnectInstanceDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DisconnectInstanceDto.prototype, "instanceKey", void 0);
//# sourceMappingURL=whatsapp.dto.js.map