import { WordPressService } from './wordpress.service';
import { ConnectWordPressDto, ConfigureFieldsDto, SyncDataDto } from './dto/wordpress.dto';
export declare class WordPressController {
    private readonly wordPressService;
    constructor(wordPressService: WordPressService);
    connectWordPress(dto: ConnectWordPressDto & {
        tenantId: string;
    }): Promise<{
        success: boolean;
        integration: {
            id: string;
            siteUrl: string;
            isActive: boolean;
            syncProducts: boolean;
            lastSyncedAt: Date | null;
        };
    }>;
    configureFields(integrationId: string, dto: ConfigureFieldsDto & {
        tenantId: string;
    }): Promise<{
        success: boolean;
        fields: any;
        sync: {
            products: boolean;
            posts: boolean;
            pages: boolean;
        };
    }>;
    syncData(integrationId: string, dto: SyncDataDto & {
        tenantId: string;
    }): Promise<{
        success: boolean;
        stats: {
            products: number;
            posts: number;
            pages: number;
            errors: number;
        };
        message: string;
    }>;
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
}
