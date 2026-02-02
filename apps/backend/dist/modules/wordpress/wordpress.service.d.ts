import { PrismaService } from '../../shared/prisma.service';
import { ConnectWordPressDto, ConfigureFieldsDto, SyncDataDto } from './dto/wordpress.dto';
export declare class WordPressService {
    private readonly prisma;
    private readonly logger;
    private wpClients;
    constructor(prisma: PrismaService);
    connectWordPress(tenantId: string, dto: ConnectWordPressDto): Promise<{
        success: boolean;
        integration: {
            id: string;
            siteUrl: string;
            isActive: boolean;
            syncProducts: boolean;
            lastSyncedAt: Date | null;
        };
    }>;
    configureFields(tenantId: string, dto: ConfigureFieldsDto): Promise<{
        success: boolean;
        fields: any;
        sync: {
            products: boolean;
            posts: boolean;
            pages: boolean;
        };
    }>;
    syncData(tenantId: string, dto: SyncDataDto): Promise<{
        success: boolean;
        stats: {
            products: number;
            posts: number;
            pages: number;
            errors: number;
        };
        message: string;
    }>;
    private saveWordPressProduct;
    getProductsForAIContext(tenantId: string, query: string, limit?: number): Promise<{
        name: string;
        price: number | null;
        description: string | null;
        categories: any;
    }[]>;
    listIntegrations(tenantId: string): Promise<{
        id: string;
        createdAt: Date;
        siteUrl: string;
        syncProducts: boolean;
        syncPosts: boolean;
        syncPages: boolean;
        isActive: boolean;
        lastSyncedAt: Date | null;
    }[]>;
    getIntegration(integrationId: string, tenantId: string): Promise<{
        productFields: any;
        id: string;
        createdAt: Date;
        siteUrl: string;
        syncProducts: boolean;
        syncPosts: boolean;
        syncPages: boolean;
        syncFrequency: number;
        isActive: boolean;
        lastSyncedAt: Date | null;
    }>;
    disableIntegration(integrationId: string, tenantId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private getApiUrl;
    private createClient;
}
