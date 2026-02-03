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
            id: any;
            siteUrl: any;
            isActive: any;
            syncProducts: any;
            lastSyncedAt: any;
        };
    }>;
    configureFields(tenantId: string, dto: ConfigureFieldsDto): Promise<{
        success: boolean;
        fields: any;
        sync: {
            products: any;
            posts: any;
            pages: any;
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
    getProductsForAIContext(tenantId: string, query: string, limit?: number): Promise<any>;
    listIntegrations(tenantId: string): Promise<any>;
    getIntegration(integrationId: string, tenantId: string): Promise<any>;
    disableIntegration(integrationId: string, tenantId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private getApiUrl;
    private createClient;
}
