import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';

export enum AIProvider {
  OPENAI = 'openai',
  GEMINI = 'gemini',
  OLLAMA = 'ollama',
}

export class ProcessMessageDto {
  @IsString()
  tenantId: string;

  @IsString()
  chatId: string;

  @IsString()
  userMessage: string;

  @IsEnum(AIProvider)
  @IsOptional()
  provider?: AIProvider;

  @IsString()
  @IsOptional()
  systemPrompt?: string;

  @IsArray()
  @IsOptional()
  conversationHistory?: Array<{ role: string; content: string }>;
}

export class SearchProductsDto {
  @IsString()
  tenantId: string;

  @IsString()
  query: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
