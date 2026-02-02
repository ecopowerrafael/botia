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
        schedule: {
            id: string;
            name: string;
            createdAt: Date;
            tenantId: string;
            status: import("@prisma/client").$Enums.ScheduleStatus;
            type: import("@prisma/client").$Enums.ScheduleType;
            target: string;
            payload: import("@prisma/client/runtime/client").JsonValue;
            runAt: Date;
        };
    }>;
    createMassCampaign(dto: CreateMassCampaignDto): Promise<{
        success: boolean;
        schedule: {
            id: string;
            name: string;
            createdAt: Date;
            tenantId: string;
            status: import("@prisma/client").$Enums.ScheduleStatus;
            type: import("@prisma/client").$Enums.ScheduleType;
            target: string;
            payload: import("@prisma/client/runtime/client").JsonValue;
            runAt: Date;
        };
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
    listCampaigns(tenantId: string, type?: string, status?: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        tenantId: string;
        status: import("@prisma/client").$Enums.ScheduleStatus;
        type: import("@prisma/client").$Enums.ScheduleType;
        target: string;
        payload: import("@prisma/client/runtime/client").JsonValue;
        runAt: Date;
    }[]>;
    getCampaign(scheduleId: string, tenantId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        tenantId: string;
        status: import("@prisma/client").$Enums.ScheduleStatus;
        type: import("@prisma/client").$Enums.ScheduleType;
        target: string;
        payload: import("@prisma/client/runtime/client").JsonValue;
        runAt: Date;
    }>;
    getCampaignStats(scheduleId: string, tenantId: string): Promise<{
        campaignId: string;
        type: import("@prisma/client").$Enums.ScheduleType;
        name: string;
        status: import("@prisma/client").$Enums.ScheduleStatus;
        totalContacts: any;
        sentCount: any;
        failedCount: any;
        successRate: string;
        createdAt: Date;
    }>;
}
