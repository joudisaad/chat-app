import { Module } from '@nestjs/common';
import { InboxesService } from './inboxes.service';
import { InboxesController } from './inboxes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [InboxesService],
  controllers: [InboxesController],
  exports: [InboxesService],
})
export class InboxesModule {}