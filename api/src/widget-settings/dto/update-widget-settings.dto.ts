// api/src/widget-settings/dto/update-widget-settings.dto.ts

export interface UpdateWidgetSettingsDto {
  // what the DASHBOARD sends / expects:
  position: 'bottom-right' | 'bottom-left';
  launcherColor: string;
  textColor: string;
}