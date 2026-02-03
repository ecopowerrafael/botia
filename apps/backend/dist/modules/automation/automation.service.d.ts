import { PrismaService } from '../../shared/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { CreateDripCampaignDto, CreateMassCampaignDto } from './dto/automation.dto';
export declare class AutomationService {
    private readonly prisma;
    private readonly whatsappService;
    private readonly logger;
    private dripCampaigns;
    constructor(prisma: PrismaService, whatsappService: WhatsAppService);
    createDripCampaign(dto: CreateDripCampaignDto): Promise<{
        success: boolean;
        schedule: any;
    }>;
    createMassCampaign(dto: CreateMassCampaignDto): Promise<{
        success: boolean;
        schedule: any;
        totalContacts: number;
    }>;
    private scheduleDripCampaign;
    private processDripStep;
    private processMassCampaign;
    private personalizeMessage;
    pauseCampaign(scheduleId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    resumeCampaign(scheduleId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteCampaign(scheduleId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    listCampaigns(tenantId: string, type?: string, status?: string): Promise<any>;
    getCampaign(scheduleId: string, tenantId: string): Promise<any>;
    getCampaignStats(scheduleId: string, tenantId: string): Promise<{
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
}
