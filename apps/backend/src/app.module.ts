import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/prisma.module';
import { BullQueueModule } from './shared/bull.module';
import { QueueSchedulerService } from './shared/queue-scheduler.service';
import { TenantModule } from './modules/tenant/tenant.module';
import { IAModule } from './modules/ia/ia.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { AutomationModule } from './modules/automation/automation.module';
import { WordPressModule } from './modules/wordpress/wordpress.module';
import { UserModule } from './modules/user/user.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { CartModule } from './modules/cart/cart.module';
import { PaymentModule } from './modules/payment/payment.module';
import { AudioModule } from './modules/audio/audio.module';
import { IntentModule } from './modules/intent/intent.module';
import { TTSModule } from './modules/tts/tts.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    BullQueueModule,
    TenantModule,
    IAModule,
    WhatsAppModule,
    KnowledgeModule,
    AutomationModule,
    WordPressModule,
    UserModule,
    OnboardingModule,
    CartModule,
    PaymentModule,
    // AudioModule, // TODO: Corrigir schema (audioPath, provider faltando)
    IntentModule,
    // TTSModule, // TODO: Corrigir schema (audioPath, provider faltando)
    ConversationModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    QueueSchedulerService,
  ],
})
export class AppModule {}
