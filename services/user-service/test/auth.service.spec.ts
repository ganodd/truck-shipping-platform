import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { UserRole } from '@truck-shipping/shared-types';
import type { RegisterInput } from '@truck-shipping/shared-validators';

import { UserRepository } from '../src/repositories/user.repository';
import { AuthService } from '../src/services/auth.service';

// Minimal mock env
process.env['DATABASE_URL'] = 'postgresql://x:x@localhost:5432/test';
process.env['REDIS_URL'] = 'redis://localhost:6379';
process.env['JWT_SECRET'] = 'test-secret-at-least-32-characters-long!!';

const mockUser = {
  id: 'user-1',
  email: 'alice@test.com',
  passwordHash: '$2a$12$placeholder',
  role: UserRole.SHIPPER,
  firstName: 'Alice',
  lastName: 'Test',
  phone: '+15551234567',
  companyName: null,
  kycStatus: 'NOT_SUBMITTED' as const,
  avatarUrl: null,
  emailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const mockRepo: Partial<jest.Mocked<UserRepository>> = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      saveRefreshToken: jest.fn(),
      findRefreshToken: jest.fn(),
      deleteRefreshToken: jest.fn(),
      deleteAllRefreshTokens: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: mockRepo },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
  });

  describe('register', () => {
    const registerInput: RegisterInput = {
      email: 'alice@test.com',
      password: 'Password123!',
      role: UserRole.SHIPPER,
      firstName: 'Alice',
      lastName: 'Test',
      phone: '+15551234567',
    };

    it('creates user and returns tokens when email is unique', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);
      userRepository.saveRefreshToken.mockResolvedValue(undefined);

      const result = await authService.register(registerInput);

      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(result.expiresIn).toBe(900);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'alice@test.com', role: 'SHIPPER' }),
      );
    });

    it('throws ConflictException when email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.register(registerInput)).rejects.toThrow(ConflictException);
    });

    it('hashes password before storing', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);
      userRepository.saveRefreshToken.mockResolvedValue(undefined);

      await authService.register(registerInput);

      const createCall = userRepository.create.mock.calls[0]?.[0];
      expect(createCall?.passwordHash).not.toBe('Password123!');
      expect(createCall?.passwordHash).toMatch(/^\$2[ab]\$12\$/);
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException when user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login({ email: 'ghost@test.com', password: 'Password123!' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      userRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        // bcrypt hash of 'CorrectPassword123!'
        passwordHash: '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
      });

      await expect(authService.login({ email: 'alice@test.com', password: 'WrongPassword!' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('throws UnauthorizedException when token not found', async () => {
      userRepository.findRefreshToken.mockResolvedValue(null);

      await expect(authService.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when token is expired', async () => {
      const expired = new Date(Date.now() - 1000);
      userRepository.findRefreshToken.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        token: 'expired-token',
        expiresAt: expired,
        createdAt: new Date(),
        user: mockUser,
      });

      await expect(authService.refresh('expired-token')).rejects.toThrow(UnauthorizedException);
    });

    it('rotates refresh token and returns new tokens', async () => {
      const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      userRepository.findRefreshToken.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        token: 'valid-token',
        expiresAt: future,
        createdAt: new Date(),
        user: mockUser,
      });
      userRepository.deleteRefreshToken.mockResolvedValue(undefined);
      userRepository.saveRefreshToken.mockResolvedValue(undefined);

      const result = await authService.refresh('valid-token');

      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).not.toBe('valid-token');
      expect(userRepository.deleteRefreshToken).toHaveBeenCalledWith('valid-token');
    });
  });
});
