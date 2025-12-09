// api/src/conversations/conversations.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async getConversations(@Req() req: any) {
    const teamId: string = req.user.teamId;
    return this.conversationsService.listForTeam(teamId);
  }
}