import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;

    // find primary membership/team
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId: user.id },
      include: { team: true },
    });

    return { user, membership };
  }

  async login(email: string, password: string) {
    const result = await this.validateUser(email, password);
    if (!result) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { user, membership } = result;

    const payload = {
      sub: user.id,
      email: user.email,
      teamId: membership?.teamId,
      role: membership?.role ?? 'agent',
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      team: membership?.team ?? null,
    };
  }

  async register(name: string, email: string, password: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new UnauthorizedException('Email already in use');
    }

    const { user, team } =
      await this.usersService.createInitialUserAndTeam(name, email, password);

    const payload = {
      sub: user.id,
      email: user.email,
      teamId: team.id,
      role: 'owner',
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      team,
    };
  }
}