import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto'; // 👈 add this
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

async createInitialUserAndTeam(name: string, email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);

  return this.prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    // 👇 generate a public site key for the team
    const publicKey = 'site_' + randomBytes(6).toString('hex');
    const team = await tx.team.create({
      data: {
        name: `${name}'s team`,
        publicKey,
        widgetSettings: {
          create: {},
        },
      },
    });

    await tx.teamMembership.create({
      data: {
        userId: user.id,
        teamId: team.id,
        role: 'owner',
      },
    });

    return { user, team };
  });
}
}