import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { MatchingService } from './matching.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { RequestWithUser } from '../auth/types/request-with-user.type';
import { MatchFilterDto } from './dto/match-filter.dto';

@UseGuards(JwtGuard)
@Controller('matches')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  // GET /matches — own match list (paginated, filtered)
  @Get()
  getMyMatches(
    @Query() filters: MatchFilterDto,
    @Request() req: RequestWithUser,
  ) {
    return this.matchingService.getMatchesForUser(req.user.sub, filters);
  }

  // GET /matches/:id — single match detail
  @Get(':id')
  async getMatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser,
  ) {
    try {
      return await this.matchingService.getMatchById(id, req.user.sub);
    } catch (e: unknown) {
      if (e instanceof Error) {
        if (e.message === 'Match not found')
          throw new NotFoundException('Match not found');
        if (e.message === 'Forbidden') throw new ForbiddenException();
      }
      throw e;
    }
  }

  // POST /matches/recalculate — admin trigger for manual recalculation
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Post('recalculate')
  @HttpCode(HttpStatus.OK)
  async recalculate(@Request() req: RequestWithUser) {
    // Admin triggers a full recalculation for themselves (or could be extended
    // to accept a userId param to recalculate for any user)
    await this.matchingService.recalculateForUser(req.user.sub);
    return { message: 'Matching recalculation triggered.' };
  }
}
