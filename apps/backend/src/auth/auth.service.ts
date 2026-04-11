import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './types/jwt-payload.type';
import { User } from 'generated/prisma/client';
import { Role } from './enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    return this.buildResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    return this.buildResponse(user);
  }

  async refresh(refreshToken: string | undefined): Promise<AuthResponseDto> {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    // Vérifier si token est blacklisté
    const tokenHash = this.hashToken(refreshToken);
    const blacklisted = await this.prisma.tokenBlacklist.findUnique({
      where: { tokenHash },
    });

    if (blacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Valider le refresh token
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Vérifier que l'utilisateur existe et est actif
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Blacklister l'ancien refresh token (rotation)
    const decoded = this.jwtService.decode(refreshToken) as {
      exp: number;
    } | null;

    if (decoded?.exp) {
      await this.prisma.tokenBlacklist.create({
        data: {
          tokenHash,
          expiresAt: new Date(decoded.exp * 1000),
        },
      });
    }

    // Générer nouveaux tokens
    return this.buildResponse(user);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return; // Déjà déconnecté
    }

    try {
      // Hasher le token
      const tokenHash = this.hashToken(refreshToken);

      // Décoder pour obtenir l'expiration
      const decoded = this.jwtService.decode(refreshToken) as {
        exp?: number;
      } | null;

      if (!decoded || !decoded.exp) {
        return; // Token invalide, ignorer
      }

      // Ajouter à la blacklist
      await this.prisma.tokenBlacklist.create({
        data: {
          tokenHash,
          expiresAt: new Date(decoded.exp * 1000),
        },
      });
    } catch (error) {
      // Ignorer les erreurs (token déjà invalide)
      console.error('Logout error:', error);
    }
  }

  // ─── private helpers ──────────────────────────────────────────────────────

  private async buildResponse(user: User): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as Role, // 👈 add this
    };

    // Générer access token (courte durée)
    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    });

    // Générer refresh token (longue durée)
    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
