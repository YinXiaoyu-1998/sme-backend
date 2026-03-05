import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import * as jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { Request } from 'express';

interface AccessTokenPayload {
  sub: string;
  email: string;
  type: 'access';
}

interface AuthenticatedRequest extends Request {
  user?: User;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly jwtAccessSecret: string;

  constructor(private readonly prismaService: PrismaService) {
    this.jwtAccessSecret = this.readRequiredEnv('JWT_ACCESS_SECRET');
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.parseBearerToken(request.headers?.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    const payload = this.verifyAccessToken(token);
    const user = await this.prismaService.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is deactivated');
    }

    request.user = user;
    return true;
  }

  private verifyAccessToken(token: string) {
    try {
      const payload = jwt.verify(token, this.jwtAccessSecret) as AccessTokenPayload;
      if (payload.type !== 'access' || !payload.sub) {
        throw new Error('Invalid access token');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private parseBearerToken(authorization?: string) {
    if (!authorization) {
      return null;
    }
    // Expect: "Bearer <token>"
    const [scheme, value] = authorization.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !value) {
      return null;
    }
    return value.trim();
  }

  private readRequiredEnv(name: string) {
    const value = process.env[name]?.trim();
    if (!value) {
      throw new Error(`${name} is required`);
    }
    return value;
  }
}
