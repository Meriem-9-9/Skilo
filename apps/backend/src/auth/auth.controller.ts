import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Request,
  Res,
  Req,
} from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtGuard } from './guards/jwt.guard';
import { RolesGuard } from './guards/roles.guard'; // ← import added
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RequestWithUser } from './types/request-with-user.type';
import { JwtPayload } from './types/jwt-payload.type';
import { Roles } from './decorators/roles.decorator';
import { Role } from './enums/role.enum';

// Helper: cookie options in one place so they're always consistent
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<AuthResponseDto, 'refresh_token'>> {
    const result = await this.authService.register(dto);
    res.cookie('refresh_token', result.refresh_token, REFRESH_COOKIE_OPTIONS);
    return { access_token: result.access_token, user: result.user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<AuthResponseDto, 'refresh_token'>> {
    const result = await this.authService.login(dto);
    res.cookie('refresh_token', result.refresh_token, REFRESH_COOKIE_OPTIONS);
    return { access_token: result.access_token, user: result.user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<AuthResponseDto, 'refresh_token'>> {
    const refreshToken = (
      req as ExpressRequest & { cookies?: { refresh_token?: string } }
    ).cookies?.refresh_token;
    const result = await this.authService.refresh(refreshToken);
    res.cookie('refresh_token', result.refresh_token, REFRESH_COOKIE_OPTIONS);
    return { access_token: result.access_token, user: result.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const refreshToken = (
      req as ExpressRequest & { cookies?: { refresh_token?: string } }
    ).cookies?.refresh_token;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    res.clearCookie('refresh_token');
    return { message: 'Deconnecte avec succes' };
  }

  @UseGuards(JwtGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  getProfile(@Request() req: RequestWithUser): JwtPayload {
    return req.user;
  }

  // BUG FIX: added RolesGuard — without it @Roles() is just a decoration with no effect.
  // Order matters: JwtGuard runs first (authenticates), then RolesGuard (authorises).
  @Roles(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @Get('admin')
  @HttpCode(HttpStatus.OK)
  getAdminData(): { secret: string } {
    return { secret: 'admin_data' };
  }
}
