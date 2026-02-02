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
var IAService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IAService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma.service");
const wordpress_service_1 = require("../wordpress/wordpress.service");
const openai_1 = __importDefault(require("openai"));
const generative_ai_1 = require("@google/generative-ai");
const ia_dto_1 = require("./dto/ia.dto");
const axios_1 = __importDefault(require("axios"));
let IAService = IAService_1 = class IAService {
    prisma;
    wordPressService;
    logger = new common_1.Logger(IAService_1.name);
    openai;
    gemini;
    ollamaUrl;
    constructor(prisma, wordPressService) {
        this.prisma = prisma;
        this.wordPressService = wordPressService;
        if (process.env.OPENAI_API_KEY) {
            this.openai = new openai_1.default({
                apiKey: process.env.OPENAI_API_KEY,
            });
        }
        if (process.env.GEMINI_API_KEY) {
            this.gemini = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        }
        this.ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
        this.logger.log(`✓ Ollama available at ${this.ollamaUrl}`);
    }
    async searchProducts(dto) {
        const { tenantId, query, category, limit = '5' } = dto;
        const products = await this.prisma.product.findMany({
            where: {
                tenantId,
                ...(category && { category }),
            },
            take: parseInt(limit),
        });
        return products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase()));
    }
    async processMessage(dto) {
        const { tenantId, chatId, userMessage, provider = ia_dto_1.AIProvider.OPENAI, systemPrompt, conversationHistory = [], } = dto;
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { apiKeys: true },
        });
        if (!tenant) {
            throw new common_1.HttpException('Tenant not found', common_1.HttpStatus.NOT_FOUND);
        }
        if (provider !== ia_dto_1.AIProvider.OLLAMA) {
            const apiKey = tenant.apiKeys.find((k) => k.type === provider.toUpperCase());
            if (!apiKey) {
                throw new common_1.HttpException(`API key for ${provider} not configured`, common_1.HttpStatus.BAD_REQUEST);
            }
        }
        const products = await this.searchProducts({
            tenantId,
            query: userMessage,
            limit: '3',
        });
        let wpContext = '';
        try {
            const wpProducts = await this.wordPressService.getProductsForAIContext(tenantId, userMessage, 3);
            if (wpProducts.length > 0) {
                wpContext = `\n\nProdutos do WordPress encontrados:\n${wpProducts
                    .map((p) => `- ${p.name} (R$ ${p.price}): ${p.description}`)
                    .join('\n')}`;
            }
        }
        catch (error) {
            this.logger.debug(`WordPress context not available: ${error.message}`);
        }
        const productContext = products.length > 0
            ? `\n\nProdutos do banco local:\n${products.map((p) => `- ${p.name} (${p.category}): ${p.url || 'sem link'}`).join('\n')}`
            : '';
        const systemMessage = `${systemPrompt || 'Você é um assistente de vendas prestativo e profissional.'} ${productContext}${wpContext}`;
        let response;
        if (provider === ia_dto_1.AIProvider.OPENAI) {
            response = await this.callOpenAI(userMessage, systemMessage, conversationHistory);
        }
        else if (provider === ia_dto_1.AIProvider.GEMINI) {
            response = await this.callGemini(userMessage, systemMessage, conversationHistory);
        }
        else if (provider === ia_dto_1.AIProvider.OLLAMA) {
            response = await this.callOllama(userMessage, systemMessage, conversationHistory);
        }
        else {
            throw new common_1.HttpException('Invalid provider', common_1.HttpStatus.BAD_REQUEST);
        }
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
        });
        if (chat) {
            await this.prisma.iAHistory.create({
                data: {
                    tenantId,
                    chatId,
                    prompt: userMessage,
                    response,
                    source: provider === ia_dto_1.AIProvider.OPENAI ? 'OPENAI' : 'GEMINI',
                },
            });
            await this.prisma.message.create({
                data: {
                    chatId,
                    sender: 'bot',
                    content: response,
                    type: 'BOT',
                },
            });
        }
        return {
            response,
            products,
            provider,
        };
    }
    async callOpenAI(userMessage, systemMessage, conversationHistory) {
        if (!this.openai) {
            throw new common_1.HttpException('OpenAI not configured', common_1.HttpStatus.BAD_REQUEST);
        }
        const messages = [
            ...conversationHistory,
            {
                role: 'user',
                content: userMessage,
            },
        ];
        const response = await this.openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: systemMessage,
                },
                ...messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                })),
            ],
            max_tokens: 500,
            temperature: 0.7,
        });
        return response.choices[0]?.message?.content || 'Sem resposta';
    }
    async callGemini(userMessage, systemMessage, conversationHistory) {
        if (!this.gemini) {
            throw new common_1.HttpException('Gemini not configured', common_1.HttpStatus.BAD_REQUEST);
        }
        const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
        const chat = model.startChat({
            history: conversationHistory.map((msg) => ({
                role: msg.role,
                parts: [{ text: msg.content }],
            })),
        });
        const result = await chat.sendMessage(userMessage);
        const text = result.response.text();
        return text || 'Sem resposta';
    }
    async callOllama(userMessage, systemMessage, conversationHistory) {
        try {
            const response = await axios_1.default.post(`${this.ollamaUrl}/api/chat`, {
                model: 'neural-chat',
                messages: [
                    {
                        role: 'system',
                        content: systemMessage,
                    },
                    ...conversationHistory.map((msg) => ({
                        role: msg.role,
                        content: msg.content,
                    })),
                    {
                        role: 'user',
                        content: userMessage,
                    },
                ],
                stream: false,
                options: {
                    temperature: 0.7,
                    top_k: 40,
                    top_p: 0.9,
                },
            });
            return response.data.message?.content || 'Sem resposta';
        }
        catch (error) {
            this.logger.error(`Ollama error: ${error.message}`);
            throw new common_1.HttpException(`Failed to get response from Ollama: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getConversationHistory(chatId, limit = 10) {
        const messages = await this.prisma.message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return messages.reverse().map((m) => ({
            role: m.type === 'BOT' ? 'assistant' : 'user',
            content: m.content,
        }));
    }
    async getTenantIAConfig(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { apiKeys: true },
        });
        if (!tenant) {
            throw new common_1.HttpException('Tenant not found', common_1.HttpStatus.NOT_FOUND);
        }
        return {
            tenantId,
            hasOpenAI: tenant.apiKeys.some((k) => k.type === 'OPENAI'),
            hasGemini: tenant.apiKeys.some((k) => k.type === 'GEMINI'),
        };
    }
};
exports.IAService = IAService;
exports.IAService = IAService = IAService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wordpress_service_1.WordPressService])
], IAService);
//# sourceMappingURL=ia.service.js.map