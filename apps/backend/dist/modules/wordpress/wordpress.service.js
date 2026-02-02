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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var WordPressService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WordPressService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma.service");
const axios_1 = __importDefault(require("axios"));
let WordPressService = WordPressService_1 = class WordPressService {
    prisma;
    logger = new common_1.Logger(WordPressService_1.name);
    wpClients = new Map();
    constructor(prisma) {
        this.prisma = prisma;
    }
    async connectWordPress(tenantId, dto) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });
        if (!tenant) {
            throw new common_1.HttpException('Tenant not found', common_1.HttpStatus.NOT_FOUND);
        }
        try {
            const apiUrl = this.getApiUrl(dto.siteUrl);
            const client = this.createClient(apiUrl, dto.username, dto.appPassword);
            await client.get('/');
            this.logger.log(`✓ Connected to WordPress: ${dto.siteUrl}`);
        }
        catch (error) {
            this.logger.error(`✗ Failed to connect to WordPress: ${error.message}`);
            throw new common_1.HttpException(`Failed to connect to WordPress: ${error.message}`, common_1.HttpStatus.BAD_REQUEST);
        }
        const productFields = dto.productFields || [
            'id',
            'name',
            'price',
            'description',
            'images',
            'categories',
        ];
        const integration = await this.prisma.wordPressIntegration.upsert({
            where: {
                tenantId_siteUrl: {
                    tenantId,
                    siteUrl: dto.siteUrl,
                },
            },
            update: {
                apiUrl: this.getApiUrl(dto.siteUrl),
                username: dto.username,
                appPassword: dto.appPassword,
                syncProducts: dto.syncProducts ?? true,
                syncPosts: dto.syncPosts ?? false,
                syncPages: dto.syncPages ?? false,
                productFields: JSON.stringify(productFields),
            },
            create: {
                tenantId,
                siteUrl: dto.siteUrl,
                apiUrl: this.getApiUrl(dto.siteUrl),
                username: dto.username,
                appPassword: dto.appPassword,
                syncProducts: dto.syncProducts ?? true,
                syncPosts: dto.syncPosts ?? false,
                syncPages: dto.syncPages ?? false,
                productFields: JSON.stringify(productFields),
            },
        });
        return {
            success: true,
            integration: {
                id: integration.id,
                siteUrl: integration.siteUrl,
                isActive: integration.isActive,
                syncProducts: integration.syncProducts,
                lastSyncedAt: integration.lastSyncedAt,
            },
        };
    }
    async configureFields(tenantId, dto) {
        const integration = await this.prisma.wordPressIntegration.findFirst({
            where: { id: dto.integrationId, tenantId },
        });
        if (!integration) {
            throw new common_1.HttpException('WordPress integration not found', common_1.HttpStatus.NOT_FOUND);
        }
        const validFields = [
            'id',
            'name',
            'slug',
            'description',
            'price',
            'regular_price',
            'sale_price',
            'images',
            'categories',
            'tags',
            'attributes',
            'stock',
            'status',
        ];
        const invalidFields = dto.productFields.filter((f) => !validFields.includes(f));
        if (invalidFields.length > 0) {
            throw new common_1.HttpException(`Invalid fields: ${invalidFields.join(', ')}. Valid fields: ${validFields.join(', ')}`, common_1.HttpStatus.BAD_REQUEST);
        }
        const updated = await this.prisma.wordPressIntegration.update({
            where: { id: dto.integrationId },
            data: {
                productFields: JSON.stringify(dto.productFields),
                syncProducts: dto.syncProducts,
                syncPosts: dto.syncPosts,
                syncPages: dto.syncPages,
                syncFrequency: dto.syncFrequency,
            },
        });
        return {
            success: true,
            fields: JSON.parse(updated.productFields),
            sync: {
                products: updated.syncProducts,
                posts: updated.syncPosts,
                pages: updated.syncPages,
            },
        };
    }
    async syncData(tenantId, dto) {
        const integration = await this.prisma.wordPressIntegration.findFirst({
            where: { id: dto.integrationId, tenantId },
        });
        if (!integration) {
            throw new common_1.HttpException('WordPress integration not found', common_1.HttpStatus.NOT_FOUND);
        }
        if (!integration.isActive) {
            throw new common_1.HttpException('WordPress integration is inactive', common_1.HttpStatus.BAD_REQUEST);
        }
        const stats = {
            products: 0,
            posts: 0,
            pages: 0,
            errors: 0,
        };
        try {
            const client = this.createClient(integration.apiUrl, integration.username || undefined, integration.appPassword || undefined);
            if (integration.syncProducts) {
                const productFields = JSON.parse(integration.productFields);
                const limit = dto.limit || 100;
                try {
                    const response = await client.get('/products', {
                        params: {
                            per_page: Math.min(limit, 100),
                            orderby: 'date',
                            order: 'desc',
                        },
                    });
                    for (const wpProduct of response.data) {
                        try {
                            await this.saveWordPressProduct(tenantId, wpProduct, productFields);
                            stats.products++;
                        }
                        catch (error) {
                            this.logger.error(`Error saving product ${wpProduct.id}: ${error.message}`);
                            stats.errors++;
                        }
                    }
                }
                catch (error) {
                    this.logger.error(`Error fetching products: ${error.message}`);
                    stats.errors++;
                }
            }
            await this.prisma.wordPressIntegration.update({
                where: { id: dto.integrationId },
                data: { lastSyncedAt: new Date() },
            });
            return {
                success: true,
                stats,
                message: `Synced ${stats.products} products, ${stats.posts} posts, ${stats.pages} pages`,
            };
        }
        catch (error) {
            this.logger.error(`Sync error: ${error.message}`);
            throw new common_1.HttpException(`Sync failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async saveWordPressProduct(tenantId, wpProduct, selectedFields) {
        const product = {};
        if (selectedFields.includes('id'))
            product.id = wpProduct.id;
        if (selectedFields.includes('name'))
            product.name = wpProduct.name;
        if (selectedFields.includes('slug'))
            product.slug = wpProduct.slug;
        if (selectedFields.includes('description'))
            product.description = wpProduct.description || '';
        if (selectedFields.includes('price'))
            product.price = parseFloat(String(wpProduct.price || 0));
        if (selectedFields.includes('images'))
            product.images =
                wpProduct.images?.map((img) => img.src).join(',') || '';
        if (selectedFields.includes('categories'))
            product.categories =
                wpProduct.categories?.map((cat) => cat.name).join(',') || '';
        await this.prisma.wordPressProduct.upsert({
            where: {
                tenantId_wpProductId: {
                    tenantId,
                    wpProductId: wpProduct.id,
                },
            },
            update: {
                ...product,
                syncedAt: new Date(),
            },
            create: {
                tenantId,
                wpProductId: wpProduct.id,
                name: wpProduct.name,
                slug: wpProduct.slug,
                description: wpProduct.description,
                price: parseFloat(String(wpProduct.price || 0)),
                regularPrice: wpProduct.regular_price
                    ? parseFloat(String(wpProduct.regular_price))
                    : undefined,
                salePrice: wpProduct.sale_price
                    ? parseFloat(String(wpProduct.sale_price))
                    : undefined,
                image: wpProduct.images?.[0]?.src,
                images: wpProduct.images ? JSON.stringify(wpProduct.images) : undefined,
                categories: wpProduct.categories
                    ? JSON.stringify(wpProduct.categories)
                    : undefined,
                tags: wpProduct.tags ? JSON.stringify(wpProduct.tags) : undefined,
                attributes: wpProduct.attributes,
                stock: wpProduct.stock,
                status: wpProduct.status,
            },
        });
    }
    async getProductsForAIContext(tenantId, query, limit = 5) {
        const products = await this.prisma.wordPressProduct.findMany({
            where: {
                tenantId,
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { categories: { contains: query, mode: 'insensitive' } },
                ],
            },
            take: limit,
            orderBy: { syncedAt: 'desc' },
        });
        return products.map((p) => ({
            name: p.name,
            price: p.price,
            description: p.description,
            categories: p.categories ? JSON.parse(p.categories) : [],
        }));
    }
    async listIntegrations(tenantId) {
        return this.prisma.wordPressIntegration.findMany({
            where: { tenantId },
            select: {
                id: true,
                siteUrl: true,
                isActive: true,
                syncProducts: true,
                syncPosts: true,
                syncPages: true,
                lastSyncedAt: true,
                createdAt: true,
            },
        });
    }
    async getIntegration(integrationId, tenantId) {
        const integration = await this.prisma.wordPressIntegration.findFirst({
            where: { id: integrationId, tenantId },
            select: {
                id: true,
                siteUrl: true,
                isActive: true,
                syncProducts: true,
                syncPosts: true,
                syncPages: true,
                productFields: true,
                lastSyncedAt: true,
                syncFrequency: true,
                createdAt: true,
            },
        });
        if (!integration) {
            throw new common_1.HttpException('Integration not found', common_1.HttpStatus.NOT_FOUND);
        }
        return {
            ...integration,
            productFields: JSON.parse(integration.productFields),
        };
    }
    async disableIntegration(integrationId, tenantId) {
        const integration = await this.prisma.wordPressIntegration.findFirst({
            where: { id: integrationId, tenantId },
        });
        if (!integration) {
            throw new common_1.HttpException('Integration not found', common_1.HttpStatus.NOT_FOUND);
        }
        await this.prisma.wordPressIntegration.update({
            where: { id: integrationId },
            data: { isActive: false },
        });
        return { success: true, message: 'Integration disabled' };
    }
    getApiUrl(siteUrl) {
        const cleanUrl = siteUrl.replace(/\/$/, '');
        return `${cleanUrl}/wp-json/wp/v2`;
    }
    createClient(apiUrl, username, password) {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'WhatsApp-Bot/1.0',
        };
        if (username && password) {
            const auth = Buffer.from(`${username}:${password}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
        }
        return axios_1.default.create({
            baseURL: apiUrl,
            headers,
            timeout: 10000,
        });
    }
};
exports.WordPressService = WordPressService;
exports.WordPressService = WordPressService = WordPressService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WordPressService);
//# sourceMappingURL=wordpress.service.js.map