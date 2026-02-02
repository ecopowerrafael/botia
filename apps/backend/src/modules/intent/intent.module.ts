import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IntentService } from './intent.service';
import { IntentController } from './intent.controller';
import { PrismaModule } from '../../shared/prisma.module';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [IntentController],
  providers: [IntentService],
  exports: [IntentService],
})
export class IntentModule {}
