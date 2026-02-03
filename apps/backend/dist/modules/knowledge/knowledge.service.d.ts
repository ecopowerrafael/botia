import { PrismaService } from '../../shared/prisma.service';
import { ScrapeUrlDto, UploadCsvDto } from './dto/knowledge.dto';
export declare class KnowledgeService {
    private readonly prisma;
    private readonly logger;
    private browser;
    constructor(prisma: PrismaService);
    private initBrowser;
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
    uploadCsv(tenantId: string, filePath: string, dto: UploadCsvDto): Promise<{
        success: boolean;
        count: number;
        products: any[];
    }>;
    listProducts(tenantId: string, category?: string, limit?: number, offset?: number): Promise<any>;
    countProducts(tenantId: string, category?: string): Promise<any>;
    searchProducts(tenantId: string, query: string, limit?: number): Promise<any>;
    deleteProduct(tenantId: string, productId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteProductsByCategory(tenantId: string, category: string): Promise<{
        success: boolean;
        deletedCount: any;
    }>;
    private parsePrice;
}
