import { Request } from 'express';
import { JwtPayload } from './jwt-payload.type';

// Extends Express Request so req.user is fully typed
export type RequestWithUser = Request & {
  user: JwtPayload;
};
