import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { AudioStatus } from '@prisma/client';

export class ReceiveAudioDto {
  @IsString()
  chatId: string;

  @IsString()
  contactId: string;

  @IsString()
  tenantId: string;

  @IsString()
  audioPath: string; // URL ou caminho local do arquivo de áudio

  @IsString()
  mimeType: string; // 'audio/ogg', 'audio/wav', 'audio/mpeg'

  @IsNumber()
  sizeBytes: number;

  @IsOptional()
  @IsNumber()
  durationSeconds?: number;
}

export class TranscribeAudioDto {
  @IsString()
  audioMessageId: string;

  @IsString()
  audioPath: string;

  @IsString()
  mimeType: string;

  @IsOptional()
  @IsString()
  language?: string; // 'pt', 'en', etc. Default: 'pt'
}

export class AudioMessageResponseDto {
  id: string;
  chatId: string;
  contactId: string;
  audioPath: string;
  mimeType: string;
  sizeBytes: number;
  duration?: number;
  status: AudioStatus;
  transcript?: string;
  transcriptConfidence?: number;
  transcribedAt?: Date;
  transcriptionTimeMs?: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TranscriptionResultDto {
  success: boolean;
  audioMessageId: string;
  transcript: string;
  confidence: number; // 0-1
  language: string;
  duration: number; // em segundos
  processTimeMs: number;
  error?: string;
}

export class AudioListDto {
  chatId: string;
  audioMessages: AudioMessageResponseDto[];
  totalCount: number;
  lastUpdated: Date;
}
