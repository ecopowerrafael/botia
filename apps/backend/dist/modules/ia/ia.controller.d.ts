import { IAService } from './ia.service';
import { ProcessMessageDto, SearchProductsDto } from './dto/ia.dto';
export declare class IAController {
    private readonly iaService;
    constructor(iaService: IAService);
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
        provider: import("./dto/ia.dto").AIProvider;
    }>;
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
    getConversationHistory(chatId: string): Promise<{
        role: string;
        content: string;
    }[]>;
    getTenantIAConfig(tenantId: string): Promise<{
        tenantId: string;
        hasOpenAI: boolean;
        hasGemini: boolean;
    }>;
}
