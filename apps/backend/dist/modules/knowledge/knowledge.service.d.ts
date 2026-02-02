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
    uploadCsv(tenantId: string, filePath: string, dto: UploadCsvDto): Promise<{
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
    listProducts(tenantId: string, category?: string, limit?: number, offset?: number): Promise<{
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
    countProducts(tenantId: string, category?: string): Promise<number>;
    searchProducts(tenantId: string, query: string, limit?: number): Promise<{
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
    private parsePrice;
}
