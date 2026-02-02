import { PrismaService } from '../../shared/prisma.service';
import { WordPressService } from '../wordpress/wordpress.service';
import { ProcessMessageDto, AIProvider, SearchProductsDto } from './dto/ia.dto';
export declare class IAService {
    private readonly prisma;
    private readonly wordPressService;
    private readonly logger;
    private openai;
    private gemini;
    private ollamaUrl;
    constructor(prisma: PrismaService, wordPressService: WordPressService);
    searchProducts(dto: SearchProductsDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        price: number | null;
        tenantId: string;
        stock: number | null;
        url: string | null;
        category: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
    }[]>;
    processMessage(dto: ProcessMessageDto): Promise<{
        response: string;
        products: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            price: number | null;
            tenantId: string;
            stock: number | null;
            url: string | null;
            category: string;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
        }[];
        provider: AIProvider;
    }>;
    private callOpenAI;
    private callGemini;
    private callOllama;
    getConversationHistory(chatId: string, limit?: number): Promise<{
        role: string;
        content: string;
    }[]>;
    getTenantIAConfig(tenantId: string): Promise<{
        tenantId: string;
        hasOpenAI: boolean;
        hasGemini: boolean;
    }>;
}
