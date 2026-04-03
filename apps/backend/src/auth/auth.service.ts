// auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { AuthUser } from './types/auth-user.type';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

// Champs publics renvoyés dans toutes les réponses auth
const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  city: true,
  avatarUrl: true,
  isOnboarded: true,
  onboardingStep: true,
  creditBalance: true,
  profileScore: true,
  createdAt: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // REGISTER
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) throw new ConflictException('Email déjà utilisé');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        emailLower: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      select: USER_SELECT,
    });

    const tokens = await this.generateTokens(user.id, user.email);
    return { user, ...tokens };
  }

  // VALIDATE USER (appelé par LocalStrategy)
  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) return null;

    // Bruteforce protection (FC-01-B)
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException(
        `Compte verrouillé jusqu'à ${user.lockedUntil.toISOString()}`,
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil: shouldLock
            ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
            : undefined,
        },
      });

      return null;
    }

    // Réinitialise le compteur après succès
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    return user;
  }

  // ─────────────────────────────────────────────
  // LOGIN — retourne access_token + refresh_token + user
  // ─────────────────────────────────────────────
  async login(authUser: AuthUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.id },
      select: USER_SELECT,
    });

    const tokens = await this.generateTokens(authUser.id, authUser.email);
    return { user, ...tokens };
  }

  // ─────────────────────────────────────────────
  // REFRESH — valide le refresh token et émet un nouvel access token
  // ─────────────────────────────────────────────
  async refresh(refreshToken: string) {
    // 1. Vérifie la signature JWT du refresh token
    let payload: { sub: string; email: string; type: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Type de token incorrect');
    }

    // 2. Vérifie que le token n'est pas blacklisté
    const tokenHash = this.hashToken(refreshToken);
    const blacklisted = await this.prisma.tokenBlacklist.findUnique({
      where: { tokenHash },
    });
    if (blacklisted) throw new UnauthorizedException('Token révoqué');

    // 3. Vérifie que l'utilisateur existe toujours
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: USER_SELECT,
    });
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');

    // 4. Émet un nouvel access token (rotation partielle : refresh token inchangé)
    const accessToken = this.signAccessToken(payload.sub, payload.email);

    return { user, access_token: accessToken };
  }

  // ─────────────────────────────────────────────
  // LOGOUT — blackliste le refresh token
  // ─────────────────────────────────────────────
  async logout(refreshToken: string) {
    let payload: { exp: number };
    try {
      payload = this.jwt.decode(refreshToken);
    } catch {
      return; // Token malformé : pas grave, on ignore
    }

    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(payload.exp * 1000);

    // Upsert : évite les doublons si logout appelé deux fois
    await this.prisma.tokenBlacklist.upsert({
      where: { tokenHash },
      create: { tokenHash, expiresAt },
      update: {},
    });
  }

  // ─────────────────────────────────────────────
  // ME — retourne le profil courant depuis le JWT
  // ─────────────────────────────────────────────
  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    return { user };
  }

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────
  private async generateTokens(userId: string, email: string) {
    const [access_token, refresh_token] = await Promise.all([
      Promise.resolve(this.signAccessToken(userId, email)),
      Promise.resolve(this.signRefreshToken(userId, email)),
    ]);
    return { access_token, refresh_token };
  }

  private signAccessToken(userId: string, email: string): string {
    return this.jwt.sign(
      { sub: userId, email, type: 'access' },
      {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      },
    );
  }

  private signRefreshToken(userId: string, email: string): string {
    return this.jwt.sign(
      { sub: userId, email, type: 'refresh' },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );
  }

  /** SHA-256 du token — jamais stocké en clair */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
