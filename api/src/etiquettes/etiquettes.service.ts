import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface CreateEtiquetteDto {
  name: string;
  color?: string;         
  slug?: string;
  description?: string;
}

interface UpdateEtiquetteDto {
  name?: string;
  color?: string;          
  slug?: string;
  description?: string | null;
}

@Injectable()
export class EtiquettesService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      // replace spaces & non-alphanumeric by -
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async findAllForTeam(teamId: string) {
    if (!teamId) {
      throw new BadRequestException('Missing team context');
    }

    return this.prisma.etiquette.findMany({
      where: { teamId },
      orderBy: [{ createdAt: 'asc' }],
    });
  }

  async createForTeam(teamId: string, dto: CreateEtiquetteDto) {
    if (!teamId) {
      throw new BadRequestException('Missing team context');
    }

    if (!dto.name?.trim()) {
      throw new BadRequestException('Name is required');
    }

    const slug =
      dto.slug && dto.slug.trim().length > 0
        ? this.normalizeSlug(dto.slug)
        : this.normalizeSlug(dto.name);

    if (!slug) {
      throw new BadRequestException('Slug could not be generated');
    }

    try {
      const etiquette = await this.prisma.etiquette.create({
        data: {
          name: dto.name.trim(),
          color: dto.color || '#22c55e',
          description: dto.description ?? null,
          slug,
          teamId,
        },
      });
      return etiquette;
    } catch (err: any) {
      // Unique constraint (e.g. @@unique([teamId, slug]) or slug @unique)
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException('Slug already exists for this team');
      }
      throw err;
    }
  }

  async updateForTeam(teamId: string, id: string, dto: UpdateEtiquetteDto) {
    if (!teamId) {
      throw new BadRequestException('Missing team context');
    }

    // Build data object only with provided fields
    const data: Prisma.EtiquetteUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.color !== undefined) {
      data.color = dto.color;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }
    if (dto.slug !== undefined) {
      const slug =
        dto.slug && dto.slug.trim().length > 0
          ? this.normalizeSlug(dto.slug)
          : null;
      if (!slug) {
        throw new BadRequestException('Slug cannot be empty');
      }
      data.slug = slug;
    }

    try {
      // Use updateMany to enforce teamId in where clause
      const result = await this.prisma.etiquette.updateMany({
        where: {
          id,
          teamId,
        },
        data,
      });

      if (result.count === 0) {
        throw new NotFoundException('Etiquette not found for this team');
      }

      // Return the updated entity
      return this.prisma.etiquette.findFirst({
        where: { id, teamId },
      });
    } catch (err: any) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException('Slug already exists for this team');
      }
      throw err;
    }
  }

  async deleteForTeam(teamId: string, id: string) {
    if (!teamId) {
      throw new BadRequestException('Missing team context');
    }

    const result = await this.prisma.etiquette.deleteMany({
      where: {
        id,
        teamId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Etiquette not found for this team');
    }

    return { success: true };
  }

  // etiquettes.service.ts
async deleteEtiquette(teamId: string, etiquetteId: string) {
  // 1) Make sure this etiquette belongs to the current team
  const etiquette = await this.prisma.etiquette.findFirst({
    where: { id: etiquetteId, teamId },
  });

  if (!etiquette) {
    throw new NotFoundException('Etiquette not found');
  }

  // 2) Delete all conversation links first
  await this.prisma.conversationEtiquette.deleteMany({
    where: { etiquetteId },
  });

  // 3) Delete the etiquette itself
  await this.prisma.etiquette.delete({
    where: { id: etiquetteId },
  });

  return { success: true };
}
}