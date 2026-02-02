export declare class ConnectWordPressDto {
    siteUrl: string;
    username?: string;
    appPassword?: string;
    syncProducts?: boolean;
    syncPosts?: boolean;
    syncPages?: boolean;
    productFields?: string[];
}
export declare class ConfigureFieldsDto {
    integrationId: string;
    productFields: string[];
    syncProducts: boolean;
    syncPosts: boolean;
    syncPages: boolean;
    syncFrequency: number;
}
export declare class SyncDataDto {
    integrationId: string;
    limit?: number;
}
export declare class WordPressProductDto {
    id: number;
    name: string;
    slug: string;
    description?: string;
    short_description?: string;
    price?: number;
    regular_price?: number;
    sale_price?: number;
    images?: Array<{
        src: string;
        alt: string;
    }>;
    categories?: Array<{
        name: string;
        slug: string;
    }>;
    tags?: Array<{
        name: string;
        slug: string;
    }>;
    attributes?: Record<string, any>;
    stock?: number;
    status: string;
}
export declare class WordPressIntegrationResponseDto {
    id: string;
    siteUrl: string;
    isActive: boolean;
    syncProducts: boolean;
    syncPosts: boolean;
    syncPages: boolean;
    productFields: string[];
    lastSyncedAt?: Date;
    syncFrequency: number;
    createdAt: Date;
}
