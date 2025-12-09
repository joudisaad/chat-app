// src/messages/messages.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

// avant : create(data)
// après :
async create(data: { content: string; sender: string; roomId: string }, teamId: string) {
  const message = await this.prisma.message.create({
    data: {
      ...data,
      teamId,
    },
  });

  await this.prisma.conversation.upsert({
    where: { roomId: data.roomId },
    update: {
      lastSender: data.sender,
      lastPreview: data.content.slice(0, 120),
      lastMessageAt: message.createdAt,
      teamId, // au cas où
    },
    create: {
      roomId: data.roomId,
      lastSender: data.sender,
      lastPreview: data.content.slice(0, 120),
      lastMessageAt: message.createdAt,
      teamId,
    },
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