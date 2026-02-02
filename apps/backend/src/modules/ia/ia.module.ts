import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IAService } from './ia.service';
import { IAController } from './ia.controller';
import { IAIntegrationService } from './ia-integration.service';
import { IAIntegrationController } from './ia-integration.controller';
import { PrismaModule } from '../../shared/prisma.module';
import { WordPressModule } from '../wordpress/wordpress.module';
import { ConversationModule } from '../conversation/conversation.module';
import { IntentModule } from '../intent/intent.module';
import { CartModule } from '../cart/cart.module';
import { TTSModule } from '../tts/tts.module';

@Module({
  imports: [
    PrismaModule,
    WordPressModule,
    HttpModule,
    ConversationModule,
    IntentModule,
    CartModule,
    TTSModule,
  ],
  controllers: [IAController, IAIntegrationController],
  providers: [IAService, IAIntegrationService],
  exports: [IAService, IAIntegrationService],
})
export class IAModule {}
