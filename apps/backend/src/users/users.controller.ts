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

@UseGuards(JwtGuard)
@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly skillsService: SkillsService,
  ) {}

  // GET /users/me
  @Get('users/me')
  getMe(@Request() req: RequestWithUser) {
    return this.usersService.getMe(req.user.sub);
  }

  // PATCH /users/me
  @Patch('users/me')
  updateMe(@Body() dto: UpdateProfileDto, @Request() req: RequestWithUser) {
    return this.usersService.updateMe(req.user.sub, dto);
  }

  // DELETE /users/me
  @Delete('users/me')
  @HttpCode(HttpStatus.OK)
  deleteMe(@Request() req: RequestWithUser) {
    return this.usersService.deleteMe(req.user.sub);
  }

  // POST /users/me/skills
  @Post('users/me/skills')
  @HttpCode(HttpStatus.CREATED)
  addSkill(@Body() dto: AddSkillDto, @Request() req: RequestWithUser) {
    return this.usersService.addSkill(req.user.sub, dto);
  }

  // PATCH /users/me/skills/:id
  @Patch('users/me/skills/:userSkillId')
  updateSkillLevel(
    @Param('userSkillId', ParseUUIDPipe) userSkillId: string,
    @Body() dto: UpdateSkillLevelDto,
    @Request() req: RequestWithUser,
  ) {
    return this.usersService.updateSkillLevel(req.user.sub, userSkillId, dto);
  }

  // DELETE /users/me/skills/:id
  @Delete('users/me/skills/:userSkillId')
  @HttpCode(HttpStatus.OK)
  removeSkill(
    @Param('userSkillId', ParseUUIDPipe) userSkillId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.usersService.removeSkill(req.user.sub, userSkillId);
  }

  // GET /users
  @Get('users')
  listUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.usersService.listUsers(page, limit);
  }

  // GET /users/:id
  @Get('users/:id')
  getPublicProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.usersService.getPublicProfile(id, req.user.sub);
  }

  // GET /skills/search
  @Get('skills/search')
  searchSkills(@Query('q') q: string) {
    return this.skillsService.search(q);
  }

  // POST /skills
  @Post('skills')
  @HttpCode(HttpStatus.CREATED)
  createSkill(@Body() dto: CreateSkillDto, @Request() req: RequestWithUser) {
    return this.skillsService.create(dto, req.user.sub);
  }
}
