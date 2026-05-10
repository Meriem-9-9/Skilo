import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { RequestWithUser } from '../../auth/types/request-with-user.type';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OnboardingGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.user?.sub;

    if (!userId) return false;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isOnboarded: true },
    });

    if (!user?.isOnboarded) {
      throw new ForbiddenException({
        message: "vous devez d'abord completer votre onboarding",
        redirectTo: '/onboarding',
      });
    }

    return true;
  }
}
