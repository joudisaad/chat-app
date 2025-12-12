import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Team } from '@prisma/client';
import { authenticator } from 'otplib';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

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

    // if user has 2FA on, do NOT return full token yet
    if (user.twoFactorEnabled) {
      const tempToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          is2fa: true,
        },
        {
          expiresIn: '5m',
        },
      );

      return {
        requires2FA: true,
        tempToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    }

    // normal login (no 2FA)
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

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId },
      include: { team: true },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      team: membership?.team ?? null,
    };
  }

async getProfileWithTeam(userId: string) {
    // fetch user + memberships + team in one go
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: { team: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const primary = user.memberships[0] ?? null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      // main team (for dashboard)
      team: primary?.team
        ? {
            id: primary.team.id,
            name: primary.team.name,
            publicKey: primary.team.publicKey,
            createdAt: primary.team.createdAt,
            updatedAt: primary.team.updatedAt,
          }
        : null,
      // full list of memberships if you need later
      memberships: user.memberships.map((m) => ({
        id: m.id,
        teamId: m.teamId,
        role: m.role,
        team: m.team
          ? {
              id: m.team.id,
              name: m.team.name,
              publicKey: m.team.publicKey,
              createdAt: m.team.createdAt,
              updatedAt: m.team.updatedAt,
            }
          : null,
      })),
    };
  }
  // inside AuthService
  async validateGoogleLogin(profile: any) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new UnauthorizedException('No email from Google');
    }

    const displayName =
      profile.displayName ||
      profile.name?.givenName ||
      profile.name?.familyName ||
      'Google user';

    let user = await this.usersService.findByEmail(email);
    let team: Team | null = null;

    if (!user) {
      // Create user + team using a dummy password string (never used)
      const created = await this.usersService.createInitialUserAndTeam(
        displayName,
        email,
        'google-oauth-user', // <-- FIX: no more `null` here
      );

      user = created.user;
      team = created.team;
    } else {
      // Fetch membership + team explicitly
      const membership = await this.prisma.teamMembership.findFirst({
        where: { userId: user.id },
        include: { team: true },
      });
      team = membership?.team ?? null;
    }

    const payload = {
      sub: user.id,
      email: user.email,
      teamId: team?.id,
      role: 'agent',
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

  async generateTwoFactorSecret(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'ChatApp', secret);

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return {
      secret,      // optional to show in UI
      otpauthUrl,  // use this to generate a QR code later
    };
  }

  async enableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA not initialized');
    }

    const ok = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!ok) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { success: true };
  }

  async disableTwoFactor(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });

    return { success: true };
  }

  async verifyTwoFactorCode(tempToken: string, code: string) {
  let payload: any;
  try {
    payload = this.jwtService.verify(tempToken);
  } catch {
    throw new UnauthorizedException('Invalid or expired 2FA token');
  }

  if (!payload?.sub || !payload?.is2fa) {
    throw new UnauthorizedException('Invalid 2FA token');
  }

  const user = await this.prisma.user.findUnique({
    where: { id: payload.sub },
    include: {
      memberships: { include: { team: true } },
    },
  });

  if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
    throw new UnauthorizedException('2FA not enabled');
  }

  const ok = authenticator.verify({
    token: code,
    secret: user.twoFactorSecret,
  });

  if (!ok) {
    throw new UnauthorizedException('Invalid 2FA code');
  }

  const membership = user.memberships?.[0];

  const finalPayload = {
    sub: user.id,
    email: user.email,
    teamId: membership?.teamId,
    role: membership?.role ?? 'agent',
  };

  return {
    accessToken: this.jwtService.sign(finalPayload),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    team: membership?.team ?? null,
  };
}
}