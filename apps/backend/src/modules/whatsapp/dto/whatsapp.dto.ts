import { IsString, IsOptional, IsObject, IsArray, IsEnum } from 'class-validator';

export enum WebhookEventType {
  MESSAGE = 'message',
  STATUS = 'status',
  PRESENCE = 'presence',
  INSTANCE_CONNECTED = 'instance.connected',
  INSTANCE_DISCONNECTED = 'instance.disconnected',
}

export class CreateInstanceDto {
  @IsString()
  tenantId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class SendMessageDto {
  @IsString()
  tenantId: string;

  @IsString()
  instanceKey: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  message: string;

  @IsObject()
  @IsOptional()
  mediaUrl?: { url: string; type: string };
}

export class WebhookPayloadDto {
  @IsEnum(WebhookEventType)
  event: WebhookEventType;

  @IsString()
  instanceKey: string;

  @IsString()
  @IsOptional()
  from?: string;

  @IsString()
  @IsOptional()
  to?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsString()
  @IsOptional()
  status?: string;
}

export class ConnectInstanceDto {
  @IsString()
  tenantId: string;

  @IsString()
  instanceKey: string;
}

export class DisconnectInstanceDto {
  @IsString()
  tenantId: string;

  @IsString()
  instanceKey: string;
}
