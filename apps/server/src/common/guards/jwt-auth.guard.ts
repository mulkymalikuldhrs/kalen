/**
 * KALEN Server — JWT Auth Guard
 * Validates JWT tokens on protected routes using @kalen/identity verifyToken.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@kalen/identity';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;

    if (!authHeader) {
      throw new UnauthorizedException({
        error: 'UNAUTHORIZED',
        message: 'Missing Authorization header',
      });
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException({
        error: 'UNAUTHORIZED',
        message: 'Invalid Authorization header format. Expected: Bearer <token>',
      });
    }

    const jwtSecret = this.configService.get<string>('jwt.secret')!;
    const payload = await verifyToken(token, jwtSecret);

    if (!payload) {
      throw new UnauthorizedException({
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      });
    }

    if (payload.tokenType !== 'access') {
      throw new UnauthorizedException({
        error: 'UNAUTHORIZED',
        message: 'Access token required (not refresh token)',
      });
    }

    // Attach the decoded payload to the request for downstream use
    request.identity = payload;

    return true;
  }
}
