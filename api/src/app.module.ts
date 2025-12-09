import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { MessagesModule } from './messages/messages.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [PrismaModule, MessagesModule, AuthModule, UsersModule],
})
export class AppModule {}