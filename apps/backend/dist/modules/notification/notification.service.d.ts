import { PrismaService } from '../../shared/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { NotifyVendorPaymentApprovedDto, NotifyClientOrderStatusDto, NotificationSentResponseDto, VendorWhatsAppConfigDto, VendorWhatsAppConfigResponseDto } from './notification.dto';
export declare class NotificationService {
    private prisma;
    private whatsappService;
    private readonly logger;
    constructor(prisma: PrismaService, whatsappService: WhatsAppService);
    notifyVendorPaymentApproved(dto: NotifyVendorPaymentApprovedDto): Promise<NotificationSentResponseDto>;
    notifyClientOrderStatus(dto: NotifyClientOrderStatusDto): Promise<NotificationSentResponseDto>;
    saveVendorWhatsAppConfig(dto: VendorWhatsAppConfigDto): Promise<VendorWhatsAppConfigResponseDto>;
    getVendorWhatsAppConfig(tenantId: string): Promise<any>;
    configureVendorWhatsApp(dto: VendorWhatsAppConfigDto): Promise<VendorWhatsAppConfigResponseDto>;
    getVendorConfig(tenantId: string): Promise<any>;
    processVendorResponse(payload: any): Promise<any>;
    private buildVendorNotificationMessage;
    private buildVendorActionButtons;
    private buildClientOrderConfirmedMessage;
    private buildClientOrderRejectedMessage;
    private sendWhatsAppMessage;
    private sendWhatsAppMedia;
    private getDefaultInstanceKey;
    private saveNotificationLog;
}
