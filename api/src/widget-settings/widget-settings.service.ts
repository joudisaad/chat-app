import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WidgetSettingsService {
  constructor(private prisma: PrismaService) {}

  async getForTeam(teamId: string) {
    // On s'assure qu'il y a toujours une ligne en DB
    return this.prisma.widgetSettings.upsert({
      where: { teamId },
      update: {},
      create: {
        teamId,
        // les defaults defined in schema.prisma s’appliqueront
      },
    });
  }

  async updateForTeam(
    teamId: string,
    dto: {
      launcherColor?: string;
      launcherTextColor?: string;
      launcherPosition?: 'left' | 'right';
      launcherLabel?: string;
    },
  ) {
    // upsert aussi ici, au cas où on appelle le PUT en premier
    return this.prisma.widgetSettings.upsert({
      where: { teamId },
      update: dto,
      create: {
        teamId,
        ...dto,
      },
    });
  }
}