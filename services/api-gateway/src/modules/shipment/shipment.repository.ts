import { Injectable } from '@nestjs/common';
import { ShipmentStatus } from '@prisma/client';

import type { LocationUpdateInput } from '@truck-shipping/shared-validators';

import { PrismaService } from '../../database/prisma.service';

const SHIPMENT_DETAIL_INCLUDE = {
  load: {
    select: {
      id: true,
      origin: true,
      destination: true,
      equipmentType: true,
      weightLbs: true,
      description: true,
      specialInstructions: true,
    },
  },
  carrier: {
    include: {
      user: { select: { id: true, firstName: true, lastName: true, phone: true } },
    },
  },
  shipper: {
    include: {
      user: { select: { id: true, firstName: true, lastName: true, companyName: true } },
    },
  },
  vehicle: { select: { id: true, type: true, make: true, model: true, year: true, licensePlate: true } },
  acceptedBid: { select: { amount: true, estimatedPickup: true, estimatedDelivery: true } },
  events: { orderBy: { timestamp: 'asc' as const } },
} as const;

@Injectable()
export class ShipmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.shipment.findUnique({
      where: { id },
      include: SHIPMENT_DETAIL_INCLUDE,
    });
  }

  async findByShipper(shipperId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [shipments, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where: { shipperId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          load: { select: { origin: true, destination: true, equipmentType: true } },
          carrier: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      }),
      this.prisma.shipment.count({ where: { shipperId } }),
    ]);
    return { shipments, total };
  }

  async findByCarrier(carrierId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [shipments, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where: { carrierId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          load: { select: { origin: true, destination: true, equipmentType: true } },
          shipper: { include: { user: { select: { firstName: true, lastName: true, companyName: true } } } },
        },
      }),
      this.prisma.shipment.count({ where: { carrierId } }),
    ]);
    return { shipments, total };
  }

  async findAll(page: number, limit: number, status?: ShipmentStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};
    const [shipments, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          load: { select: { origin: true, destination: true, equipmentType: true } },
          carrier: { include: { user: { select: { firstName: true, lastName: true } } } },
          shipper: { include: { user: { select: { firstName: true, lastName: true, companyName: true } } } },
        },
      }),
      this.prisma.shipment.count({ where }),
    ]);
    return { shipments, total };
  }

  async updateStatus(
    id: string,
    status: ShipmentStatus,
    extra: { pickedUpAt?: Date; deliveredAt?: Date } = {},
  ) {
    return this.prisma.shipment.update({
      where: { id },
      data: { status, ...extra },
    });
  }

  async createEvent(
    shipmentId: string,
    status: ShipmentStatus,
    opts: { latitude?: number; longitude?: number; notes?: string } = {},
  ) {
    return this.prisma.shipmentEvent.create({
      data: { shipmentId, status, ...opts },
    });
  }

  async addLocationUpdate(shipmentId: string, carrierId: string, input: LocationUpdateInput) {
    return this.prisma.locationUpdate.create({
      data: {
        shipmentId,
        carrierId,
        latitude: input.latitude,
        longitude: input.longitude,
        speed: input.speed,
        heading: input.heading,
        accuracy: input.accuracy,
        timestamp: input.timestamp ?? new Date(),
      },
    });
  }

  async getLatestLocation(shipmentId: string) {
    return this.prisma.locationUpdate.findFirst({
      where: { shipmentId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getLocationHistory(shipmentId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [updates, total] = await Promise.all([
      this.prisma.locationUpdate.findMany({
        where: { shipmentId },
        orderBy: { timestamp: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.locationUpdate.count({ where: { shipmentId } }),
    ]);
    return { updates, total };
  }
}
