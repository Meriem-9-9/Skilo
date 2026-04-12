import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  DefaultValuePipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AddSkillDto, UpdateSkillLevelDto } from './dto/skill.dto';
import { CreateSkillDto } from './dto/create-skill.dto';
import { RequestWithUser } from '../auth/types/request-with-user.type';
import { SkillsService } from '../skills/skills.service';

@UseGuards(JwtGuard) // All routes here require authentication
@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly skillsService: SkillsService,
  ) {}

  // ── Own profile ───────────────────────────────────────────────────────────

  @Get('users/me')
  getMe(@Request() req: RequestWithUser) {
    return this.usersService.getMe(req.user.sub);
  }

  @Patch('users/me')
  updateMe(@Body() dto: UpdateProfileDto, @Request() req: RequestWithUser) {
    return this.usersService.updateMe(req.user.sub, dto);
  }

  @Delete('users/me')
  @HttpCode(HttpStatus.OK)
  deleteMe(@Request() req: RequestWithUser) {
    return this.usersService.deleteMe(req.user.sub);
  }

  // ── Skills management ─────────────────────────────────────────────────────

  @Post('users/me/skills')
  @HttpCode(HttpStatus.CREATED)
  addSkill(@Body() dto: AddSkillDto, @Request() req: RequestWithUser) {
    return this.usersService.addSkill(req.user.sub, dto);
  }

  @Patch('users/me/skills/:userSkillId')
  updateSkillLevel(
    @Param('userSkillId', ParseUUIDPipe) userSkillId: string,
    @Body() dto: UpdateSkillLevelDto,
    @Request() req: RequestWithUser,
  ) {
    return this.usersService.updateSkillLevel(req.user.sub, userSkillId, dto);
  }

  @Delete('users/me/skills/:userSkillId')
  @HttpCode(HttpStatus.OK)
  removeSkill(
    @Param('userSkillId', ParseUUIDPipe) userSkillId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.usersService.removeSkill(req.user.sub, userSkillId);
  }

  // ── Public profiles ───────────────────────────────────────────────────────

  @Get('users')
  listUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.usersService.listUsers(page, limit);
  }

  // ⚠ /users/me must come before /users/:id so NestJS doesn't treat "me" as a UUID
  @Get('users/:id')
  getPublicProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.usersService.getPublicProfile(id, req.user.sub);
  }

  // ── Skills catalog ────────────────────────────────────────────────────────

  @Get('skills/search')
  searchSkills(@Query('q') q: string) {
    return this.skillsService.search(q);
  }

  @Post('skills')
  @HttpCode(HttpStatus.CREATED)
  createSkill(@Body() dto: CreateSkillDto, @Request() req: RequestWithUser) {
    return this.skillsService.create(dto, req.user.sub);
  }
}
