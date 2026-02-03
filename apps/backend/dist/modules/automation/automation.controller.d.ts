import { AutomationService } from './automation.service';
import { CreateDripCampaignDto, CreateMassCampaignDto } from './dto/automation.dto';
export declare class AutomationController {
    private readonly automationService;
    constructor(automationService: AutomationService);
    createDripCampaign(dto: CreateDripCampaignDto): Promise<{
        success: boolean;
        schedule: any;
    }>;
    createMassCampaign(dto: CreateMassCampaignDto): Promise<{
        success: boolean;
        schedule: any;
        totalContacts: number;
    }>;
    listCampaigns(tenantId: string, type?: string, status?: string): Promise<any>;
    getCampaign(campaignId: string, tenantId: string): Promise<any>;
    getCampaignStats(campaignId: string, tenantId: string): Promise<{
        campaignId: string;
        type: any;
        name: any;
        status: any;
        totalContacts: any;
        sentCount: any;
        failedCount: any;
        successRate: string;
        createdAt: any;
    }>;
    pauseCampaign(campaignId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    resumeCampaign(campaignId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteCampaign(campaignId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
