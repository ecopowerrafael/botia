import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TTSService } from './tts.service';
import { TTSController } from './tts.controller';
import { PrismaModule } from '../../shared/prisma.module';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [TTSController],
  providers: [TTSService],
  exports: [TTSService],
})
export class TTSModule {}
