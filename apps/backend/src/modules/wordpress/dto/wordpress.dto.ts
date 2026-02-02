import { IsString, IsUrl, IsOptional, IsArray, IsBoolean, IsNumber } from 'class-validator';

export class ConnectWordPressDto {
  @IsUrl()
  siteUrl: string; // https://exemplo.com.br

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  appPassword?: string;

  @IsOptional()
  @IsBoolean()
  syncProducts?: boolean;

  @IsOptional()
  @IsBoolean()
  syncPosts?: boolean;

  @IsOptional()
  @IsBoolean()
  syncPages?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productFields?: string[]; // campos a sincronizar: id, name, price, description, etc
}

export class ConfigureFieldsDto {
  @IsString()
  integrationId: string;

  @IsArray()
  @IsString({ each: true })
  productFields: string[]; // ex: ["id", "name", "price", "description", "images", "categories"]

  @IsBoolean()
  syncProducts: boolean;

  @IsBoolean()
  syncPosts: boolean;

  @IsBoolean()
  syncPages: boolean;

  @IsNumber()
  syncFrequency: number; // segundos
}

export class SyncDataDto {
  @IsString()
  integrationId: string;

  @IsOptional()
  @IsNumber()
  limit?: number; // Limitar quantidade de produtos
}

export class WordPressProductDto {
  id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price?: number;
  regular_price?: number;
  sale_price?: number;
  images?: Array<{ src: string; alt: string }>;
  categories?: Array<{ name: string; slug: string }>;
  tags?: Array<{ name: string; slug: string }>;
  attributes?: Record<string, any>;
  stock?: number;
  status: string;
}

export class WordPressIntegrationResponseDto {
  id: string;
  siteUrl: string;
  isActive: boolean;
  syncProducts: boolean;
  syncPosts: boolean;
  syncPages: boolean;
  productFields: string[];
  lastSyncedAt?: Date;
  syncFrequency: number;
  createdAt: Date;
}
