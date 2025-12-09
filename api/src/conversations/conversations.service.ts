// api/src/conversations/conversations.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List conversations for a given team, newest first.
   */
  async listForTeam(teamId: string) {
    return this.prisma.conversation.findMany({
      where: { teamId },
      orderBy: { lastMessageAt: 'desc' },
    });
  }
}