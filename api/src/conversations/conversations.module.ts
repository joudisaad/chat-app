// api/src/conversations/conversations.module.ts
import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ConversationsService],
  controllers: [ConversationsController],
})
export class ConversationsModule {}