import { KnowledgeService } from './knowledge.service';
import { ScrapeUrlDto, UploadCsvDto } from './dto/knowledge.dto';
export declare class KnowledgeController {
    private readonly knowledgeService;
    constructor(knowledgeService: KnowledgeService);
    scrapeUrl(dto: ScrapeUrlDto): Promise<{
        success: boolean;
        count: number;
        products: any[];
    }>;
    scrapeDynamicUrl(dto: ScrapeUrlDto): Promise<{
        success: boolean;
        count: number;
        products: any[];
    }>;
    uploadCsv(file: any, dto: UploadCsvDto): Promise<{
        success: boolean;
        count: number;
        products: any[];
    }>;
    listProducts(tenantId: string, category?: string, limit?: string, offset?: string): Promise<{
        products: any;
        total: any;
        limit: number;
        offset: number;
        hasMore: boolean;
    }>;
    searchProducts(tenantId: string, query?: string, limit?: string): Promise<any>;
    deleteProduct(tenantId: string, productId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteProductsByCategory(tenantId: string, category: string): Promise<{
        success: boolean;
        deletedCount: any;
    }>;
    getStats(tenantId: string): Promise<{
        tenantId: string;
        total: any;
    }>;
}
