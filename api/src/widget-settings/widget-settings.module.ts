// api/src/widget-settings/widget-settings.module.ts
import { Module } from '@nestjs/common';
import { WidgetSettingsService } from './widget-settings.service';
import { WidgetSettingsController } from './widget-settings.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WidgetSettingsController],
  providers: [WidgetSettingsService],
})
export class WidgetSettingsModule {}