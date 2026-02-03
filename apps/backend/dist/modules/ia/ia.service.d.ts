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
    searchProducts(dto: SearchProductsDto): Promise<any>;
    processMessage(dto: ProcessMessageDto): Promise<{
        response: string;
        products: any;
        provider: AIProvider;
    }>;
    private callOpenAI;
    private callGemini;
    private callOllama;
    getConversationHistory(chatId: string, limit?: number): Promise<any>;
    getTenantIAConfig(tenantId: string): Promise<{
        tenantId: string;
        hasOpenAI: any;
        hasGemini: any;
    }>;
}
