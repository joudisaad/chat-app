import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { MessagesModule } from './messages/messages.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PublicModule } from './public/public.module';
import { WidgetSettingsModule } from './widget-settings/widget-settings.module';
import { ConversationsModule } from './conversations/conversations.module';
import { InboxesModule } from './inboxes/inboxes.module';
import { EtiquettesModule } from './etiquettes/etiquettes.module';

@Module({
  imports: [
    PrismaModule,
    MessagesModule,
    AuthModule,
    UsersModule,
    PublicModule,
    WidgetSettingsModule,
    ConversationsModule,
    InboxesModule,
    EtiquettesModule
  ],
})
export class AppModule {}