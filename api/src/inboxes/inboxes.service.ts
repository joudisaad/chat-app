import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InboxesService {
  constructor(private prisma: PrismaService) {}

  async listForTeam(teamId: string) {
    const inboxes = await this.prisma.inbox.findMany({
      where: { teamId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    // Ensure there is always one "Main inbox"
    if (inboxes.length > 0) return inboxes;

    const created = await this.prisma.inbox.create({
      data: {
        name: 'Main inbox',
        teamId,
        isDefault: true,
      },
    });

    return [created];
  }

  async create(teamId: string, name: string) {
    return this.prisma.inbox.create({
      data: {
        teamId,
        name,
        isDefault: false,
      },
    });
  }

  async rename(inboxId: string, name: string) {
    return this.prisma.inbox.update({
      where: { id: inboxId },
      data: { name },
    });
  }

  async delete(inboxId: string) {
    // Do NOT delete conversations; simply remove the inbox.
    return this.prisma.inbox.delete({
      where: { id: inboxId },
    });
  }
}