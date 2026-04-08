import { Injectable, NotFoundException } from '@nestjs/common';

import type { UpdateProfileInput } from '@truck-shipping/shared-validators';

import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getProfile(userId: string) {
    const user = await this.userRepository.findWithProfiles(userId);
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash: _pw, ...safe } = user;
    return safe;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await this.userRepository.update(userId, input);
    const { passwordHash: _pw, ...safe } = user;
    return safe;
  }

  async getPublicProfile(userId: string) {
    const profile = await this.userRepository.getPublicProfile(userId);
    if (!profile) throw new NotFoundException('User not found');
    return profile;
  }
}
