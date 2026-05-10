import { Request } from 'express';
import { JwtPayload } from './jwt-payload.type';

export type RequestWithUser = Request & {
  user: JwtPayload;
};
