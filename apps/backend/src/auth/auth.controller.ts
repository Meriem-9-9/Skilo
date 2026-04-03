// auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Res,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthUser } from './types/auth-user.type';

const COOKIE_OPTIONS = {
  httpOnly: true, // inaccessible au JS côté client
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours en ms
  path: '/auth/refresh', // cookie envoyé uniquement sur cette route
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // POST /auth/register
  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setRefreshCookie(res, result.refresh_token);
    return {
      user: result.user,
      access_token: result.access_token,
    };
  }

  // POST /auth/login  (LocalStrategy valide email+password)
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @CurrentUser() authUser: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(authUser);
    this.setRefreshCookie(res, result.refresh_token);

    // Le refresh token ne sort JAMAIS dans le body
    return {
      user: result.user,
      access_token: result.access_token,
    };
  }

  // ─────────────────────────────────────────────
  // POST /auth/refresh
  // ─────────────────────────────────────────────
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as { refresh_token?: string } | undefined;
    const refreshToken = cookies?.refresh_token;
    if (!refreshToken) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: 'Refresh token manquant' });
    }

    const result = await this.authService.refresh(refreshToken);
    return {
      user: result.user,
      access_token: result.access_token,
    };
  }

  // POST /auth/logout
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = req.cookies as { refresh_token?: string } | undefined;
    const refreshToken = cookies?.refresh_token;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    res.clearCookie('refresh_token', { path: '/auth/refresh' });
    return { message: 'Déconnecté avec succès' };
  }

  // GET /auth/me  — profil courant
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.id);
  }

  // PRIVATE
  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie('refresh_token', refreshToken, COOKIE_OPTIONS);
  }
}
