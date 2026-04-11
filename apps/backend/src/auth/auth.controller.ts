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
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RequestWithUser } from './types/request-with-user.type';
import { JwtPayload } from './types/jwt-payload.type';

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

    // Stocker refresh token dans httpOnly cookie
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/auth',
    });

    // Retourner seulement access_token et user (pas refresh_token)
    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<AuthResponseDto, 'refresh_token'>> {
    const result = await this.authService.login(dto);

    // Stocker refresh token dans httpOnly cookie
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/auth',
    });

    // Retourner seulement access_token et user
    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<AuthResponseDto, 'refresh_token'>> {
    const refreshToken = (req as ExpressRequest & { cookies?: { refresh_token?: string } }).cookies?.refresh_token;
    const result = await this.authService.refresh(refreshToken);

    // Stocker nouveau refresh token dans cookie (rotation)
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/auth',
    });

    // Retourner seulement access_token et user
    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const refreshToken = (req as ExpressRequest & { cookies?: { refresh_token?: string } }).cookies?.refresh_token;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    // Nettoyer le cookie
    res.clearCookie('refresh_token', { path: '/auth' });

    return { message: 'Déconnecté avec succès' };
  }

  @UseGuards(JwtGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  getProfile(@Request() req: RequestWithUser): JwtPayload {
    return req.user;
  }
}
