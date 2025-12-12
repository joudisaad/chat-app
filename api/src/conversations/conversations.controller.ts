// api/src/conversations/conversations.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
  ) {}

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
    const teamId: string = req.user.teamId;
    return this.conversationsService.moveConversationToInbox(id, inboxId, teamId);
  }

  // assign conversation to an agent
  @Patch(':id/assign')
  async assignConversation(
    @Param('id') id: string,
    @Body('assigneeId') assigneeId: string | null,
    @Req() req: any,
  ) {
    const teamId: string = req.user.teamId;
    return this.conversationsService.assignConversation(id, assigneeId, teamId);
  }

  // update conversation status (OPEN / PENDING / RESOLVED)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'OPEN' | 'PENDING' | 'RESOLVED',
    @Req() req: any,
  ) {
    const teamId: string = req.user.teamId;
    return this.conversationsService.updateStatus(id, status, teamId);
  }

  // mark conversation as read by current agent (id can be conversation.id or roomId)
  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const teamId: string = req.user.teamId;
    const agentId: string = req.user.userId ?? req.user.sub;
    return this.conversationsService.markAsRead(teamId, id, agentId);
  }

  // legacy POST endpoint, same logic as above (used by older code)
  @Post(':id/mark-read')
  async markReadViaPost(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const teamId: string = req.user.teamId;
    const agentId: string = req.user.userId ?? req.user.sub;
    return this.conversationsService.markAsRead(teamId, id, agentId);
  }

  @Post(':conversationId/etiquettes/:etiquetteId')
  async addEtiquetteToConversation(
    @Req() req: any,
    @Param('conversationId') conversationId: string,
    @Param('etiquetteId') etiquetteId: string,
  ) {
    const teamId: string = req.user.teamId;
    return this.conversationsService.addEtiquetteToConversation(
      teamId,
      conversationId,
      etiquetteId,
    );
  }

  @Delete(':conversationId/etiquettes/:etiquetteId')
  async removeEtiquetteFromConversation(
    @Req() req: any,
    @Param('conversationId') conversationId: string,
    @Param('etiquetteId') etiquetteId: string,
  ) {
    const teamId: string = req.user.teamId;
    return this.conversationsService.removeEtiquetteFromConversation(
      teamId,
      conversationId,
      etiquetteId,
    );
  }
    // GET /conversations/by-room/:roomId
    // conversations.controller.ts
    @UseGuards(JwtAuthGuard)
    @Get('by-room/:roomId')
    async getByRoom(@Req() req: any, @Param('roomId') roomId: string) {
      const teamId = req.user.teamId;
      return this.conversationsService.findByRoomId(teamId, roomId);
    }
}