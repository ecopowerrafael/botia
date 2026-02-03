import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import {
  ReceiveAudioDto,
  TranscribeAudioDto,
  AudioMessageResponseDto,
  TranscriptionResultDto,
  AudioListDto,
} from './dto/audio.dto';
import { AudioStatus } from '../../shared/enums';
import axios from 'axios';

/**
 * AudioService gerencia:
 * - Recebimento de áudio via WhatsApp
 * - Transcrição com Ollama Whisper
 * - Armazenamento em PostgreSQL
 * - Cache de transcrições
 */
@Injectable()
export class AudioService {
  private ollamaApiUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';

  constructor(private prisma: PrismaService) {}

  /**
   * Receber áudio do cliente
   */
  async receiveAudio(dto: ReceiveAudioDto): Promise<AudioMessageResponseDto> {
    // Validar chat existe
    const chat = await this.prisma.chat.findUnique({
      where: { id: dto.chatId },
    });

    if (!chat) {
      throw new BadRequestException('Chat não encontrado');
    }

    // Criar registro de áudio
    const audioMessage = await this.prisma.audioMessage.create({
      data: {
        chatId: dto.chatId,
        contactId: dto.contactId,
        audioPath: dto.audioPath,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        duration: dto.durationSeconds,
        status: 'RECEIVED',
      },
    });

    // Iniciar transcrição em background (TODO: Bull Queue)
    this.transcribeInBackground(audioMessage.id, dto.audioPath, dto.mimeType);

    return this.mapToResponseDto(audioMessage);
  }

  /**
   * Transcrever áudio com Ollama Whisper
   */
  async transcribeAudio(
    dto: TranscribeAudioDto,
  ): Promise<TranscriptionResultDto> {
    const startTime = Date.now();

    // Obter registro de áudio
    const audioMessage = await this.prisma.audioMessage.findUnique({
      where: { id: dto.audioMessageId },
    });

    if (!audioMessage) {
      throw new BadRequestException('Áudio não encontrado');
    }

    // Atualizar status para CONVERTING
    await this.prisma.audioMessage.update({
      where: { id: dto.audioMessageId },
      data: { status: 'CONVERTING' },
    });

    try {
      // Chamar Ollama Whisper
      const transcription = await this.callOllamaWhisper(
        dto.audioPath,
        dto.language || 'pt',
      );

      const processingTime = Date.now() - startTime;

      // Salvar transcrição no banco
      await this.prisma.audioMessage.update({
        where: { id: dto.audioMessageId },
        data: {
          status: 'TRANSCRIBED',
          transcript: transcription.text,
          transcriptConfidence: transcription.confidence,
          transcribedAt: new Date(),
          transcriptionTimeMs: processingTime,
        },
      });

      return {
        success: true,
        audioMessageId: dto.audioMessageId,
        transcript: transcription.text,
        confidence: transcription.confidence,
        language: dto.language || 'pt',
        duration: audioMessage.duration || 0,
        processTimeMs: processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      // Registrar erro
      await this.prisma.audioMessage.update({
        where: { id: dto.audioMessageId },
        data: {
          status: 'TRANSCRIPTION_FAILED',
          errorMessage: error.message,
          transcriptionTimeMs: processingTime,
        },
      });

      throw new HttpException(
        `Erro ao transcrever áudio: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Chamar Ollama Whisper para transcrição
   */
  private async callOllamaWhisper(
    audioPath: string,
    language: string,
  ): Promise<{ text: string; confidence: number }> {
    try {
      // TODO: Converter áudio para base64 se necessário
      // Por enquanto, assumimos que audioPath é acessível

      const response = await axios.post(
        `${this.ollamaApiUrl}/api/transcribe`,
        {
          model: 'whisper', // Modelo de transcrição
          audio: audioPath,
          language: language,
          response_format: 'json',
        },
        { timeout: 60000 }, // 60 segundos para áudio longo
      );

      return {
        text: response.data.text || '',
        confidence: response.data.confidence || 0.7,
      };
    } catch (error) {
      console.error('Erro ao chamar Ollama Whisper:', error.message);
      throw new HttpException(
        'Erro ao processar áudio com IA',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Transcrever em background (TODO: usar Bull Queue)
   */
  private async transcribeInBackground(
    audioMessageId: string,
    audioPath: string,
    mimeType: string,
  ): Promise<void> {
    // Este é um placeholder
    // Em produção, isso seria enfileirado com Bull/Redis

    setTimeout(async () => {
      try {
        await this.transcribeAudio({
          audioMessageId,
          audioPath,
          mimeType,
          language: 'pt',
        });
      } catch (error) {
        console.error('Erro em transcrição background:', error.message);
      }
    }, 1000); // 1 segundo de delay
  }

  /**
   * Obter áudios de um chat
   */
  async getAudioMessages(
    chatId: string,
    limit: number = 50,
  ): Promise<AudioListDto> {
    const audioMessages = await this.prisma.audioMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return {
      chatId,
      audioMessages: audioMessages.map((am: any) => this.mapToResponseDto(am)),
      totalCount: audioMessages.length,
      lastUpdated: new Date(),
    };
  }

  /**
   * Obter áudio por ID
   */
  async getAudioMessage(audioMessageId: string): Promise<AudioMessageResponseDto> {
    const audioMessage = await this.prisma.audioMessage.findUnique({
      where: { id: audioMessageId },
    });

    if (!audioMessage) {
      throw new BadRequestException('Áudio não encontrado');
    }

    return this.mapToResponseDto(audioMessage);
  }

  /**
   * Deletar áudio (soft delete)
   */
  async deleteAudio(audioMessageId: string): Promise<void> {
    await this.prisma.audioMessage.delete({
      where: { id: audioMessageId },
    });
  }

  /**
   * Mapper para response DTO
   */
  private mapToResponseDto(audio: any): AudioMessageResponseDto {
    return {
      id: audio.id,
      chatId: audio.chatId,
      contactId: audio.contactId,
      audioPath: audio.audioPath,
      mimeType: audio.mimeType,
      sizeBytes: audio.sizeBytes,
      duration: audio.duration ? parseFloat(audio.duration.toString()) : undefined,
      status: audio.status,
      transcript: audio.transcript,
      transcriptConfidence: audio.transcriptConfidence
        ? parseFloat(audio.transcriptConfidence.toString())
        : undefined,
      transcribedAt: audio.transcribedAt,
      transcriptionTimeMs: audio.transcriptionTimeMs,
      errorMessage: audio.errorMessage,
      createdAt: audio.createdAt,
      updatedAt: audio.updatedAt,
    };
  }
}
