import { Inject, Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

import type { AuthPayload } from '@truck-shipping/shared-types';
import type { AppConfig } from '@truck-shipping/shared-utils';

import { CONFIG_TOKEN } from '../config/config.module';

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(@Inject(CONFIG_TOKEN) private readonly config: AppConfig) {}

  use(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.slice(7);

    try {
      const payload = jwt.verify(token, this.config.JWT_SECRET) as AuthPayload;
      req.user = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    next();
  }
}
