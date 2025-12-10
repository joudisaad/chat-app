// api/src/conversations/conversations.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapConversationWithEtiquettes(c: any) {
    return {
      id: c.id,
      roomId: c.roomId,
      lastMessageAt: c.lastMessageAt,
      lastPreview: c.lastPreview,
      lastSender: c.lastSender,
      teamId: c.teamId,
      inboxId: c.inboxId,
      status: c.status,
      assigneeId: c.assigneeId,
      assigneeName: c.assignee ? c.assignee.name : null,
      unreadCount: typeof c.unreadCount === 'number' ? c.unreadCount : 0,
      lastAgentReadAt: c.lastAgentReadAt ?? null,
      lastReadByAgentId: c.lastReadByAgentId ?? null,
      lastReadByAgentName: c.lastReadByAgent ? c.lastReadByAgent.name : null,
      etiquettes: (c.etiquettes || []).map((ce: any) => ({
        id: ce.etiquette.id,
        name: ce.etiquette.name,
        color: ce.etiquette.color,
        slug: ce.etiquette.slug,
      })),
    };
  }
  /**
   * List conversations for a given team, newest first.
   */
  async listForTeam(teamId: string) {
    const convos = await this.prisma.conversation.findMany({
      where: { teamId },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        assignee: true,
        inbox: true,
        lastReadByAgent: true,
        etiquettes: {
          include: {
            etiquette: true,
          },
        },
      },
    });

    return convos.map((c) => this.mapConversationWithEtiquettes(c));
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

// api/src/conversations/conversations.service.ts
// api/src/conversations/conversations.service.ts

async markAsRead(teamId: string, conversationId: string, agentId: string) {
  // 1) Ensure this conversation belongs to the team
  const convo = await this.prisma.conversation.findFirst({
    where: { id: conversationId, teamId },
    select: { id: true },
  });

  if (!convo) {
    throw new NotFoundException('Conversation not found for this team');
  }

  // 2) Update by unique ID only
  const updated = await this.prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastAgentReadAt: new Date(),
      lastReadByAgentId: agentId,
      unreadCount: 0,
    },
    include: {
      assignee: true,
      inbox: true,
      lastReadByAgent: true,
      etiquettes: {
        include: {
          etiquette: true,
        },
      },
    },
  });

  return this.mapConversationWithEtiquettes(updated);
}

  async addEtiquetteToConversation(
    teamId: string,
    conversationId: string,
    etiquetteId: string,
  ) {
    // Ensure conversation belongs to this team
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, teamId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found for this team');
    }

    // Ensure etiquette belongs to this team
    const etiquette = await this.prisma.etiquette.findFirst({
      where: { id: etiquetteId, teamId },
    });

    if (!etiquette) {
      throw new NotFoundException('Etiquette not found for this team');
    }

    // Avoid duplicates thanks to composite PK
    await this.prisma.conversationEtiquette.upsert({
      where: {
        conversationId_etiquetteId: {
          conversationId,
          etiquetteId,
        },
      },
      create: {
        conversationId,
        etiquetteId,
      },
      update: {},
    });

    // Return updated conversation with etiquettes flattened
    const updated = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        assignee: true,
        inbox: true,
        etiquettes: {
          include: {
            etiquette: true,
          },
        },
      },
    });

    if (!updated) {
      return null;
    }

    return this.mapConversationWithEtiquettes(updated);
  }

  async removeEtiquetteFromConversation(
    teamId: string,
    conversationId: string,
    etiquetteId: string,
  ) {
    // Ensure conversation belongs to this team
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, teamId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found for this team');
    }

    // Optionally ensure etiquette belongs to this team
    const etiquette = await this.prisma.etiquette.findFirst({
      where: { id: etiquetteId, teamId },
    });
    if (!etiquette) {
      throw new NotFoundException('Etiquette not found for this team');
    }

    // Remove the link between conversation and etiquette
    await this.prisma.conversationEtiquette.deleteMany({
      where: {
        conversationId,
        etiquetteId,
      },
    });

    return { success: true };
  }
  async findAll(teamId: string) {
    return this.listForTeam(teamId);
  }
}