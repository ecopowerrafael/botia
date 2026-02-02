import { IsString, IsUrl, IsOptional, IsArray } from 'class-validator';

export class ScrapeUrlDto {
  @IsString()
  tenantId: string;

  @IsUrl()
  url: string;

  @IsString()
  @IsOptional()
  selector?: string; // CSS selector para extrair dados (ex: ".product")

  @IsString()
  @IsOptional()
  nameSelector?: string; // CSS selector para nome do produto

  @IsString()
  @IsOptional()
  descriptionSelector?: string; // CSS selector para descrição

  @IsString()
  @IsOptional()
  priceSelector?: string; // CSS selector para preço

  @IsString()
  @IsOptional()
  urlSelector?: string; // CSS selector para URL do produto

  @IsString()
  @IsOptional()
  category?: string; // Categoria para classificar produtos

  @IsString()
  @IsOptional()
  scheduleCron?: string; // Cron expression para agendar (ex: "0 0 * * *" = daily)
}

export class ScheduleScrapeDto {
  @IsString()
  tenantId: string;

  @IsString()
  jobId: string; // ID do job agendado

  @IsString()
  @IsOptional()
  cronExpression?: string; // Nova expressão cron
}

export class UploadCsvDto {
  @IsString()
  tenantId: string;

  @IsString()
  @IsOptional()
  category?: string; // Categoria para todos os produtos do CSV

  @IsString()
  @IsOptional()
  updateMode?: 'replace' | 'append'; // Substituir ou adicionar produtos existentes
}

export class CsvProductDto {
  name: string;
  category?: string;
  price?: number;
  url?: string;
  stock?: number;
  metadata?: Record<string, any>;
}
