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
            id: any;
            siteUrl: any;
            isActive: any;
            syncProducts: any;
            lastSyncedAt: any;
        };
    }>;
    configureFields(integrationId: string, dto: ConfigureFieldsDto & {
        tenantId: string;
    }): Promise<{
        success: boolean;
        fields: any;
        sync: {
            products: any;
            posts: any;
            pages: any;
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
    listIntegrations(tenantId: string): Promise<any>;
    getIntegration(integrationId: string, tenantId: string): Promise<any>;
    disableIntegration(integrationId: string, tenantId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
