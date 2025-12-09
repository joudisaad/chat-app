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
  async moveConversationToInbox(conversationId: string, inboxId: string | null, teamId: string) {
    // Optional: ensure the conversation belongs to the team
    const convo = await this.prisma.conversation.findFirst({
      where: { id: conversationId, teamId },
      select: { id: true },
    });

    if (!convo) {
      throw new Error('Conversation not found for this team');
    }

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        inboxId,
      },
    });
  }

  async assignConversation(conversationId: string, assigneeId: string | null, teamId: string) {
    // Ensure the conversation belongs to the team
    const convo = await this.prisma.conversation.findFirst({
      where: { id: conversationId, teamId },
      select: { id: true },
    });

    if (!convo) {
      throw new Error('Conversation not found for this team');
    }

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        assigneeId,
      },
    });
  }

  async updateStatus(
    conversationId: string,
    status: 'OPEN' | 'PENDING' | 'RESOLVED',
    teamId: string,
  ) {
    // Ensure the conversation belongs to the team
    const convo = await this.prisma.conversation.findFirst({
      where: { id: conversationId, teamId },
      select: { id: true },
    });

    if (!convo) {
      throw new Error('Conversation not found for this team');
    }

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status,
      },
    });
  }
}