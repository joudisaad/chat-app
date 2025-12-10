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
import { EtiquettesService } from './etiquettes.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

interface RequestWithUser extends Request {
  user?: {
    sub: string;
    email: string;
    teamId: string;
    role: string;
  };
}

@Controller('etiquettes')
@UseGuards(JwtAuthGuard)
export class EtiquettesController {
  constructor(private readonly etiquettesService: EtiquettesService) {}

  @Get()
  findAll(@Req() req: RequestWithUser) {
    const teamId = req.user?.teamId;
    return this.etiquettesService.findAllForTeam(teamId!);
  }

  @Post()
  create(
    @Req() req: RequestWithUser,
    @Body()
    body: {
      name: string;
      color?: string;
      slug?: string;
      description?: string;
    },
  ) {
    const teamId = req.user?.teamId;
    return this.etiquettesService.createForTeam(teamId!, body);
  }

  @Patch(':id')
  update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      color?: string;
      slug?: string;
      description?: string | null;
    },
  ) {
    const teamId = req.user?.teamId;
    return this.etiquettesService.updateForTeam(teamId!, id, body);
  }

  @Delete(':id')
  async delete(@Req() req, @Param('id') id: string) {
    const teamId = req.user.teamId;
    await this.etiquettesService.deleteEtiquette(teamId, id);
    return { success: true };
  }
}