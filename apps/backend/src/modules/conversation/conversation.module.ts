import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { PrismaModule } from '../../shared/prisma.module';
import { IntentModule } from '../intent/intent.module';
import { TTSModule } from '../tts/tts.module';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [PrismaModule, IntentModule, TTSModule, CartModule],
  controllers: [ConversationController],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}
