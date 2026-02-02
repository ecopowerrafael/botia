import { AutomationService } from './automation.service';
import { CreateDripCampaignDto, CreateMassCampaignDto } from './dto/automation.dto';
export declare class AutomationController {
    private readonly automationService;
    constructor(automationService: AutomationService);
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
    getCampaign(campaignId: string, tenantId: string): Promise<{
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
    getCampaignStats(campaignId: string, tenantId: string): Promise<{
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
