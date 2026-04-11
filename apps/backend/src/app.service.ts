import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prismaService: PrismaService) {}
  async getHello() {
    return await this.prismaService.user.findMany();
  }
}
