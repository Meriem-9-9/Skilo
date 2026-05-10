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
import { RolesGuard } from './guards/roles.guard'; 
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RequestWithUser } from './types/request-with-user.type';
import { JwtPayload } from './types/jwt-payload.type';
import { Roles } from './decorators/roles.decorator';
import { Role } from './enums/role.enum';

// options des cookies de refresh pour qu'elles soient pareilles partout
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, 
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/register
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

  // POST /auth/login
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

  // POST /auth/refresh
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

  // POST /auth/logout
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
    return { message: 'deconnecte avec succes' };
  }

  @UseGuards(JwtGuard)
  // GET /auth/me
  @Get('me')
  @HttpCode(HttpStatus.OK)
  getProfile(@Request() req: RequestWithUser): JwtPayload {
    return req.user;
  }

  // on utilise le rolesguard pour verifier les roles admin etc
  @Roles(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  // GET /auth/admin
  @Get('admin')
  @HttpCode(HttpStatus.OK)
  getAdminData(): { secret: string } {
    return { secret: 'admin_data' };
  }
}
