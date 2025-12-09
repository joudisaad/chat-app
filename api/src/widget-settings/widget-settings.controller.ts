// api/src/widget-settings/widget-settings.controller.ts
import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WidgetSettingsService } from './widget-settings.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UpdateWidgetSettingsDto } from './dto/update-widget-settings.dto';

interface AuthRequest extends Request {
  user?: { teamId: string };
}

@Controller('widget-settings')
@UseGuards(JwtAuthGuard)
export class WidgetSettingsController {
  constructor(private readonly widgetSettingsService: WidgetSettingsService) {}

  @Get()
  async getSettings(@Req() req: AuthRequest) {
    const teamId = req.user?.teamId;
    if (!teamId) {
      // should never happen if JwtAuthGuard attaches user
      throw new Error('Missing teamId on user');
    }
    return this.widgetSettingsService.getForTeam(teamId);
  }

  @Put()
  async updateSettings(
    @Req() req: AuthRequest,
    @Body() body: UpdateWidgetSettingsDto,
  ) {
    const teamId = req.user?.teamId;
    if (!teamId) {
      throw new Error('Missing teamId on user');
    }
    return this.widgetSettingsService.updateForTeam(teamId, body);
  }
}