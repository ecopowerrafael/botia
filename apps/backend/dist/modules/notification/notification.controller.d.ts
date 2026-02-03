import { NotificationService } from './notification.service';
import { NotifyVendorPaymentApprovedDto, NotifyClientOrderStatusDto, NotificationSentResponseDto, VendorWhatsAppConfigDto, VendorWhatsAppConfigResponseDto } from './notification.dto';
export declare class NotificationController {
    private readonly notificationService;
    constructor(notificationService: NotificationService);
    configureVendorWhatsApp(dto: VendorWhatsAppConfigDto): Promise<VendorWhatsAppConfigResponseDto>;
    getVendorConfig(tenantId: string): Promise<any>;
    notifyVendorPaymentApproved(dto: NotifyVendorPaymentApprovedDto): Promise<NotificationSentResponseDto>;
    notifyClientOrderStatus(dto: NotifyClientOrderStatusDto): Promise<NotificationSentResponseDto>;
}
