import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ---------- Email/password auth ----------

  @Post('register')
  register(
    @Body() body: { name: string; email: string; password: string },
  ) {
    return this.authService.register(body.name, body.email, body.password);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    // JwtStrategy usually sets userId or sub
    const userId = req.user?.userId ?? req.user?.sub;
    if (!userId || !this.authService.getProfileWithTeam) {
      // fallback: return raw JWT payload
      return req.user;
    }
    return this.authService.getProfileWithTeam(userId);
  }

  // ---------- Google OAuth ----------

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Just triggers the Google OAuth flow
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any) {
    // `req.user` comes from GoogleStrategy.validate()
    // and should be shaped like your normal login response
    return req.user;
  }

  // ---------- 2FA (TOTP) – optional, disabled until used ----------

  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  async generate2fa(@Req() req: any) {
    const userId = req.user?.userId ?? req.user?.sub;
    return this.authService.generateTwoFactorSecret(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  async enable2fa(
    @Req() req: any,
    @Body() body: { code: string },
  ) {
    const userId = req.user?.userId ?? req.user?.sub;
    return this.authService.enableTwoFactor(userId, body.code);
  }

  @Post('2fa/verify')
  async verify2fa(
    @Body() body: { userId: string; code: string },
  ) {
    return this.authService.verifyTwoFactorCode(body.userId, body.code);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me-full')
  async meFull(@Req() req: any) {
    const userId = req.user?.userId ?? req.user?.sub;
    if (!userId || !this.authService.getProfileWithTeam) {
      return req.user;
    }
    return this.authService.getProfileWithTeam(userId);
  }
}