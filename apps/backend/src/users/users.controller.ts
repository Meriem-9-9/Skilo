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
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard) // Toutes les routes protégées
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
  getMe(@CurrentUser() user: { id: string }) {
    return this.users.findMe(user.id);
  }

  // GET /users/:id → profil public d'un autre utilisateur
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.findOne(id);
  }

  // PATCH /users/me → mise à jour du profil
  @Patch('me')
  updateMe(@CurrentUser() user: { id: string }, @Body() dto: UpdateUserDto) {
    return this.users.updateMe(user.id, dto);
  }

  // DELETE /users/me → soft delete (isActive = false)
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  deleteMe(@CurrentUser() user: { id: string }) {
    return this.users.deleteMe(user.id);
  }
}
