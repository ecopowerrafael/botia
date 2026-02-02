export declare class ScrapeUrlDto {
    tenantId: string;
    url: string;
    selector?: string;
    nameSelector?: string;
    descriptionSelector?: string;
    priceSelector?: string;
    urlSelector?: string;
    category?: string;
    scheduleCron?: string;
}
export declare class ScheduleScrapeDto {
    tenantId: string;
    jobId: string;
    cronExpression?: string;
}
export declare class UploadCsvDto {
    tenantId: string;
    category?: string;
    updateMode?: 'replace' | 'append';
}
export declare class CsvProductDto {
    name: string;
    category?: string;
    price?: number;
    url?: string;
    stock?: number;
    metadata?: Record<string, any>;
}
