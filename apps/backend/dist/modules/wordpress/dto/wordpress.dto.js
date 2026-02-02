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
exports.WordPressIntegrationResponseDto = exports.WordPressProductDto = exports.SyncDataDto = exports.ConfigureFieldsDto = exports.ConnectWordPressDto = void 0;
const class_validator_1 = require("class-validator");
class ConnectWordPressDto {
    siteUrl;
    username;
    appPassword;
    syncProducts;
    syncPosts;
    syncPages;
    productFields;
}
exports.ConnectWordPressDto = ConnectWordPressDto;
__decorate([
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], ConnectWordPressDto.prototype, "siteUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConnectWordPressDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConnectWordPressDto.prototype, "appPassword", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConnectWordPressDto.prototype, "syncProducts", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConnectWordPressDto.prototype, "syncPosts", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConnectWordPressDto.prototype, "syncPages", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ConnectWordPressDto.prototype, "productFields", void 0);
class ConfigureFieldsDto {
    integrationId;
    productFields;
    syncProducts;
    syncPosts;
    syncPages;
    syncFrequency;
}
exports.ConfigureFieldsDto = ConfigureFieldsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigureFieldsDto.prototype, "integrationId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ConfigureFieldsDto.prototype, "productFields", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConfigureFieldsDto.prototype, "syncProducts", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConfigureFieldsDto.prototype, "syncPosts", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConfigureFieldsDto.prototype, "syncPages", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ConfigureFieldsDto.prototype, "syncFrequency", void 0);
class SyncDataDto {
    integrationId;
    limit;
}
exports.SyncDataDto = SyncDataDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyncDataDto.prototype, "integrationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SyncDataDto.prototype, "limit", void 0);
class WordPressProductDto {
    id;
    name;
    slug;
    description;
    short_description;
    price;
    regular_price;
    sale_price;
    images;
    categories;
    tags;
    attributes;
    stock;
    status;
}
exports.WordPressProductDto = WordPressProductDto;
class WordPressIntegrationResponseDto {
    id;
    siteUrl;
    isActive;
    syncProducts;
    syncPosts;
    syncPages;
    productFields;
    lastSyncedAt;
    syncFrequency;
    createdAt;
}
exports.WordPressIntegrationResponseDto = WordPressIntegrationResponseDto;
//# sourceMappingURL=wordpress.dto.js.map