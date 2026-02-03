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
    sendMessage(dto: SendMessageDto): Promise<{
        success: boolean;
        messageId: any;
    }>;
    processWebhook(payload: WebhookPayloadDto): Promise<void>;
    private handleIncomingMessage;
    private handleMessageStatus;
    listInstances(tenantId: string): Promise<any>;
    getInstance(tenantId: string, instanceKey: string): Promise<any>;
}
