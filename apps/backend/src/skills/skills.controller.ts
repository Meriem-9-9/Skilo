import {
  Body,
  Controller,
  DefaultValuePipe,
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
} from '@nestjs/common';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { RejectSkillDto } from './dto/reject-skill.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { RequestWithUser } from '../auth/types/request-with-user.type';

@UseGuards(JwtGuard) 
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  // GET /skills/search
  @Get('search')
  search(@Query('q') q?: string) {
    return this.skillsService.search(q);
  }

  // POST /skills
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSkillDto, @Request() req: RequestWithUser) {
    return this.skillsService.create(dto, req.user.sub);
  }

  // GET /skills
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.skillsService.findAll(status, page, limit);
  }

  // GET /skills/pending
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get('pending')
  findPending(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.skillsService.findPending(page, limit);
  }

  // PATCH /skills/:id/approve
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.skillsService.approve(id);
  }

  // PATCH /skills/:id/reject
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RejectSkillDto) {
    return this.skillsService.reject(id, dto.reason);
  }

  // PATCH /skills/:id/aliases
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Patch(':id/aliases')
  @HttpCode(HttpStatus.OK)
  updateAliases(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('aliases') aliases: string[],
  ) {
    return this.skillsService.updateAliases(id, aliases);
  }
}
