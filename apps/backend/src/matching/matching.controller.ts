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
  constructor(private readonly matchingService: MatchingService) { }

  // GET /matches
  @Get()
  getMyMatches(
    @Query() filters: MatchFilterDto,
    @Request() req: RequestWithUser,
  ) {
    return this.matchingService.getMatchesForUser(req.user.sub, filters);
  }

  // GET /matches/:id
  @Get(':id')
  async getMatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser,
  ) {
    try {
      return await this.matchingService.getMatchById(id, req.user.sub);
    } catch (e: unknown) {
      if (e instanceof Error) {
        if (e.message === 'match non trouve')
          throw new NotFoundException('match non trouve');
        if (e.message === 'acces refuse') throw new ForbiddenException('acces refuse');
      }
      throw e;
    }
  }

  // GET /matches/user/:userId
  @Get('user/:userId')
  async getMatchByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.matchingService.getMatchBetweenUsers(req.user.sub, userId);
  }

  // POST /matches/recalculate
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Post('recalculate')
  @HttpCode(HttpStatus.OK)
  async recalculate(@Request() req: RequestWithUser) {
    await this.matchingService.recalculateForUser(req.user.sub);
    return { message: 'matching relance' };
  }
}
