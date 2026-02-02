"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path = __importStar(require("path"));
const knowledge_service_1 = require("./knowledge.service");
const knowledge_dto_1 = require("./dto/knowledge.dto");
let KnowledgeController = class KnowledgeController {
    knowledgeService;
    constructor(knowledgeService) {
        this.knowledgeService = knowledgeService;
    }
    async scrapeUrl(dto) {
        return this.knowledgeService.scrapeUrl(dto);
    }
    async scrapeDynamicUrl(dto) {
        return this.knowledgeService.scrapeDynamicUrl(dto);
    }
    async uploadCsv(file, dto) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        return this.knowledgeService.uploadCsv(dto.tenantId, file.path, dto);
    }
    async listProducts(tenantId, category, limit, offset) {
        const limitNum = limit ? parseInt(limit) : 50;
        const offsetNum = offset ? parseInt(offset) : 0;
        const [products, total] = await Promise.all([
            this.knowledgeService.listProducts(tenantId, category, limitNum, offsetNum),
            this.knowledgeService.countProducts(tenantId, category),
        ]);
        return {
            products,
            total,
            limit: limitNum,
            offset: offsetNum,
            hasMore: offsetNum + limitNum < total,
        };
    }
    async searchProducts(tenantId, query, limit) {
        if (!query) {
            throw new common_1.BadRequestException('Search query is required');
        }
        const limitNum = limit ? parseInt(limit) : 10;
        return this.knowledgeService.searchProducts(tenantId, query, limitNum);
    }
    async deleteProduct(tenantId, productId) {
        return this.knowledgeService.deleteProduct(tenantId, productId);
    }
    async deleteProductsByCategory(tenantId, category) {
        return this.knowledgeService.deleteProductsByCategory(tenantId, category);
    }
    async getStats(tenantId) {
        const total = await this.knowledgeService.countProducts(tenantId);
        return {
            tenantId,
            total,
        };
    }
};
exports.KnowledgeController = KnowledgeController;
__decorate([
    (0, common_1.Post)('scrape'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [knowledge_dto_1.ScrapeUrlDto]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "scrapeUrl", null);
__decorate([
    (0, common_1.Post)('scrape-dynamic'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [knowledge_dto_1.ScrapeUrlDto]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "scrapeDynamicUrl", null);
__decorate([
    (0, common_1.Post)('upload-csv'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './tmp',
            filename: (req, file, cb) => {
                cb(null, `${Date.now()}_${file.originalname}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            if (path.extname(file.originalname).toLowerCase() !== '.csv') {
                cb(new common_1.BadRequestException('Only CSV files are allowed'), false);
            }
            else {
                cb(null, true);
            }
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, knowledge_dto_1.UploadCsvDto]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "uploadCsv", null);
__decorate([
    (0, common_1.Get)('products/:tenantId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "listProducts", null);
__decorate([
    (0, common_1.Get)('search/:tenantId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "searchProducts", null);
__decorate([
    (0, common_1.Delete)('product/:tenantId/:productId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "deleteProduct", null);
__decorate([
    (0, common_1.Delete)('category/:tenantId/:category'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "deleteProductsByCategory", null);
__decorate([
    (0, common_1.Get)('stats/:tenantId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "getStats", null);
exports.KnowledgeController = KnowledgeController = __decorate([
    (0, common_1.Controller)('knowledge'),
    __metadata("design:paramtypes", [knowledge_service_1.KnowledgeService])
], KnowledgeController);
//# sourceMappingURL=knowledge.controller.js.map