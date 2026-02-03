import { NotificationService } from './notification.service';
export declare class VendorWebhookController {
    private readonly notificationService;
    private readonly logger;
    constructor(notificationService: NotificationService);
    handleVendorResponse(payload: any): Promise<any>;
    handleMessageStatus(payload: any): Promise<any>;
}
