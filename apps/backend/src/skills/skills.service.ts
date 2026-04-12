import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { SkillStatus } from 'generated/prisma/enums';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── GET /skills/search?q= ────────────────────────────────────────────────
  // Any authenticated user — used by onboarding, profile edit, autocomplete
  // Returns top 10 approved skills sorted by usageCount (most used first)
  async search(q?: string) {
    if (!q || q.trim().length === 0) {
      // No query → return top 10 most popular approved skills
      return this.prisma.skillCatalog.findMany({
        where: { status: 'approved' },
        orderBy: { usageCount: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          category: true,
          aliases: true,
          usageCount: true,
        },
      });
    }

    const term = q.trim();

    // Search by name (case-insensitive) OR aliases array contains the term
    return this.prisma.skillCatalog.findMany({
      where: {
        status: 'approved',
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { aliases: { has: term } },
        ],
      },
      orderBy: { usageCount: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        category: true,
        aliases: true,
        usageCount: true,
      },
    });
  }

  // ─── GET /skills (paginated full list — admin) ────────────────────────────
  async findAll(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where = status ? { status: status as SkillStatus } : {};

    const [skills, total] = await this.prisma.$transaction([
      this.prisma.skillCatalog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          category: true,
          status: true,
          aliases: true,
          usageCount: true,
          createdAt: true,
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.skillCatalog.count({ where }),
    ]);

    return {
      data: skills,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── GET /skills/pending (admin shortcut) ─────────────────────────────────
  // Skills waiting for review — most recent first
  async findPending(page = 1, limit = 20) {
    return this.findAll('pending_review', page, limit);
  }

  // ─── POST /skills ─────────────────────────────────────────────────────────
  // Any authenticated user — creates with status pending_review
  // If the skill already exists (approved or pending) → return it instead of duplicating
  async create(dto: CreateSkillDto, createdById: string) {
    // Case-insensitive duplicate check
    const existing = await this.prisma.skillCatalog.findFirst({
      where: { name: { equals: dto.name.trim(), mode: 'insensitive' } },
      select: { id: true, name: true, category: true, status: true },
    });

    if (existing) {
      return {
        message: 'Cette compétence existe déjà.',
        alreadyExists: true,
        skill: existing,
      };
    }

    const skill = await this.prisma.skillCatalog.create({
      data: {
        name: dto.name.trim(),
        category: dto.category,
        status: 'pending_review',
        aliases: dto.aliases ?? [],
        createdById,
      },
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
        aliases: true,
      },
    });

    return {
      message:
        'Compétence soumise pour validation. Elle sera disponible après revue par un administrateur.',
      alreadyExists: false,
      skill,
    };
  }

  // ─── PATCH /skills/:id/approve (admin only) ───────────────────────────────
  async approve(skillId: string) {
    const skill = await this.findByIdOrThrow(skillId);

    if (skill.status === 'approved') {
      throw new BadRequestException('This skill is already approved.');
    }

    const updated = await this.prisma.skillCatalog.update({
      where: { id: skillId },
      data: { status: 'approved' },
      select: { id: true, name: true, category: true, status: true },
    });

    return {
      message: `Compétence "${updated.name}" approuvée avec succès.`,
      skill: updated,
    };
  }

  // ─── PATCH /skills/:id/reject (admin only) ────────────────────────────────
  async reject(skillId: string, reason?: string) {
    const skill = await this.findByIdOrThrow(skillId);

    if (skill.status === 'rejected') {
      throw new BadRequestException('This skill is already rejected.');
    }

    const updated = await this.prisma.skillCatalog.update({
      where: { id: skillId },
      data: { status: 'rejected' },
      select: { id: true, name: true, category: true, status: true },
    });

    return {
      message: `Compétence "${updated.name}" rejetée.`,
      reason: reason ?? null,
      skill: updated,
    };
  }

  // ─── PATCH /skills/:id/aliases (admin only) ───────────────────────────────
  // Admin can add aliases to improve autocomplete matching
  // e.g. add "JS" and "ECMAScript" to the JavaScript skill
  async updateAliases(skillId: string, aliases: string[]) {
    await this.findByIdOrThrow(skillId);

    const updated = await this.prisma.skillCatalog.update({
      where: { id: skillId },
      data: { aliases },
      select: { id: true, name: true, aliases: true },
    });

    return {
      message: 'Aliases updated.',
      skill: updated,
    };
  }

  // ─── Private helper ───────────────────────────────────────────────────────
  private async findByIdOrThrow(skillId: string) {
    const skill = await this.prisma.skillCatalog.findUnique({
      where: { id: skillId },
      select: { id: true, name: true, status: true },
    });
    if (!skill) throw new NotFoundException('Skill not found');
    return skill;
  }
}
