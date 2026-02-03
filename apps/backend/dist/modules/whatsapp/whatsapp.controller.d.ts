import { WhatsAppService } from './whatsapp.service';
import { CreateInstanceDto, SendMessageDto, WebhookPayloadDto, ConnectInstanceDto, DisconnectInstanceDto } from './dto/whatsapp.dto';
export declare class WhatsAppController {
    private readonly whatsappService;
    private readonly logger;
    constructor(whatsappService: WhatsAppService);
    createInstance(dto: CreateInstanceDto): Promise<{
        instance: any;
        qrcode: any;
        instanceKey: string;
    }>;
    connectInstance(dto: ConnectInstanceDto): Promise<{
        status: string;
        instance: any;
        message?: undefined;
    } | {
        status: string;
        message: string;
        instance?: undefined;
    }>;
    disconnectInstance(dto: DisconnectInstanceDto): Promise<{
        status: string;
    }>;
    listInstances(tenantId: string): Promise<any>;
    getInstance(tenantId: string, instanceKey: string): Promise<any>;
    sendMessage(dto: SendMessageDto): Promise<{
        success: boolean;
        messageId: any;
    }>;
    receiveWebhook(payload: WebhookPayloadDto): Promise<{
        success: boolean;
    }>;
}
