import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
  const userId = req.user?.sub ?? req.user?.userId ?? req.user?.id;

  return this.authService.getProfileWithTeam(userId);
}

@UseGuards(JwtAuthGuard)
@Get('me-full')
async meFull(@Req() req: any) {
  const userId = req.user?.sub ?? req.user?.userId ?? req.user?.id;

  return this.authService.getProfileWithTeam(userId);
}
  
}