import {
  IsString,
  IsEnum,
  IsArray,
  IsObject,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export enum CampaignType {
  DRIP = 'drip',
  MASS = 'mass',
}

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export class DripStep {
  @IsNumber()
  delay: number; // Delay em segundos desde o início ou última mensagem

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;
}

export class CreateDripCampaignDto {
  @IsString()
  tenantId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  instanceKey: string;

  @IsArray()
  steps: DripStep[]; // Sequência de mensagens

  @IsString()
  @IsOptional()
  contactId?: string; // ID do contato específico

  @IsArray()
  @IsOptional()
  contactPhones?: string[]; // Array de telefones para aplicar a drip

  @IsDateString()
  @IsOptional()
  startDate?: string; // Quando iniciar a sequência

  @IsBoolean()
  @IsOptional()
  repeat?: boolean; // Se deve repetir após completar
}

export class CreateMassCampaignDto {
  @IsString()
  tenantId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  instanceKey: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @IsArray()
  contactPhones: string[]; // Destinatários

  @IsNumber()
  @IsOptional()
  delayBetweenMessages?: number; // Delay mínimo entre mensagens (ms)

  @IsNumber()
  @IsOptional()
  randomDelayMax?: number; // Delay aleatório máximo (ms)

  @IsObject()
  @IsOptional()
  variables?: Record<string, string>; // Variáveis globais {nome: "João"}
}

export class UpdateCampaignStatusDto {
  @IsString()
  campaignId: string;

  @IsEnum(CampaignStatus)
  status: CampaignStatus;
}

export class GetCampaignStatsDto {
  @IsString()
  campaignId: string;

  @IsString()
  tenantId: string;
}

export class PersonalizedMessage {
  phoneNumber: string;
  message: string;
  variables?: Record<string, string>;
}
