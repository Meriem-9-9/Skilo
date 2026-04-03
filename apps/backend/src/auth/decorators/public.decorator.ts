// auth/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() — marque une route comme publique (pas de JWT requis)
 * Le JwtAuthGuard global vérifie ce metadata pour bypasser la vérification.
 *
 * Usage :
 *   @Public()
 *   @Post('login')
 *   login() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
