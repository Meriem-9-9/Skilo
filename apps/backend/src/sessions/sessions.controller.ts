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
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RequestWithUser } from '../auth/types/request-with-user.type';

@UseGuards(JwtGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  // POST /sessions
  @Post()
  @HttpCode(HttpStatus.CREATED)
  propose(@Body() dto: ProposeSessionDto, @Request() req: RequestWithUser) {
    return this.sessionsService.propose(req.user.sub, dto);
  }

  // GET /sessions
  @Get()
  getMySessions(
    @Query() filters: SessionFilterDto,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionsService.getMySessions(req.user.sub, filters);
  }

  // GET /sessions/:id
  @Get(':id')
  getSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionsService.findOne(id, req.user.sub);
  }

  // PATCH /sessions/:id/accept
  @Patch(':id/accept')
  @HttpCode(HttpStatus.OK)
  accept(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionsService.accept(id, req.user.sub);
  }

  // PATCH /sessions/:id/decline
  @Patch(':id/decline')
  @HttpCode(HttpStatus.OK)
  decline(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeclineCancelDto,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionsService.decline(id, req.user.sub, dto);
  }

  // PATCH /sessions/:id/cancel
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeclineCancelDto,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionsService.cancel(id, req.user.sub, dto);
  }

  // PATCH /sessions/:id/confirm
  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmSessionDto,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionsService.confirm(id, req.user.sub, dto);
  }

  // GET /sessions/:id/messages
  @Get(':id/messages')
  getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionsService.getMessages(id, req.user.sub);
  }

  // POST /sessions/:id/messages
  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  createMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMessageDto,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionsService.createMessage(id, req.user.sub, dto);
  }
}
