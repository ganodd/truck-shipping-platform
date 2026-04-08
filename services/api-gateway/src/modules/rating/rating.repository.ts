import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RatingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByShipment(shipmentId: string) {
    return this.prisma.rating.findMany({
      where: { shipmentId },
      include: {
        fromUser: { select: { id: true, firstName: true, lastName: true } },
        toUser: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findByUser(toUserId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [ratings, total] = await Promise.all([
      this.prisma.rating.findMany({
        where: { toUserId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          fromUser: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.rating.count({ where: { toUserId } }),
    ]);
    return { ratings, total };
  }

  async existsForShipmentAndUser(shipmentId: string, fromUserId: string) {
    const count = await this.prisma.rating.count({ where: { shipmentId, fromUserId } });
    return count > 0;
  }

  async create(shipmentId: string, fromUserId: string, toUserId: string, score: number, comment?: string) {
    return this.prisma.rating.create({
      data: { shipmentId, fromUserId, toUserId, score, comment },
      include: {
        fromUser: { select: { id: true, firstName: true, lastName: true } },
        toUser: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getAverageScore(toUserId: string): Promise<number> {
    const result = await this.prisma.rating.aggregate({
      where: { toUserId },
      _avg: { score: true },
      _count: { score: true },
    });
    return result._avg.score ?? 0;
  }
}
