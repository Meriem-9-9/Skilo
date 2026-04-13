// reviews.controller.ts
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
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RequestWithUser } from '../auth/types/request-with-user.type';

@UseGuards(JwtGuard)
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // POST /reviews
  @Post('reviews')
  @HttpCode(HttpStatus.CREATED)
  submit(@Body() dto: SubmitReviewDto, @Request() req: RequestWithUser) {
    return this.reviewsService.submit(req.user.sub, dto);
  }

  // GET /reviews/session/:sessionId
  @Get('reviews/session/:sessionId')
  getForSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.reviewsService.getForSession(sessionId, req.user.sub);
  }

  // GET /users/:id/reviews — sits in ReviewsController but uses /users prefix
  @Get('users/:id/reviews')
  getForUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.reviewsService.getForUser(id, page, limit);
  }
}
