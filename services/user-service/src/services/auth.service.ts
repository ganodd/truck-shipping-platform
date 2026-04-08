import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import type { AuthPayload, AuthTokens } from '@truck-shipping/shared-types';
import { BCRYPT_ROUNDS, loadConfig } from '@truck-shipping/shared-utils';
import type { LoginInput, RegisterInput } from '@truck-shipping/shared-validators';

import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class AuthService {
  private readonly config = loadConfig();

  constructor(private readonly userRepository: UserRepository) {}

  async register(input: RegisterInput): Promise<AuthTokens> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const user = await this.userRepository.create({
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      companyName: input.companyName,
      // Create role-specific profile
      ...(input.role === 'SHIPPER' && {
        shipperProfile: { create: {} },
      }),
      ...(input.role === 'CARRIER' && {
        carrierProfile: { create: {} },
      }),
    });

    return this.issueTokens({ userId: user.id, email: user.email, role: user.role });
  }

  async login(input: LoginInput): Promise<AuthTokens> {
    const user = await this.userRepository.findByEmail(input.email.toLowerCase());

    if (!user) {
      // Timing-safe: still hash even when user not found
      await bcrypt.hash(input.password, BCRYPT_ROUNDS);
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokens({ userId: user.id, email: user.email, role: user.role });
  }

  async refresh(token: string): Promise<AuthTokens> {
    const stored = await this.userRepository.findRefreshToken(token);

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: delete old, issue new
    await this.userRepository.deleteRefreshToken(token);
    const { user } = stored;
    return this.issueTokens({ userId: user.id, email: user.email, role: user.role });
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.deleteAllRefreshTokens(userId);
  }

  private async issueTokens(payload: AuthPayload): Promise<AuthTokens> {
    const accessToken = jwt.sign(payload, this.config.JWT_SECRET, {
      expiresIn: this.config.JWT_ACCESS_EXPIRES_IN,
    } as jwt.SignOptions);

    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.userRepository.saveRefreshToken(payload.userId, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }
}
