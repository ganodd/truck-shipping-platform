import { Injectable } from '@nestjs/common';
import { BidStatus } from '@prisma/client';

import type { CreateBidInput } from '@truck-shipping/shared-validators';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BidRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(carrierId: string, input: CreateBidInput) {
    return this.prisma.bid.create({
      data: {
        loadId: input.loadId,
        carrierId,
        amount: Math.round(input.amount * 100), // store in cents
        estimatedPickup: input.estimatedPickup,
        estimatedDelivery: input.estimatedDelivery,
        notes: input.notes,
        status: BidStatus.PENDING,
      },
      include: {
        carrier: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.bid.findUnique({
      where: { id },
      include: {
        load: { include: { shipper: true } },
        carrier: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });
  }

  async findByLoad(loadId: string) {
    return this.prisma.bid.findMany({
      where: { loadId },
      orderBy: { amount: 'asc' },
      include: {
        carrier: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
            vehicles: { where: { active: true }, select: { type: true, capacityTons: true } },
          },
        },
      },
    });
  }

  async findByCarrier(carrierId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [bids, total] = await Promise.all([
      this.prisma.bid.findMany({
        where: { carrierId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          load: {
            select: {
              id: true,
              origin: true,
              destination: true,
              equipmentType: true,
              weightLbs: true,
              pickupWindowStart: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.bid.count({ where: { carrierId } }),
    ]);
    return { bids, total };
  }

  async countPendingByCarrier(carrierId: string) {
    return this.prisma.bid.count({ where: { carrierId, status: BidStatus.PENDING } });
  }

  async existsForLoadAndCarrier(loadId: string, carrierId: string) {
    const bid = await this.prisma.bid.findFirst({
      where: { loadId, carrierId, status: { in: [BidStatus.PENDING, BidStatus.ACCEPTED] } },
    });
    return bid !== null;
  }

  async updateStatus(id: string, status: BidStatus) {
    return this.prisma.bid.update({ where: { id }, data: { status } });
  }

  async rejectAllPendingForLoad(loadId: string, excludeBidId: string) {
    await this.prisma.bid.updateMany({
      where: { loadId, status: BidStatus.PENDING, id: { not: excludeBidId } },
      data: { status: BidStatus.REJECTED },
    });
  }
}
