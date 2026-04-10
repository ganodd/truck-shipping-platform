import { Injectable } from '@nestjs/common';
import { KycStatus, UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformStats() {
    const [totalUsers, usersByRole, loadsByStatus, shipmentsByStatus, revenueResult, totalBids] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
        this.prisma.load.groupBy({ by: ['status'], _count: { _all: true } }),
        this.prisma.shipment.groupBy({ by: ['status'], _count: { _all: true } }),
        this.prisma.shipment.aggregate({
          _sum: { agreedPrice: true },
          where: { status: 'DELIVERED' },
        }),
        this.prisma.bid.count(),
      ]);

    return {
      totalUsers,
      usersByRole: Object.fromEntries(usersByRole.map((r) => [r.role, r._count._all])) as Record<
        UserRole,
        number
      >,
      loadsByStatus: Object.fromEntries(loadsByStatus.map((r) => [r.status, r._count._all])),
      shipmentsByStatus: Object.fromEntries(
        shipmentsByStatus.map((r) => [r.status, r._count._all]),
      ),
      totalRevenueCents: revenueResult._sum.agreedPrice ?? 0,
      totalBids,
    };
  }

  async listUsers(page: number, limit: number, role?: string, kyc?: string) {
    const where = {
      ...(role ? { role: role as UserRole } : {}),
      ...(kyc ? { kycStatus: kyc as KycStatus } : {}),
    };
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          companyName: true,
          role: true,
          kycStatus: true,
          emailVerified: true,
          createdAt: true,
          shipperProfile: { select: { verified: true } },
          carrierProfile: { select: { verified: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, total };
  }

  async updateKycStatus(userId: string, kycStatus: KycStatus) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { kycStatus },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        kycStatus: true,
      },
    });
  }

  async listLoads(page: number, limit: number, status?: string) {
    const where = status ? { status: status as never } : {};
    const [loads, total] = await Promise.all([
      this.prisma.load.findMany({
        where,
        select: {
          id: true,
          status: true,
          equipmentType: true,
          weightLbs: true,
          pickupWindowStart: true,
          createdAt: true,
          origin: { select: { city: true, state: true } },
          destination: { select: { city: true, state: true } },
          shipper: {
            select: { user: { select: { firstName: true, lastName: true, email: true } } },
          },
          _count: { select: { bids: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.load.count({ where }),
    ]);
    return { loads, total };
  }
}
