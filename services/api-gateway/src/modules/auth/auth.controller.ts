import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { AuthTokens } from '@truck-shipping/shared-types';
import { loginSchema, refreshTokenSchema, registerSchema } from '@truck-shipping/shared-validators';

import { Public } from '../../decorators/public.decorator';

import { AuthService } from './auth.service';

@Controller('auth')
@ApiTags('Auth')
@Public()
@Throttle({ short: { limit: 10, ttl: 60_000 } })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'Account created — returns JWT tokens' })
  @ApiResponse({ status: 400, description: 'Validation error or email already taken' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(@Body() body: unknown): Promise<AuthTokens> {
    const input = registerSchema.parse(body);
    return this.authService.register(input);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and receive JWT tokens' })
  @ApiResponse({ status: 200, description: 'Login successful — returns JWT tokens' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(@Body() body: unknown): Promise<AuthTokens> {
    const input = loginSchema.parse(body);
    return this.authService.login(input);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'New access token issued' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() body: unknown): Promise<AuthTokens> {
    const { refreshToken } = refreshTokenSchema.parse(body);
    return this.authService.refresh(refreshToken);
  }
}
