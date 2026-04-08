import { Injectable } from '@nestjs/common';
import { LoadStatus, Prisma } from '@prisma/client';

import type { CreateLoadInput, LoadSearchInput, UpdateLoadInput } from '@truck-shipping/shared-validators';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LoadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(shipperId: string, input: CreateLoadInput) {
    return this.prisma.load.create({
      data: {
        shipperId,
        origin: input.origin as unknown as Prisma.InputJsonValue,
        destination: input.destination as unknown as Prisma.InputJsonValue,
        equipmentType: input.equipmentType,
        weightLbs: input.weightLbs,
        dimensions: input.dimensions as unknown as Prisma.InputJsonValue | undefined,
        pickupWindowStart: input.pickupWindowStart,
        pickupWindowEnd: input.pickupWindowEnd,
        deliveryWindowStart: input.deliveryWindowStart,
        deliveryWindowEnd: input.deliveryWindowEnd,
        description: input.description,
        specialInstructions: input.specialInstructions,
        budgetMin: input.budgetMin !== undefined ? Math.round(input.budgetMin * 100) : undefined,
        budgetMax: input.budgetMax !== undefined ? Math.round(input.budgetMax * 100) : undefined,
        instantBookPrice: input.instantBookPrice !== undefined ? Math.round(input.instantBookPrice * 100) : undefined,
        status: LoadStatus.AVAILABLE,
      },
      include: { shipper: { include: { user: { select: { firstName: true, lastName: true, companyName: true } } } } },
    });
  }

  async findById(id: string) {
    return this.prisma.load.findUnique({
      where: { id },
      include: {
        shipper: { include: { user: { select: { id: true, firstName: true, lastName: true, companyName: true } } } },
        bids: { where: { status: 'PENDING' }, orderBy: { amount: 'asc' } },
      },
    });
  }

  async findByShipper(shipperId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [loads, total] = await Promise.all([
      this.prisma.load.findMany({
        where: { shipperId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { _count: { select: { bids: true } } },
      }),
      this.prisma.load.count({ where: { shipperId } }),
    ]);
    return { loads, total };
  }

  async search(filters: LoadSearchInput) {
    const skip = (filters.page - 1) * filters.limit;

    const where: Prisma.LoadWhereInput = {
      status: LoadStatus.AVAILABLE,
      ...(filters.equipmentType && { equipmentType: filters.equipmentType }),
      ...(filters.minWeight && { weightLbs: { gte: filters.minWeight } }),
      ...(filters.maxWeight && { weightLbs: { ...((filters.minWeight ? { gte: filters.minWeight } : {})), lte: filters.maxWeight } }),
      ...(filters.pickupAfter && { pickupWindowStart: { gte: filters.pickupAfter } }),
      ...(filters.pickupBefore && { pickupWindowStart: { lte: filters.pickupBefore } }),
      ...(filters.maxBudget && { budgetMax: { lte: Math.round(filters.maxBudget * 100) } }),
    };

    // State filter on JSON origin/destination
    if (filters.originState) {
      where.origin = { path: ['state'], equals: filters.originState.toUpperCase() };
    }
    if (filters.destinationState) {
      where.destination = { path: ['state'], equals: filters.destinationState.toUpperCase() };
    }

    const [loads, total] = await Promise.all([
      this.prisma.load.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.limit,
        include: { _count: { select: { bids: true } } },
      }),
      this.prisma.load.count({ where }),
    ]);
    return { loads, total };
  }

  async update(id: string, input: UpdateLoadInput) {
    return this.prisma.load.update({
      where: { id },
      data: {
        ...(input.origin !== undefined && { origin: input.origin as unknown as Prisma.InputJsonValue }),
        ...(input.destination !== undefined && { destination: input.destination as unknown as Prisma.InputJsonValue }),
        ...(input.equipmentType !== undefined && { equipmentType: input.equipmentType }),
        ...(input.weightLbs !== undefined && { weightLbs: input.weightLbs }),
        ...(input.dimensions !== undefined && { dimensions: input.dimensions as unknown as Prisma.InputJsonValue }),
        ...(input.pickupWindowStart !== undefined && { pickupWindowStart: input.pickupWindowStart }),
        ...(input.pickupWindowEnd !== undefined && { pickupWindowEnd: input.pickupWindowEnd }),
        ...(input.deliveryWindowStart !== undefined && { deliveryWindowStart: input.deliveryWindowStart }),
        ...(input.deliveryWindowEnd !== undefined && { deliveryWindowEnd: input.deliveryWindowEnd }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.specialInstructions !== undefined && { specialInstructions: input.specialInstructions }),
        ...(input.budgetMin !== undefined && { budgetMin: Math.round(input.budgetMin * 100) }),
        ...(input.budgetMax !== undefined && { budgetMax: Math.round(input.budgetMax * 100) }),
        ...(input.instantBookPrice !== undefined && { instantBookPrice: Math.round(input.instantBookPrice * 100) }),
      },
    });
  }

  async cancel(id: string) {
    return this.prisma.load.update({
      where: { id },
      data: { status: LoadStatus.CANCELLED },
    });
  }

  async findAvailableByEquipment(equipmentType: string) {
    return this.prisma.load.findMany({
      where: {
        equipmentType: equipmentType as LoadStatus,
        status: LoadStatus.AVAILABLE,
      },
    });
  }

  /** Find eligible carrier profiles for matching against a load. */
  async findEligibleCarriers(equipmentType: string) {
    return this.prisma.carrierProfile.findMany({
      where: {
        verified: true,
        vehicles: {
          some: {
            active: true,
            type: equipmentType as Prisma.EnumEquipmentTypeFilter,
          },
        },
        user: { kycStatus: 'APPROVED' },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            kycStatus: true,
            receivedRatings: { select: { score: true } },
          },
        },
        vehicles: {
          where: { active: true },
          select: { type: true, capacityTons: true },
        },
      },
    });
  }
}
