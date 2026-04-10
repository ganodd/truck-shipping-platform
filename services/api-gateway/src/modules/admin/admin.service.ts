import { Injectable, NotFoundException } from '@nestjs/common';
import { KycStatus } from '@prisma/client';

import { AdminRepository } from './admin.repository';

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  async getStats() {
    return this.adminRepository.getPlatformStats();
  }

  async listUsers(page: number, limit: number, role?: string, kyc?: string) {
    const { users, total } = await this.adminRepository.listUsers(page, limit, role, kyc);
    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async approveKyc(userId: string) {
    try {
      return await this.adminRepository.updateKycStatus(userId, KycStatus.APPROVED);
    } catch {
      throw new NotFoundException(`User ${userId} not found`);
    }
  }

  async rejectKyc(userId: string) {
    try {
      return await this.adminRepository.updateKycStatus(userId, KycStatus.REJECTED);
    } catch {
      throw new NotFoundException(`User ${userId} not found`);
    }
  }

  async listLoads(page: number, limit: number, status?: string) {
    const { loads, total } = await this.adminRepository.listLoads(page, limit, status);
    return {
      data: loads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }
}
