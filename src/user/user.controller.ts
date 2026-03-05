import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { UserService } from '@user/user.service';
import { AuthGuard } from '@common/guards/auth.guard';
import type { Request, Response } from 'express';
import type { User } from '@prisma/client';
import type {
  LogoutResponse,
  MeResponse,
  RegisterResponse,
  TokenResponse,
} from '@user/dto/user.responses';

interface RegisterBody {
  email: string;
  password: string;
  name?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

const REFRESH_COOKIE_NAME = 'refresh_token';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(
    @Body() body: RegisterBody,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RegisterResponse> {
    await this.userService.register(body);
    const result = await this.userService.login({ email: body.email, password: body.password });
    this.setRefreshCookie({ res, token: result.refreshToken, expiresAt: result.refreshExpiresAt });
    return {
      accessToken: result.accessToken,
      accessExpiresAt: result.accessExpiresAt,
      refreshExpiresAt: result.refreshExpiresAt,
      user: result.user,
    };
  }

  @Post('login')
  async login(
    @Body() body: LoginBody,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponse> {
    // Returns access + refresh tokens
    const result = await this.userService.login(body);
    this.setRefreshCookie({ res, token: result.refreshToken, expiresAt: result.refreshExpiresAt });
    return {
      accessToken: result.accessToken,
      accessExpiresAt: result.accessExpiresAt,
      refreshExpiresAt: result.refreshExpiresAt,
      user: result.user,
    };
  }

  @Post('logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) res: Response): Promise<LogoutResponse> {
    // Revoke refresh token in Redis
    const refreshToken = this.getRefreshTokenFromRequest(request);
    const result = await this.userService.logout(refreshToken);
    this.clearRefreshCookie(res);
    return result;
  }

  @Post('deactivate')
  @UseGuards(AuthGuard)
  async deactivate(@Req() request: Request): Promise<LogoutResponse> {
    // Access token required in Authorization header
    const user = (request as Request & { user: User }).user;
    return this.userService.deactivate(user);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() request: Request): Promise<MeResponse> {
    // Access token required in Authorization header
    const user = (request as Request & { user: User }).user;
    return this.userService.me(user);
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponse> {
    // Exchange refresh token for new access + refresh tokens
    const refreshToken = this.getRefreshTokenFromRequest(request);
    const result = await this.userService.refresh(refreshToken);
    this.setRefreshCookie({ res, token: result.refreshToken, expiresAt: result.refreshExpiresAt });
    return {
      accessToken: result.accessToken,
      accessExpiresAt: result.accessExpiresAt,
      refreshExpiresAt: result.refreshExpiresAt,
      user: result.user,
    };
  }

  @Get('test')
  @UseGuards(AuthGuard)
  test(): void {
    // Auth-only endpoint for connectivity checks
    return;
  }

  private getRefreshTokenFromRequest(request: Request) {
    return request.cookies?.[REFRESH_COOKIE_NAME];
  }

  private setRefreshCookie(params: { res: Response; token: string; expiresAt: Date }) {
    const { res, token, expiresAt } = params;
    res.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/user',
      expires: expiresAt,
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/user',
    });
  }
}
