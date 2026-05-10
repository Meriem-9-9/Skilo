import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingDto } from './dto/onboarding.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RequestWithUser } from '../auth/types/request-with-user.type';

@UseGuards(JwtGuard) 
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  // GET /onboarding/status
  @Get('status')
  @HttpCode(HttpStatus.OK)
  getStatus(@Request() req: RequestWithUser) {
    return this.onboardingService.getStatus(req.user.sub);
  }

  // POST /onboarding
  @Post()
  @HttpCode(HttpStatus.CREATED)
  complete(@Body() dto: OnboardingDto, @Request() req: RequestWithUser) {
    return this.onboardingService.complete(req.user.sub, dto);
  }
}
