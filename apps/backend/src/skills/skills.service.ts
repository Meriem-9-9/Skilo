import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { SkillStatus } from '@prisma/client';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  // GET /skills/search
  async search(q?: string) {
    if (!q || q.trim().length === 0) {
      // No query → return top 100 approved skills sorted by usageCount then name
      return this.prisma.skillCatalog.findMany({
        where: { status: 'approved' },
        orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
        take: 100,
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

    // recherche par nom  ou par alias 
    return this.prisma.skillCatalog.findMany({
      where: {
        status: 'approved',
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { aliases: { has: term } },
        ],
      },
      orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
      take: 100,
      select: {
        id: true,
        name: true,
        category: true,
        aliases: true,
        usageCount: true,
      },
    });
  }

  // GET /skills
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

  // GET /skills/pending
  async findPending(page = 1, limit = 20) {
    return this.findAll('pending_review', page, limit);
  }

  // POST /skills
  async create(dto: CreateSkillDto, createdById: string) {
    // Case-insensitive duplicate check
    const existing = await this.prisma.skillCatalog.findFirst({
      where: { name: { equals: dto.name.trim(), mode: 'insensitive' } },
      select: { id: true, name: true, category: true, status: true },
    });

    if (existing) {
      return {
        message: 'cette competence existe deja',
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
        'competence soumise pour validation',
      alreadyExists: false,
      skill,
    };
  }

  // PATCH /skills/:id/approve
  async approve(skillId: string) {
    const skill = await this.findByIdOrThrow(skillId);

    if (skill.status === 'approved') {
      throw new BadRequestException('deja approuvee');
    }

    const updated = await this.prisma.skillCatalog.update({
      where: { id: skillId },
      data: { status: 'approved' },
      select: { id: true, name: true, category: true, status: true },
    });

    return {
      message: `competence "${updated.name}" approuvee`,
      skill: updated,
    };
  }

  // PATCH /skills/:id/reject
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
      message: `competence "${updated.name}" rejetee`,
      reason: reason ?? null,
      skill: updated,
    };
  }

  // PATCH /skills/:id/aliases
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
    if (!skill) throw new NotFoundException('competence non trouvee');
    return skill;
  }
}
