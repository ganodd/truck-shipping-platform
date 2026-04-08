import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ShipmentStatus } from '@prisma/client';

import type { RatingInput } from '@truck-shipping/shared-validators';

import { PrismaService } from '../../database/prisma.service';
import { RatingRepository } from './rating.repository';

@Injectable()
export class RatingService {
  constructor(
    private readonly ratingRepository: RatingRepository,
    private readonly prisma: PrismaService,
  ) {}

  async rateShipment(shipmentId: string, fromUserId: string, input: RatingInput) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        carrier: { include: { user: true } },
        shipper: { include: { user: true } },
      },
    });

    if (!shipment) throw new NotFoundException(`Shipment ${shipmentId} not found`);
    if (shipment.status !== ShipmentStatus.DELIVERED) {
      throw new UnprocessableEntityException('Ratings can only be submitted for delivered shipments');
    }

    const carrierUserId = shipment.carrier.user.id;
    const shipperUserId = shipment.shipper.user.id;

    // Only the shipper or carrier involved can leave a rating
    if (fromUserId !== carrierUserId && fromUserId !== shipperUserId) {
      throw new ForbiddenException('You are not a participant in this shipment');
    }

    const alreadyRated = await this.ratingRepository.existsForShipmentAndUser(shipmentId, fromUserId);
    if (alreadyRated) throw new ConflictException('You have already rated this shipment');

    // Determine who is being rated (the other party)
    const toUserId = fromUserId === shipperUserId ? carrierUserId : shipperUserId;

    return this.ratingRepository.create(shipmentId, fromUserId, toUserId, input.score, input.comment);
  }

  async getShipmentRatings(shipmentId: string) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) throw new NotFoundException(`Shipment ${shipmentId} not found`);
    return this.ratingRepository.findByShipment(shipmentId);
  }

  async getUserRatings(toUserId: string, page: number, limit: number) {
    const user = await this.prisma.user.findUnique({ where: { id: toUserId } });
    if (!user) throw new NotFoundException(`User ${toUserId} not found`);

    const { ratings, total } = await this.ratingRepository.findByUser(toUserId, page, limit);
    const averageScore = await this.ratingRepository.getAverageScore(toUserId);

    return {
      data: ratings,
      averageScore: Math.round(averageScore * 10) / 10,
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
