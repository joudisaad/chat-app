// api/src/conversations/conversations.controller.ts
import { Controller, Get, Req, UseGuards, Body, Patch, Param } from '@nestjs/common';
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

  @Patch(':id/inbox')
  async moveInbox(
    @Param('id') id: string,
    @Body('inboxId') inboxId: string | null,
    @Req() req: any,
  ) {
    const teamId = req.user.teamId;
    return this.conversationsService.moveConversationToInbox(id, inboxId, teamId);
  }

  // ✅ NEW — assign conversation to an agent
  @Patch(':id/assign')
  async assignConversation(
    @Param('id') id: string,
    @Body('assigneeId') assigneeId: string | null,
    @Req() req: any,
  ) {
    const teamId = req.user.teamId;
    return this.conversationsService.assignConversation(id, assigneeId, teamId);
  }

  // ✅ NEW — update conversation status (OPEN/PENDING/RESOLVED)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'OPEN' | 'PENDING' | 'RESOLVED',
    @Req() req: any,
  ) {
    const teamId = req.user.teamId;
    return this.conversationsService.updateStatus(id, status, teamId);
  }
}