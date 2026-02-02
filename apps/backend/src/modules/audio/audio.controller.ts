import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AudioService } from './audio.service';
import { ReceiveAudioDto, TranscribeAudioDto } from './dto/audio.dto';

@Controller('audio')
export class AudioController {
  constructor(private audioService: AudioService) {}

  /**
   * POST /audio/receive
   * Cliente envia áudio (WhatsApp webhook)
   *
   * Body:
   * {
   *   chatId: "chat-123",
   *   contactId: "contact-456",
   *   tenantId: "tenant-789",
   *   audioPath: "s3://bucket/audio/msg_2026020101.ogg",
   *   mimeType: "audio/ogg",
   *   sizeBytes: 45230,
   *   durationSeconds: 12.5
   * }
   *
   * O sistema:
   * 1. Salva registro do áudio
   * 2. Inicia transcrição em background
   * 3. Retorna audioMessageId
   */
  @Post('receive')
  @HttpCode(HttpStatus.CREATED)
  async receiveAudio(@Body() dto: ReceiveAudioDto) {
    return this.audioService.receiveAudio(dto);
  }

  /**
   * POST /audio/transcribe
   * Transcrever áudio com Ollama Whisper (manual)
   *
   * Body:
   * {
   *   audioMessageId: "audio-uuid",
   *   audioPath: "s3://bucket/audio/msg_2026020101.ogg",
   *   mimeType: "audio/ogg",
   *   language: "pt"
   * }
   */
  @Post('transcribe')
  @HttpCode(HttpStatus.OK)
  async transcribeAudio(@Body() dto: TranscribeAudioDto) {
    return this.audioService.transcribeAudio(dto);
  }

  /**
   * GET /audio/messages/:chatId
   * Obter áudios de um chat
   *
   * Query params:
   * ?limit=50
   *
   * Retorna lista de áudios com transcrições
   */
  @Get('messages/:chatId')
  async getAudioMessages(
    @Param('chatId') chatId: string,
    @Query('limit') limit?: string,
  ) {
    return this.audioService.getAudioMessages(
      chatId,
      limit ? parseInt(limit) : 50,
    );
  }

  /**
   * GET /audio/:audioMessageId
   * Obter detalhes de um áudio específico
   */
  @Get(':audioMessageId')
  async getAudioMessage(@Param('audioMessageId') audioMessageId: string) {
    return this.audioService.getAudioMessage(audioMessageId);
  }

  /**
   * DELETE /audio/:audioMessageId
   * Deletar áudio
   */
  @Delete(':audioMessageId')
  @HttpCode(HttpStatus.OK)
  async deleteAudio(@Param('audioMessageId') audioMessageId: string) {
    await this.audioService.deleteAudio(audioMessageId);
    return { success: true, message: 'Áudio deletado' };
  }
}
