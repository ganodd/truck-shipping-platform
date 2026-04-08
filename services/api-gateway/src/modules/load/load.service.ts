import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { LoadStatus } from '@prisma/client';

import type { EquipmentType, GeoLocation } from '@truck-shipping/shared-types';
import type { CreateLoadInput, LoadSearchInput, UpdateLoadInput } from '@truck-shipping/shared-validators';

import { PrismaService } from '../../database/prisma.service';
import type { CarrierMatch } from './matching.engine';
import { MatchingEngine } from './matching.engine';
import { LoadRepository } from './load.repository';

const CANCELLABLE_STATUSES: LoadStatus[] = [LoadStatus.DRAFT, LoadStatus.AVAILABLE, LoadStatus.MATCHED];

@Injectable()
export class LoadService {
  constructor(
    private readonly loadRepository: LoadRepository,
    private readonly matchingEngine: MatchingEngine,
    private readonly prisma: PrismaService,
  ) {}

  /** Resolve a User.id to their ShipperProfile.id, throwing if not found. */
  private async requireShipperProfile(userId: string) {
    const profile = await this.prisma.shipperProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('No shipper profile found for this user');
    return profile;
  }

  async createLoad(userId: string, input: CreateLoadInput) {
    const profile = await this.requireShipperProfile(userId);
    return this.loadRepository.create(profile.id, input);
  }

  async getLoad(id: string) {
    const load = await this.loadRepository.findById(id);
    if (!load) throw new NotFoundException(`Load ${id} not found`);
    return load;
  }

  async getMyLoads(userId: string, page: number, limit: number) {
    const profile = await this.requireShipperProfile(userId);
    const { loads, total } = await this.loadRepository.findByShipper(profile.id, page, limit);

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

  async searchLoads(filters: LoadSearchInput) {
    const { loads, total } = await this.loadRepository.search(filters);

    return {
      data: loads,
      meta: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
        hasNextPage: filters.page * filters.limit < total,
        hasPrevPage: filters.page > 1,
      },
    };
  }

  async updateLoad(id: string, userId: string, input: UpdateLoadInput) {
    const load = await this.getLoad(id);
    const profile = await this.requireShipperProfile(userId);

    if (load.shipperId !== profile.id) {
      throw new ForbiddenException('You do not own this load');
    }
    if (load.status === LoadStatus.BOOKED || load.status === LoadStatus.COMPLETED) {
      throw new UnprocessableEntityException(`Cannot update a load with status ${load.status}`);
    }

    return this.loadRepository.update(id, input);
  }

  async cancelLoad(id: string, userId: string) {
    const load = await this.getLoad(id);
    const profile = await this.requireShipperProfile(userId);

    if (load.shipperId !== profile.id) {
      throw new ForbiddenException('You do not own this load');
    }
    if (!CANCELLABLE_STATUSES.includes(load.status)) {
      throw new UnprocessableEntityException(`Cannot cancel a load with status ${load.status}`);
    }

    return this.loadRepository.cancel(id);
  }

  async getMatchedCarriers(loadId: string, userId: string): Promise<CarrierMatch[]> {
    const load = await this.getLoad(loadId);
    const profile = await this.requireShipperProfile(userId);

    if (load.shipperId !== profile.id) {
      throw new ForbiddenException('You do not own this load');
    }
    if (load.status === LoadStatus.BOOKED || load.status === LoadStatus.COMPLETED) {
      throw new UnprocessableEntityException('Load is no longer available for matching');
    }

    const carriers = await this.loadRepository.findEligibleCarriers(load.equipmentType);
    const origin = load.origin as unknown as GeoLocation;
    const destination = load.destination as unknown as GeoLocation;

    return this.matchingEngine.findMatches(
      carriers,
      load.equipmentType as unknown as EquipmentType,
      load.weightLbs,
      origin,
      destination,
    );
  }
}
