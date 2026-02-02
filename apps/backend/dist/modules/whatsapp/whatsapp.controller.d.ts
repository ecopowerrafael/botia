import { WhatsAppService } from './whatsapp.service';
import { CreateInstanceDto, SendMessageDto, WebhookPayloadDto, ConnectInstanceDto, DisconnectInstanceDto } from './dto/whatsapp.dto';
export declare class WhatsAppController {
    private readonly whatsappService;
    private readonly logger;
    constructor(whatsappService: WhatsAppService);
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
    sendMessage(dto: SendMessageDto): Promise<{
        success: boolean;
        messageId: any;
    }>;
    receiveWebhook(payload: WebhookPayloadDto): Promise<{
        success: boolean;
    }>;
}
