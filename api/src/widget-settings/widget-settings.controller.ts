import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { WidgetSettingsService } from './widget-settings.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('widget-settings')
@UseGuards(JwtAuthGuard)
export class WidgetSettingsController {
  constructor(private service: WidgetSettingsService) {}

  @Get()
  async getMySettings(@Req() req: any) {
    const teamId = req.user.teamId as string;
    return this.service.getForTeam(teamId); // 👈 renvoie un objet JSON
  }

  @Put()
  async updateMySettings(
    @Req() req: any,
    @Body()
    body: {
      launcherColor?: string;
      launcherTextColor?: string;
      launcherPosition?: 'left' | 'right';
      launcherLabel?: string;
    },
  ) {
    const teamId = req.user.teamId as string;
    return this.service.updateForTeam(teamId, body); // 👈 renvoie aussi un objet JSON
  }
}