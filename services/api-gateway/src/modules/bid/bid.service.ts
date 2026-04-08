import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BidStatus, LoadStatus } from '@prisma/client';

import { MAX_ACTIVE_BIDS_PER_CARRIER } from '@truck-shipping/shared-utils';
import type { CreateBidInput } from '@truck-shipping/shared-validators';

import { PrismaService } from '../../database/prisma.service';
import { BidRepository } from './bid.repository';

@Injectable()
export class BidService {
  constructor(
    private readonly bidRepository: BidRepository,
    private readonly prisma: PrismaService,
  ) {}

  /** Resolve User.id → CarrierProfile.id */
  private async requireCarrierProfile(userId: string) {
    const profile = await this.prisma.carrierProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('No carrier profile found for this user');
    return profile;
  }

  /** Resolve User.id → ShipperProfile.id */
  private async requireShipperProfile(userId: string) {
    const profile = await this.prisma.shipperProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('No shipper profile found for this user');
    return profile;
  }

  async placeBid(userId: string, input: CreateBidInput) {
    const profile = await this.requireCarrierProfile(userId);

    // Check the load is still available
    const load = await this.prisma.load.findUnique({ where: { id: input.loadId } });
    if (!load) throw new NotFoundException(`Load ${input.loadId} not found`);
    if (load.status !== LoadStatus.AVAILABLE && load.status !== LoadStatus.MATCHED) {
      throw new UnprocessableEntityException(`Load is no longer accepting bids (status: ${load.status})`);
    }

    // Prevent duplicate bids
    const alreadyBid = await this.bidRepository.existsForLoadAndCarrier(input.loadId, profile.id);
    if (alreadyBid) throw new ConflictException('You already have an active bid on this load');

    // Enforce concurrent bid limit
    const pendingCount = await this.bidRepository.countPendingByCarrier(profile.id);
    if (pendingCount >= MAX_ACTIVE_BIDS_PER_CARRIER) {
      throw new UnprocessableEntityException(
        `You cannot have more than ${MAX_ACTIVE_BIDS_PER_CARRIER} pending bids simultaneously`,
      );
    }

    // Update load status to MATCHED if it was AVAILABLE
    if (load.status === LoadStatus.AVAILABLE) {
      await this.prisma.load.update({
        where: { id: input.loadId },
        data: { status: LoadStatus.MATCHED },
      });
    }

    return this.bidRepository.create(profile.id, input);
  }

  async getLoadBids(loadId: string) {
    return this.bidRepository.findByLoad(loadId);
  }

  async getMyBids(userId: string, page: number, limit: number) {
    const profile = await this.requireCarrierProfile(userId);
    const { bids, total } = await this.bidRepository.findByCarrier(profile.id, page, limit);
    return {
      data: bids,
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

  /**
   * Accept a bid — creates a Shipment atomically.
   * Uses a Prisma transaction to prevent double-acceptance race conditions.
   */
  async acceptBid(bidId: string, userId: string) {
    const shipperProfile = await this.requireShipperProfile(userId);

    return this.prisma.$transaction(async (tx) => {
      // Re-fetch bid inside transaction for consistent read
      const bid = await tx.bid.findUnique({
        where: { id: bidId },
        include: { load: true },
      });

      if (!bid) throw new NotFoundException(`Bid ${bidId} not found`);
      if (bid.status !== BidStatus.PENDING) {
        throw new UnprocessableEntityException(`Bid is no longer pending (status: ${bid.status})`);
      }

      const load = bid.load;
      if (load.shipperId !== shipperProfile.id) {
        throw new ForbiddenException('You do not own the load this bid is for');
      }
      if (load.status === LoadStatus.BOOKED || load.status === LoadStatus.COMPLETED) {
        throw new UnprocessableEntityException('Load has already been booked');
      }

      // Accept this bid
      await tx.bid.update({ where: { id: bidId }, data: { status: BidStatus.ACCEPTED } });

      // Reject all other pending bids for this load
      await tx.bid.updateMany({
        where: { loadId: load.id, status: BidStatus.PENDING, id: { not: bidId } },
        data: { status: BidStatus.REJECTED },
      });

      // Update load status to BOOKED
      await tx.load.update({ where: { id: load.id }, data: { status: LoadStatus.BOOKED } });

      // Create shipment
      const shipment = await tx.shipment.create({
        data: {
          loadId: load.id,
          carrierId: bid.carrierId,
          shipperId: shipperProfile.id,
          acceptedBidId: bidId,
          agreedPrice: bid.amount,
          status: 'PENDING_PICKUP',
        },
        include: {
          load: { select: { id: true, origin: true, destination: true, equipmentType: true } },
          carrier: { include: { user: { select: { firstName: true, lastName: true } } } },
          shipper: { include: { user: { select: { firstName: true, lastName: true, companyName: true } } } },
        },
      });

      return shipment;
    });
  }

  async rejectBid(bidId: string, userId: string) {
    const shipperProfile = await this.requireShipperProfile(userId);
    const bid = await this.bidRepository.findById(bidId);

    if (!bid) throw new NotFoundException(`Bid ${bidId} not found`);
    if (bid.load.shipperId !== shipperProfile.id) {
      throw new ForbiddenException('You do not own the load this bid is for');
    }
    if (bid.status !== BidStatus.PENDING) {
      throw new UnprocessableEntityException(`Bid is not pending (status: ${bid.status})`);
    }

    return this.bidRepository.updateStatus(bidId, BidStatus.REJECTED);
  }

  async withdrawBid(bidId: string, userId: string) {
    const carrierProfile = await this.requireCarrierProfile(userId);
    const bid = await this.bidRepository.findById(bidId);

    if (!bid) throw new NotFoundException(`Bid ${bidId} not found`);
    if (bid.carrierId !== carrierProfile.id) {
      throw new ForbiddenException('You do not own this bid');
    }
    if (bid.status !== BidStatus.PENDING) {
      throw new UnprocessableEntityException(`Bid is not pending (status: ${bid.status})`);
    }

    return this.bidRepository.updateStatus(bidId, BidStatus.WITHDRAWN);
  }
}
