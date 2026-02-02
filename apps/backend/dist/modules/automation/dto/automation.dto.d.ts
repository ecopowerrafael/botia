export declare enum CampaignType {
    DRIP = "drip",
    MASS = "mass"
}
export declare enum CampaignStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    PAUSED = "paused",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare class DripStep {
    delay: number;
    message: string;
    mediaUrl?: string;
}
export declare class CreateDripCampaignDto {
    tenantId: string;
    name: string;
    description?: string;
    instanceKey: string;
    steps: DripStep[];
    contactId?: string;
    contactPhones?: string[];
    startDate?: string;
    repeat?: boolean;
}
export declare class CreateMassCampaignDto {
    tenantId: string;
    name: string;
    description?: string;
    instanceKey: string;
    message: string;
    mediaUrl?: string;
    contactPhones: string[];
    delayBetweenMessages?: number;
    randomDelayMax?: number;
    variables?: Record<string, string>;
}
export declare class UpdateCampaignStatusDto {
    campaignId: string;
    status: CampaignStatus;
}
export declare class GetCampaignStatsDto {
    campaignId: string;
    tenantId: string;
}
export declare class PersonalizedMessage {
    phoneNumber: string;
    message: string;
    variables?: Record<string, string>;
}
