// users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

// Sélection par défaut — jamais passwordHash, refreshToken, failedLoginAttempts, lockedUntil
const PUBLIC_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  city: true,
  bio: true,
  avatarUrl: true,
  isOnboarded: true,
  creditBalance: true,
  profileScore: true,
  avgRating: true,
  avgPedagogy: true,
  avgPunctuality: true,
  avgCommunication: true,
  sessionsCompleted: true,
  hasBadgeFiable: true,
  createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ─── GET /users ──────────────────────────────────────────────────────────────

  async findAll() {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: PUBLIC_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    return users;
  }

  // ─── GET /users/:id ──────────────────────────────────────────────────────────

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: PUBLIC_SELECT,
    });

    if (!user) throw new NotFoundException(`Utilisateur ${id} introuvable`);
    return user;
  }

  // ─── GET /users/me ───────────────────────────────────────────────────────────

  async findMe(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...PUBLIC_SELECT,
        // Champs supplémentaires visibles uniquement par soi-même
        creditReserved: true,
        lastLoginAt: true,
        isActive: true,
      },
    });

    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  // ─── PATCH /users/me ─────────────────────────────────────────────────────────

  async updateMe(id: string, dto: UpdateUserDto) {
    // Recalcul du profileScore après mise à jour
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
      select: PUBLIC_SELECT,
    });

    // Recalcul profileScore : photo+20, bio+20 (skills gérés ailleurs)
    const scoreFromProfile =
      (updated.avatarUrl ? 20 : 0) + (updated.bio ? 20 : 0);

    // On ne touche pas aux 60 pts skills ici, on fait un update partiel
    await this.prisma.user.update({
      where: { id },
      data: {
        profileScore: {
          // On récupère le score actuel et on remplace seulement les 40 pts profil
          set: await this.computeProfileScore(id, scoreFromProfile),
        },
      },
    });

    return this.findMe(id);
  }

  // ─── DELETE /users/me ────────────────────────────────────────────────────────
  // Soft delete : isActive = false

  async deleteMe(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        email: `deleted_${id}@deleted.local`, // Libère l'unicité de l'email
        updatedAt: new Date(),
      },
    });
    return { message: 'Compte désactivé avec succès' };
  }

  // ─── ADMIN : DELETE /users/:id ───────────────────────────────────────────────

  async deactivateUser(targetId: string, requesterId: string) {
    if (targetId === requesterId)
      throw new ForbiddenException(
        'Utilisez DELETE /users/me pour votre propre compte',
      );

    const user = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!user)
      throw new NotFoundException(`Utilisateur ${targetId} introuvable`);

    await this.prisma.user.update({
      where: { id: targetId },
      data: { isActive: false },
    });

    return { message: `Utilisateur ${targetId} désactivé` };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async computeProfileScore(
    userId: string,
    profilePts: number,
  ): Promise<number> {
    const skillsCount = await this.prisma.userSkill.count({
      where: { userId },
    });
    // 3 skills offered + 3 skills wanted = 60 pts max (30+30)
    // Simplifié ici : 10 pts par skill jusqu'à 60
    const skillPts = Math.min(skillsCount * 10, 60);
    return Math.min(profilePts + skillPts, 100);
  }
}
