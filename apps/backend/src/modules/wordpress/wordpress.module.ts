import { Module } from '@nestjs/common';
import { WordPressService } from './wordpress.service';
import { WordPressController } from './wordpress.controller';
import { PrismaModule } from '../../shared/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WordPressController],
  providers: [WordPressService],
  exports: [WordPressService],
})
export class WordPressModule {}
