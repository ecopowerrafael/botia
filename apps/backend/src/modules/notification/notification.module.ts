import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { VendorWebhookController } from './vendor-webhook.controller';
import { PrismaModule } from '../../shared/prisma.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [PrismaModule, HttpModule, WhatsAppModule],
  controllers: [NotificationController, VendorWebhookController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
