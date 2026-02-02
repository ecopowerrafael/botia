import { KnowledgeService } from './knowledge.service';
import { ScrapeUrlDto, UploadCsvDto } from './dto/knowledge.dto';
export declare class KnowledgeController {
    private readonly knowledgeService;
    constructor(knowledgeService: KnowledgeService);
    scrapeUrl(dto: ScrapeUrlDto): Promise<{
        success: boolean;
        count: number;
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
    }>;
    scrapeDynamicUrl(dto: ScrapeUrlDto): Promise<{
        success: boolean;
        count: number;
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
    }>;
    uploadCsv(file: any, dto: UploadCsvDto): Promise<{
        success: boolean;
        count: number;
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
    }>;
    listProducts(tenantId: string, category?: string, limit?: string, offset?: string): Promise<{
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
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    }>;
    searchProducts(tenantId: string, query?: string, limit?: string): Promise<{
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
    deleteProduct(tenantId: string, productId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteProductsByCategory(tenantId: string, category: string): Promise<{
        success: boolean;
        deletedCount: number;
    }>;
    getStats(tenantId: string): Promise<{
        tenantId: string;
        total: number;
    }>;
}
