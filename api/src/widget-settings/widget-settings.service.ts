// api/src/widget-settings/widget-settings.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateWidgetSettingsDto } from './dto/update-widget-settings.dto';

/**
 * Widget settings service
 *
 * IMPORTANT: we do NOT touch createdAt / updatedAt here.
 * They are handled automatically by Prisma according to your schema.
 *
 * DB fields (from schema.prisma):
 *   - launcherColor
 *   - launcherTextColor
 *   - launcherPosition  ("right" | "left")
 *   - launcherLabel
 *
 * Dashboard API contract uses:
 *   - position       ("bottom-right" | "bottom-left")
 *   - launcherColor
 *   - textColor
 *
 * This service maps between the two shapes.
 */

@Injectable()
export class WidgetSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // GET /widget-settings (for current team)
  async getForTeam(teamId: string) {
    const settings = await this.prisma.widgetSettings.findUnique({
      where: { teamId },
    });

    if (!settings) {
      // Defaults if the team has no row yet
      return {
        position: 'bottom-right' as const,
        launcherColor: '#22c55e',
        textColor: '#020617',
        launcherLabel: 'Chat',
      };
    }

    return {
      position:
        settings.launcherPosition === 'left' ? 'bottom-left' : 'bottom-right',
      launcherColor: settings.launcherColor,
      textColor: settings.launcherTextColor,
      launcherLabel: settings.launcherLabel,
    };
  }

  // PUT /widget-settings (for current team)
  async updateForTeam(teamId: string, dto: UpdateWidgetSettingsDto) {
    const launcherPosition = dto.position === 'bottom-left' ? 'left' : 'right';

    const updated = await this.prisma.widgetSettings.upsert({
      where: { teamId },
      create: {
        teamId,
        launcherPosition,
        launcherColor: dto.launcherColor,
        launcherTextColor: dto.textColor,
        launcherLabel: 'Chat',
      },
      update: {
        launcherPosition,
        launcherColor: dto.launcherColor,
        launcherTextColor: dto.textColor,
      },
    });

    // Return again in dashboard-friendly shape
    return {
      position:
        updated.launcherPosition === 'left' ? 'bottom-left' : 'bottom-right',
      launcherColor: updated.launcherColor,
      textColor: updated.launcherTextColor,
      launcherLabel: updated.launcherLabel,
    };
  }
}