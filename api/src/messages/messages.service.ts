// src/messages/messages.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: { content: string; sender: string; roomId: string },
    teamId: string,
  ) {
    // Detect if this is a customer/visitor message (unread for agents)
    const isFromCustomer =
      data.sender &&
      data.sender.toLowerCase() !== 'agent' &&
      data.sender.toLowerCase() !== 'system';

    const message = await this.prisma.message.create({
      data: {
        ...data,
        teamId,
      },
    });

    // Build update data for existing conversation
    const updateData: any = {
      lastSender: data.sender,
      lastPreview: data.content.slice(0, 120),
      lastMessageAt: message.createdAt,
      teamId,
    };

    if (isFromCustomer) {
      // Increment unread counter when a customer message arrives
      updateData.unreadCount = { increment: 1 };
    }

    // Build create data for a brand new conversation
    const createData: any = {
      roomId: data.roomId,
      lastSender: data.sender,
      lastPreview: data.content.slice(0, 120),
      lastMessageAt: message.createdAt,
      teamId,
      unreadCount: isFromCustomer ? 1 : 0,
    };

    await this.prisma.conversation.upsert({
      where: { roomId: data.roomId },
      update: updateData,
      create: createData,
    });

    return message;
  }
  async listConversations(teamId: string) {
    return this.prisma.conversation.findMany({
      where: { teamId },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
    });
  }
  async findAll(roomId?: string, teamId?: string) {
    const where: any = {};

    if (roomId) where.roomId = roomId;
    if (teamId) where.teamId = teamId;

    return this.prisma.message.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: 200,
    });
  }
}