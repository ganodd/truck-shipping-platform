import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async findWithProfiles(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        shipperProfile: true,
        carrierProfile: true,
      },
    });
  }

  async saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await this.prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  }

  async findRefreshToken(token: string) {
    return this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.delete({ where: { token } });
  }

  async deleteAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async getPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
        role: true,
        kycStatus: true,
        createdAt: true,
        shipperProfile: { select: { verified: true } },
        carrierProfile: { select: { verified: true } },
        receivedRatings: { select: { score: true } },
      },
    });

    if (!user) return null;

    const totalRatings = user.receivedRatings.length;
    const averageRating =
      totalRatings > 0
        ? user.receivedRatings.reduce((sum, r) => sum + r.score, 0) / totalRatings
        : undefined;

    const verified = user.shipperProfile?.verified ?? user.carrierProfile?.verified ?? false;

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.companyName,
      role: user.role,
      kycStatus: user.kycStatus,
      averageRating,
      totalRatings,
      verified,
      createdAt: user.createdAt,
    };
  }
}
