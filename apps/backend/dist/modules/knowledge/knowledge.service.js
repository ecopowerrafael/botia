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
var KnowledgeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma.service");
const puppeteer = __importStar(require("puppeteer"));
const cheerio = __importStar(require("cheerio"));
const sync_1 = require("csv-parse/sync");
const fs = __importStar(require("fs"));
let KnowledgeService = KnowledgeService_1 = class KnowledgeService {
    prisma;
    logger = new common_1.Logger(KnowledgeService_1.name);
    browser;
    constructor(prisma) {
        this.prisma = prisma;
        this.initBrowser();
    }
    async initBrowser() {
        try {
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
            this.logger.log('Puppeteer browser initialized');
        }
        catch (error) {
            this.logger.warn('Failed to initialize Puppeteer, web scraping disabled');
        }
    }
    async scrapeUrl(dto) {
        const { tenantId, url, selector = '.product', nameSelector = '.name', descriptionSelector = '.description', priceSelector = '.price', urlSelector = 'a', category, } = dto;
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });
        if (!tenant) {
            throw new common_1.HttpException('Tenant not found', common_1.HttpStatus.NOT_FOUND);
        }
        try {
            const response = await fetch(url);
            const html = await response.text();
            const $ = cheerio.load(html);
            const products = [];
            $(selector).each((index, element) => {
                const $element = $(element);
                const product = {
                    name: $element.find(nameSelector).text().trim() ||
                        `Product ${index + 1}`,
                    category: category || 'Geral',
                    price: this.parsePrice($element.find(priceSelector).text().trim()) || undefined,
                    url: $element.find(urlSelector).attr('href') || url,
                    metadata: {
                        description: $element.find(descriptionSelector).text().trim(),
                        scraped_at: new Date().toISOString(),
                        scraped_from: url,
                    },
                };
                products.push(product);
            });
            if (products.length === 0) {
                throw new common_1.HttpException('No products found with the provided selectors', common_1.HttpStatus.BAD_REQUEST);
            }
            const savedProducts = await Promise.all(products.map((product) => this.prisma.product.create({
                data: {
                    tenantId,
                    name: product.name,
                    category: product.category || 'Geral',
                    price: product.price,
                    url: product.url,
                    metadata: product.metadata,
                },
            })));
            this.logger.log(`Scraped ${savedProducts.length} products from ${url}`);
            return {
                success: true,
                count: savedProducts.length,
                products: savedProducts,
            };
        }
        catch (error) {
            this.logger.error(`Error scraping URL ${url}: ${error.message}`);
            throw new common_1.HttpException(`Failed to scrape URL: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async scrapeDynamicUrl(dto) {
        if (!this.browser) {
            throw new common_1.HttpException('Puppeteer not available', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        const { tenantId, url, selector = '.product', nameSelector = '.name', priceSelector = '.price', category, } = dto;
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });
        if (!tenant) {
            throw new common_1.HttpException('Tenant not found', common_1.HttpStatus.NOT_FOUND);
        }
        let page;
        try {
            page = await this.browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2' });
            const products = await page.evaluate((sel, nameSel, priceSel) => {
                const elements = document.querySelectorAll(sel);
                const data = [];
                elements.forEach((el) => {
                    const name = el.querySelector(nameSel)?.textContent?.trim() || '';
                    const price = el.querySelector(priceSel)?.textContent?.trim() || '';
                    if (name) {
                        data.push({ name, price });
                    }
                });
                return data;
            }, selector, nameSelector, priceSelector);
            const savedProducts = await Promise.all(products.map((product) => this.prisma.product.create({
                data: {
                    tenantId,
                    name: product.name,
                    category: category || 'Geral',
                    price: this.parsePrice(product.price),
                    url,
                    metadata: {
                        scraped_at: new Date().toISOString(),
                        scraped_from: url,
                    },
                },
            })));
            this.logger.log(`Scraped ${savedProducts.length} products from ${url} (dynamic)`);
            return {
                success: true,
                count: savedProducts.length,
                products: savedProducts,
            };
        }
        catch (error) {
            this.logger.error(`Error scraping dynamic URL ${url}: ${error.message}`);
            throw new common_1.HttpException(`Failed to scrape dynamic URL: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        finally {
            if (page) {
                await page.close();
            }
        }
    }
    async uploadCsv(tenantId, filePath, dto) {
        const { category, updateMode = 'append' } = dto;
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });
        if (!tenant) {
            throw new common_1.HttpException('Tenant not found', common_1.HttpStatus.NOT_FOUND);
        }
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const records = (0, sync_1.parse)(fileContent, {
                columns: true,
                skip_empty_lines: true,
            });
            if (updateMode === 'replace' && category) {
                await this.prisma.product.deleteMany({
                    where: { tenantId, category },
                });
            }
            const savedProducts = await Promise.all(records.map((record) => this.prisma.product.create({
                data: {
                    tenantId,
                    name: record.name || record.product_name || 'Produto sem nome',
                    category: category || record.category || 'Geral',
                    price: this.parsePrice(record.price),
                    url: record.url || record.product_url,
                    stock: record.stock ? parseInt(record.stock) : null,
                    metadata: {
                        ...record,
                        uploaded_at: new Date().toISOString(),
                    },
                },
            })));
            fs.unlinkSync(filePath);
            this.logger.log(`Uploaded ${savedProducts.length} products from CSV for tenant ${tenantId}`);
            return {
                success: true,
                count: savedProducts.length,
                products: savedProducts,
            };
        }
        catch (error) {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            this.logger.error(`Error uploading CSV: ${error.message}`);
            throw new common_1.HttpException(`Failed to upload CSV: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async listProducts(tenantId, category, limit = 50, offset = 0) {
        return this.prisma.product.findMany({
            where: {
                tenantId,
                ...(category && { category }),
            },
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
        });
    }
    async countProducts(tenantId, category) {
        return this.prisma.product.count({
            where: {
                tenantId,
                ...(category && { category }),
            },
        });
    }
    async searchProducts(tenantId, query, limit = 10) {
        return this.prisma.product.findMany({
            where: {
                tenantId,
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { category: { contains: query, mode: 'insensitive' } },
                ],
            },
            take: limit,
        });
    }
    async deleteProduct(tenantId, productId) {
        const product = await this.prisma.product.findFirst({
            where: { id: productId, tenantId },
        });
        if (!product) {
            throw new common_1.HttpException('Product not found', common_1.HttpStatus.NOT_FOUND);
        }
        await this.prisma.product.delete({ where: { id: productId } });
        return { success: true, message: 'Product deleted' };
    }
    async deleteProductsByCategory(tenantId, category) {
        const result = await this.prisma.product.deleteMany({
            where: { tenantId, category },
        });
        return {
            success: true,
            deletedCount: result.count,
        };
    }
    parsePrice(priceStr) {
        if (!priceStr)
            return undefined;
        const cleaned = priceStr
            .replace(/[^\d,.-]/g, '')
            .replace(/\./g, '')
            .replace(/,/, '.');
        const price = parseFloat(cleaned);
        return isNaN(price) ? undefined : price;
    }
};
exports.KnowledgeService = KnowledgeService;
exports.KnowledgeService = KnowledgeService = KnowledgeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], KnowledgeService);
//# sourceMappingURL=knowledge.service.js.map