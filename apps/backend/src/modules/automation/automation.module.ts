import { Module } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { AutomationController } from './automation.controller';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { PrismaModule } from '../../shared/prisma.module';

@Module({
  imports: [PrismaModule, WhatsAppModule],
  controllers: [AutomationController],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
