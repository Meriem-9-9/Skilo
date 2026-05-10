import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CreditsService } from './credits.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RequestWithUser } from '../auth/types/request-with-user.type';

@UseGuards(JwtGuard)
@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  // GET /credits/balance
  @Get('balance')
  getBalance(@Request() req: RequestWithUser) {
    return this.creditsService.getBalance(req.user.sub);
  }

  // GET /credits/history
  @Get('history')
  getHistory(
    @Request() req: RequestWithUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.creditsService.getHistory(req.user.sub, page, limit);
  }
}
