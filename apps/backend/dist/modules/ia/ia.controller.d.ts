import { IAService } from './ia.service';
import { ProcessMessageDto, SearchProductsDto } from './dto/ia.dto';
export declare class IAController {
    private readonly iaService;
    constructor(iaService: IAService);
    processMessage(dto: ProcessMessageDto): Promise<{
        response: string;
        products: any;
        provider: import("./dto/ia.dto").AIProvider;
    }>;
    searchProducts(dto: SearchProductsDto): Promise<any>;
    getConversationHistory(chatId: string): Promise<any>;
    getTenantIAConfig(tenantId: string): Promise<{
        tenantId: string;
        hasOpenAI: any;
        hasGemini: any;
    }>;
}
