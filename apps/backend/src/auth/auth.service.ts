import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
  HttpException,
  HttpStatus,
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
import { User } from '@prisma/client';
import { Role } from './enums/role.enum';
import { MatchingService } from '../matching/matching.service';
import { CreditsService } from '../credits/credits.service';

const BCRYPT_COST = 12; 
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; 

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly matchingService: MatchingService,
    private readonly creditsService: CreditsService,
  ) {}

  // POST /auth/register
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // on check si l'email existe deja
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException(
        'email deja utilise',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        referredById: dto.referredById ?? null,
      },
    });

    // bonus de parrainage pour le parrain
    if (dto.referredById) {
      this.logger.log(`Awarding referral bonus for new user ${user.id} to referrer ${dto.referredById}`);
      const referrer = await this.prisma.user.findUnique({
        where: { id: dto.referredById },
        select: { id: true, firstName: true },
      });

      if (referrer) {
        await this.creditsService.credit(
          referrer.id,
          5,
          'none', 
          'referral_bonus',
          `Bonus d'invitation pour l'inscription de ${user.firstName}`
        );
        // Mark the NEW user as having awarded their bonus
        await this.prisma.user.update({
          where: { id: user.id },
          data: { referralBonusAwarded: true },
        });
        this.logger.log(`Referral bonus of 5 credits awarded to ${referrer.id}`);
      } else {
        this.logger.warn(`Referrer ${dto.referredById} not found`);
      }
    }

    return this.buildResponse(user);
  }

  // POST /auth/login
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase();

    const user = await this.prisma.user.findUnique({ where: { email } });

    // on verifie si le compte est bloque
    if (user) {
      this.assertNotLocked(user);
    }

    if (!user) {
      // message generique pour pas dire si l'email existe
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatch) {
      await this.recordFailedAttempt(user);
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    // on check si le compte est actif
    if (!user.isActive) {
      throw new ForbiddenException(
        'compte desactive. contactez le support',
      );
    }

    // success : on reset les tentatives et on met a jour la date de login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    if (user.isOnboarded) {
      this.matchingService.recalculateForUser(user.id).catch(() => {});
    }

    return await this.buildResponse(user);
  }

  // POST /auth/refresh
  async refresh(refreshToken: string | undefined): Promise<AuthResponseDto> {
    if (!refreshToken) {
      throw new UnauthorizedException('pas de token de refresh');
    }

    // Check blacklist
    const tokenHash = this.hashToken(refreshToken);
    const blacklisted = await this.prisma.tokenBlacklist.findUnique({
      where: { tokenHash },
    });
    if (blacklisted) {
      throw new UnauthorizedException('token revoque');
    }

    // Verify signature + expiry
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('token invalide ou expire');
    }

    // User must still exist and be active
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('user non trouve ou inactif');
    }

    // Rotate: blacklist the old refresh token before issuing a new one
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

    return this.buildResponse(user);
  }

  // POST /auth/logout
  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;

    try {
      const tokenHash = this.hashToken(refreshToken);
      const decoded = this.jwtService.decode(refreshToken) as {
        exp?: number;
      } | null;

      if (!decoded?.exp) return;

      await this.prisma.tokenBlacklist.create({
        data: {
          tokenHash,
          expiresAt: new Date(decoded.exp * 1000),
        },
      });
    } catch (error) {
      // If the token is already expired/invalid, ignore — logout should always succeed
      console.error('Logout error:', error);
    }
  }

  // helpers pour le blocage de compte
  private assertNotLocked(user: User): void {
    if (
      user.failedLoginAttempts >= MAX_ATTEMPTS &&
      user.lockedUntil &&
      user.lockedUntil > new Date()
    ) {
      const minutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60_000,
      );
      throw new HttpException(
        `trop de tentatives. reessayez dans ${minutes} minute(s)`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  // on enregistre une tentative ratee
  private async recordFailedAttempt(user: User): Promise<void> {
    const newCount = user.failedLoginAttempts + 1;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newCount,
        // Only set lockedUntil when we just hit the limit — don't keep extending it
        ...(newCount === MAX_ATTEMPTS && {
          lockedUntil: new Date(Date.now() + BLOCK_DURATION_MS),
        }),
      },
    });
  }

  // helpers prives
  private async buildResponse(user: User): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as Role,
      avatarUrl: user.avatarUrl,
    };

    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '60m',
    });

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
        role: user.role as Role,
        isOnboarded: user.isOnboarded,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
