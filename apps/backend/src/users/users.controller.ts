// users/users.controller.ts
import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequestWithUser } from '../auth/types/request-with-user.type';
import { UsersService } from './users.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

@UseGuards(JwtGuard) // Toutes les routes protégées
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  // GET /users → liste publique (utilisateurs actifs)
  @Get()
  findAll() {
    return this.users.findAll();
  }

  // GET /users/me → profil complet de l'utilisateur connecté
  @Get('me')
  getMe(@Req() req: RequestWithUser) {
    return this.users.findMe(req.user.sub);
  }

  // GET /users/:id → profil public d'un autre utilisateur
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.findOne(id);
  }

  // PATCH /users/me → mise à jour du profil
  @Patch('me')
  updateMe(@Req() req: RequestWithUser, @Body() dto: UpdateUserDto) {
    return this.users.updateMe(req.user.sub, dto);
  }

  // DELETE /users/me → soft delete (isActive = false)
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  deleteMe(@Req() req: RequestWithUser) {
    return this.users.deleteMe(req.user.sub);
  }
}
