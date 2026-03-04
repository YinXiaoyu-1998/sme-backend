import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { PrismaClient, User } from '@prisma/client';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { RedisService } from '@redis/redis.service';
import * as jwt from 'jsonwebtoken';

const HASH_PREFIX = 'scrypt';
const SALT_BYTES = 16;
// Typical JWT TTLs: short-lived access token + longer refresh token
const DEFAULT_ACCESS_TTL_SECONDS = 15 * 60;
const DEFAULT_REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
const REFRESH_TOKEN_BYTES = 16;
const REFRESH_KEY_PREFIX = 'refresh:';

interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

type PublicUser = Pick<User, 'id' | 'email' | 'name' | 'isActive' | 'createdAt' | 'updatedAt'>;

interface AccessTokenPayload {
  sub: string;
  email: string;
  // Guard against mixing access/refresh tokens
  type: 'access';
}

interface RefreshTokenPayload {
  sub: string;
  // Token id used for server-side revocation
  jti: string;
  // Guard against mixing access/refresh tokens
  type: 'refresh';
}

@Injectable()
export class UserService {
  private readonly prisma: PrismaClient;
  private readonly redis: RedisService;
  private readonly jwtAccessSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly accessTokenTtlSeconds: number;
  private readonly refreshTokenTtlSeconds: number;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {
    this.prisma = prismaService.prisma;
    this.redis = redisService;
    // Separate secrets so access/refresh tokens are independently verifiable
    this.jwtAccessSecret = this.readRequiredEnv('JWT_ACCESS_SECRET');
    this.jwtRefreshSecret = this.readRequiredEnv('JWT_REFRESH_SECRET');
    this.accessTokenTtlSeconds = this.readNumberEnv(
      'JWT_ACCESS_TTL_SECONDS',
      DEFAULT_ACCESS_TTL_SECONDS,
    );
    this.refreshTokenTtlSeconds = this.readNumberEnv(
      'JWT_REFRESH_TTL_SECONDS',
      DEFAULT_REFRESH_TTL_SECONDS,
    );
  }

  async register(input: RegisterInput) {
    const email = this.normalizeEmail(input.email);
    this.validatePassword(input.password);

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        name: input.name?.trim() || null,
        passwordHash: this.hashPassword(input.password),
      },
    });

    return { user: this.toPublicUser(user) };
  }

  async login(input: LoginInput) {
    const email = this.normalizeEmail(input.email);
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!this.verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Access token is short-lived and used for Authorization: Bearer <token>
    const { token: accessToken, expiresAt: accessExpiresAt } = this.signAccessToken(user);
    const {
      token: refreshToken,
      tokenId: refreshTokenId,
      expiresAt: refreshExpiresAt,
    } = this.signRefreshToken(user);

    // Store refresh token id in Redis so it can be revoked/rotated
    await this.redis.set(
      `${REFRESH_KEY_PREFIX}${refreshTokenId}`,
      user.id,
      this.refreshTokenTtlSeconds,
    );

    return {
      accessToken,
      accessExpiresAt,
      refreshToken,
      refreshExpiresAt,
      user: this.toPublicUser(user),
    };
  }

  // Logout revokes the refresh token in Redis (access tokens expire naturally)
  async logout(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const payload = this.verifyRefreshToken(refreshToken);
    await this.redis.del(`${REFRESH_KEY_PREFIX}${payload.jti}`);

    return { success: true };
  }

  // Deactivate uses user injected by auth guard
  async deactivate(user: User) {

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isActive: false },
    });

    return { success: true };
  }

  // Access token is required to fetch current user
  async me(user: User) {
    return { user: this.toPublicUser(user) };
  }

  // Refresh exchanges a valid refresh token for new access+refresh tokens
  async refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const payload = this.verifyRefreshToken(refreshToken);
    const refreshKey = `${REFRESH_KEY_PREFIX}${payload.jti}`;
    const storedUserId = await this.redis.get(refreshKey);

    // Token is invalid if missing or not matching expected user
    if (!storedUserId || storedUserId !== payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is deactivated');
    }

    // Rotate refresh token: revoke old jti before issuing new one
    await this.redis.del(refreshKey);

    const { token: accessToken, expiresAt: accessExpiresAt } = this.signAccessToken(user);
    const {
      token: newRefreshToken,
      tokenId: newRefreshTokenId,
      expiresAt: refreshExpiresAt,
    } = this.signRefreshToken(user);

    await this.redis.set(
      `${REFRESH_KEY_PREFIX}${newRefreshTokenId}`,
      user.id,
      this.refreshTokenTtlSeconds,
    );

    return {
      accessToken,
      accessExpiresAt,
      refreshToken: newRefreshToken,
      refreshExpiresAt,
      user: this.toPublicUser(user),
    };
  }

  private normalizeEmail(email: string) {
    const trimmed = email?.trim().toLowerCase();
    if (!trimmed) {
      throw new BadRequestException('Email is required');
    }
    return trimmed;
  }

  private validatePassword(password: string) {
    if (!password || password.trim().length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
  }

  private hashPassword(password: string) {
    const salt = randomBytes(SALT_BYTES);
    const derived = scryptSync(password, salt, 64);
    return `${HASH_PREFIX}$${salt.toString('hex')}$${derived.toString('hex')}`;
  }

  private verifyPassword(password: string, stored: string) {
    const [prefix, saltHex, hashHex] = stored.split('$');
    if (prefix !== HASH_PREFIX || !saltHex || !hashHex) {
      return false;
    }

    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const derived = scryptSync(password, salt, expected.length);

    return timingSafeEqual(expected, derived);
  }

  private signAccessToken(user: User) {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    };
    // Signed JWT; backend can verify without DB lookup
    const token = jwt.sign(payload, this.jwtAccessSecret, {
      expiresIn: this.accessTokenTtlSeconds,
    });
    const expiresAt = new Date(Date.now() + this.accessTokenTtlSeconds * 1000);
    return { token, expiresAt };
  }

  private signRefreshToken(user: User) {
    const tokenId = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const payload: RefreshTokenPayload = {
      sub: user.id,
      jti: tokenId,
      type: 'refresh',
    };
    // Refresh tokens are also JWTs, but are stored server-side via jti
    const token = jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.refreshTokenTtlSeconds,
    });
    const expiresAt = new Date(Date.now() + this.refreshTokenTtlSeconds * 1000);
    return { token, tokenId, expiresAt };
  }

  private verifyRefreshToken(token: string) {
    try {
      const payload = jwt.verify(token, this.jwtRefreshSecret) as RefreshTokenPayload;
      if (payload.type !== 'refresh' || !payload.sub || !payload.jti) {
        throw new Error('Invalid refresh token');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private readRequiredEnv(name: string) {
    const value = process.env[name]?.trim();
    if (!value) {
      throw new Error(`${name} is required`);
    }
    return value;
  }

  private readNumberEnv(name: string, fallback: number) {
    const value = process.env[name]?.trim();
    if (!value) {
      return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
