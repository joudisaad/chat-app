import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('public')
export class PublicController {
  constructor(private prisma: PrismaService) {}

  @Get('site/:key')
  async resolveSite(@Param('key') key: string) {
    const team = await this.prisma.team.findUnique({
      where: { publicKey: key },
      select: {
        id: true,
        publicKey: true,
        name: true,
        widgetSettings: true, // 👈 important
      },
    });

    if (!team) {
      throw new NotFoundException('Invalid site key');
    }

    return {
      teamId: team.id,
      publicKey: team.publicKey,
      name: team.name,
      widget: team.widgetSettings, // 👈 on renvoie ça au widget
    };
  }
}