import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  // 🔓 Public: historique pour le widget (pas de teamId)
  @Get('public')
  publicHistory(@Query('roomId') roomId?: string) {
    return this.messagesService.findAll(roomId); // pas de teamId -> uniquement roomId
  }

  // 🔐 Agent: crée un message (si un jour tu l’utilises via REST côté agent)
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() body: { content: string; sender: string; roomId: string },
    @Req() req: any,
  ) {
    const teamId = req.user.teamId as string;
    return this.messagesService.create(body, teamId);
  }

  // 🔐 Agent: historique filtré par teamId (utilisé par dashboard)
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('roomId') roomId: string | undefined, @Req() req: any) {
    const teamId = req.user.teamId as string;
    return this.messagesService.findAll(roomId, teamId);
  }

  // 🔐 Agent: liste des conversations du team
  @UseGuards(JwtAuthGuard)
  @Get('rooms')
  listRooms(@Req() req: any) {
    const teamId = req.user.teamId as string;
    return this.messagesService.listConversations(teamId);
  }
}