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
exports.UserResponseDto = exports.UserPreferencesDto = exports.UserCreateDto = void 0;
const class_validator_1 = require("class-validator");
const enums_1 = require("../../../shared/enums");
class UserCreateDto {
    email;
    name;
    phone;
    role;
    password;
    tenantId;
}
exports.UserCreateDto = UserCreateDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UserCreateDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], UserCreateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsPhoneNumber)('BR'),
    __metadata("design:type", String)
], UserCreateDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.UserRole),
    __metadata("design:type", String)
], UserCreateDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], UserCreateDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserCreateDto.prototype, "tenantId", void 0);
class UserPreferencesDto {
    operationMode;
    audioEnabled;
    audioLanguage;
    audioSpeed;
    language;
    timezone;
    notificationsEnabled;
}
exports.UserPreferencesDto = UserPreferencesDto;
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.VendorMode),
    __metadata("design:type", String)
], UserPreferencesDto.prototype, "operationMode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UserPreferencesDto.prototype, "audioEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserPreferencesDto.prototype, "audioLanguage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UserPreferencesDto.prototype, "audioSpeed", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserPreferencesDto.prototype, "language", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserPreferencesDto.prototype, "timezone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UserPreferencesDto.prototype, "notificationsEnabled", void 0);
class UserResponseDto {
    id;
    email;
    name;
    phone;
    role;
    status;
    preferences;
    createdAt;
    updatedAt;
}
exports.UserResponseDto = UserResponseDto;
//# sourceMappingURL=user.dto.js.map