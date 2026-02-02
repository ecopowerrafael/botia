export declare enum WebhookEventType {
    MESSAGE = "message",
    STATUS = "status",
    PRESENCE = "presence",
    INSTANCE_CONNECTED = "instance.connected",
    INSTANCE_DISCONNECTED = "instance.disconnected"
}
export declare class CreateInstanceDto {
    tenantId: string;
    name: string;
    description?: string;
}
export declare class SendMessageDto {
    tenantId: string;
    instanceKey: string;
    phoneNumber: string;
    message: string;
    mediaUrl?: {
        url: string;
        type: string;
    };
}
export declare class WebhookPayloadDto {
    event: WebhookEventType;
    instanceKey: string;
    from?: string;
    to?: string;
    message?: string;
    data?: Record<string, any>;
    status?: string;
}
export declare class ConnectInstanceDto {
    tenantId: string;
    instanceKey: string;
}
export declare class DisconnectInstanceDto {
    tenantId: string;
    instanceKey: string;
}
