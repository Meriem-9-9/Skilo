import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { ProposeSessionDto } from './dto/propose-session.dto';
import { ConfirmSessionDto } from './dto/confirm-session.dto';
import { DeclineCancelDto, SessionFilterDto } from './dto/session-filter.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RequestWithUser } from '../auth/types/request-with-user.type';

@UseGuards(JwtGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  propose(@Body() dto: ProposeSessionDto, @Request() req: RequestWithUser) {
    return this.sessionsService.propose(req.user.sub, dto);
  }

  @Get()
  getMySessions(
    @Query() filters: SessionFilterDto,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionsService.getMySessions(req.user.sub, filters);
  }

  @Get(':id')
  getSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionsService.getSessionById(id, req.user.sub);
  }

  @Patch(':id/accept')
  @HttpCode(HttpStatus.OK)
  accept(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionsService.accept(id, req.user.sub);
  }

  @Patch(':id/decline')
  @HttpCode(HttpStatus.OK)
  decline(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeclineCancelDto,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionsService.decline(id, req.user.sub, dto);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeclineCancelDto,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionsService.cancel(id, req.user.sub, dto);
  }

  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmSessionDto,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionsService.confirm(id, req.user.sub, dto);
  }
}
