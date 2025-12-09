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
import { InboxesService } from './inboxes.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('inboxes')
@UseGuards(JwtAuthGuard)
export class InboxesController {
  constructor(private readonly inboxesService: InboxesService) {}

  @Get()
  async getInboxes(@Req() req: any) {
    const teamId = req.user.teamId;
    return this.inboxesService.listForTeam(teamId);
  }

  @Post()
  async createInbox(@Req() req: any, @Body('name') name: string) {
    const teamId = req.user.teamId;
    return this.inboxesService.create(teamId, name);
  }

  @Patch(':id')
  async renameInbox(
    @Req() req: any,
    @Param('id') id: string,
    @Body('name') name: string,
  ) {
    // In the future we can enforce team ownership here if needed
    // const teamId = req.user.teamId;
    return this.inboxesService.rename(id, name);
  }

  @Delete(':id')
  async deleteInbox(@Req() req: any, @Param('id') id: string) {
    // In the future we can enforce team ownership here if needed
    // const teamId = req.user.teamId;
    return this.inboxesService.delete(id);
  }
}