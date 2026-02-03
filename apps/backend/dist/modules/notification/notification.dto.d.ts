export declare class NotifyVendorPaymentApprovedDto {
    orderId: string;
    tenantId: string;
    clientPhoneNumber: string;
    paymentProofUrl: string;
    paymentProofType?: string;
    orderTotal: number;
    orderItems?: any[];
}
export declare class NotifyClientOrderStatusDto {
    orderId: string;
    clientPhoneNumber: string;
    status: 'CONFIRMED' | 'REJECTED';
    reason?: string;
}
export declare class NotificationSentResponseDto {
    success: boolean;
    messageId?: string;
    status: 'sent' | 'failed' | 'pending';
    error?: string;
    timestamp: string;
}
export declare class VendorWhatsAppConfigDto {
    tenantId: string;
    vendorWhatsAppNumber: string;
    vendorWhatsAppName?: string;
    vendorInstanceKey?: string;
}
export declare class VendorWhatsAppConfigResponseDto {
    success: boolean;
    config: {
        tenantId: string;
        vendorWhatsAppNumber: string;
        vendorWhatsAppName: string;
        createdAt: string;
        updatedAt: string;
    };
}
export declare class GetVendorConfigDto {
    tenantId: string;
}
export declare class VendorResponseWebhookDto {
    orderId: string;
    vendorPhoneNumber: string;
    response: 'ACCEPT' | 'REJECT';
    responseTime: string;
    reason?: string;
}
export declare class VendorResponseWebhookResponseDto {
    success: boolean;
    orderId: string;
    orderStatus: 'CONFIRMED' | 'REJECTED';
    message: string;
    timestamp: string;
}
