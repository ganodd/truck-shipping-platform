import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AuthTokens } from '@truck-shipping/shared-types';
import { loginSchema, refreshTokenSchema, registerSchema } from '@truck-shipping/shared-validators';

import { Public } from '../../decorators/public.decorator';
import { AuthService } from './auth.service';

@Controller('auth')
@ApiTags('Auth')
@Public()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  async register(@Body() body: unknown): Promise<AuthTokens> {
    const input = registerSchema.parse(body);
    return this.authService.register(input);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and receive JWT tokens' })
  async login(@Body() body: unknown): Promise<AuthTokens> {
    const input = loginSchema.parse(body);
    return this.authService.login(input);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refresh(@Body() body: unknown): Promise<AuthTokens> {
    const { refreshToken } = refreshTokenSchema.parse(body);
    return this.authService.refresh(refreshToken);
  }
}
