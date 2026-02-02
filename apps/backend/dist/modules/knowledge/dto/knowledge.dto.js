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
exports.CsvProductDto = exports.UploadCsvDto = exports.ScheduleScrapeDto = exports.ScrapeUrlDto = void 0;
const class_validator_1 = require("class-validator");
class ScrapeUrlDto {
    tenantId;
    url;
    selector;
    nameSelector;
    descriptionSelector;
    priceSelector;
    urlSelector;
    category;
    scheduleCron;
}
exports.ScrapeUrlDto = ScrapeUrlDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScrapeUrlDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], ScrapeUrlDto.prototype, "url", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ScrapeUrlDto.prototype, "selector", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ScrapeUrlDto.prototype, "nameSelector", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ScrapeUrlDto.prototype, "descriptionSelector", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ScrapeUrlDto.prototype, "priceSelector", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ScrapeUrlDto.prototype, "urlSelector", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ScrapeUrlDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ScrapeUrlDto.prototype, "scheduleCron", void 0);
class ScheduleScrapeDto {
    tenantId;
    jobId;
    cronExpression;
}
exports.ScheduleScrapeDto = ScheduleScrapeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScheduleScrapeDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScheduleScrapeDto.prototype, "jobId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ScheduleScrapeDto.prototype, "cronExpression", void 0);
class UploadCsvDto {
    tenantId;
    category;
    updateMode;
}
exports.UploadCsvDto = UploadCsvDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadCsvDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UploadCsvDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UploadCsvDto.prototype, "updateMode", void 0);
class CsvProductDto {
    name;
    category;
    price;
    url;
    stock;
    metadata;
}
exports.CsvProductDto = CsvProductDto;
//# sourceMappingURL=knowledge.dto.js.map