import { Module } from '@nestjs/common';
import { EtiquettesService } from './etiquettes.service';
import { EtiquettesController } from './etiquettes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EtiquettesController],
  providers: [EtiquettesService],
  exports: [EtiquettesService],
})
export class EtiquettesModule {}