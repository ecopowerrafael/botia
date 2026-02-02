import { PrismaService } from '../../shared/prisma.service';
import { IAService } from '../ia/ia.service';
import { CreateInstanceDto, SendMessageDto, WebhookPayloadDto, ConnectInstanceDto, DisconnectInstanceDto } from './dto/whatsapp.dto';
export declare class WhatsAppService {
    private readonly prisma;
    private readonly iaService;
    private readonly logger;
    private evolutionApi;
    constructor(prisma: PrismaService, iaService: IAService);
    createInstance(dto: CreateInstanceDto): Promise<{
        instance: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            status: string;
            instanceKey: string;
        };
        qrcode: any;
        instanceKey: string;
    }>;
    connectInstance(dto: ConnectInstanceDto): Promise<{
        status: string;
        instance: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            status: string;
            instanceKey: string;
        };
        message?: undefined;
    } | {
        status: string;
        message: string;
        instance?: undefined;
    }>;
    disconnectInstance(dto: DisconnectInstanceDto): Promise<{
        status: string;
    }>;
    sendMessage(dto: SendMessageDto): Promise<{
        success: boolean;
        messageId: any;
    }>;
    processWebhook(payload: WebhookPayloadDto): Promise<void>;
    private handleIncomingMessage;
    private handleMessageStatus;
    listInstances(tenantId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: string;
        instanceKey: string;
    }[]>;
    getInstance(tenantId: string, instanceKey: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: string;
        instanceKey: string;
    } | null>;
}
