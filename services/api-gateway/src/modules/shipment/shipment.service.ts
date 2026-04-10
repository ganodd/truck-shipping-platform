import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ShipmentStatus } from '@prisma/client';
import type { LocationUpdateInput, UpdateStatusInput } from '@truck-shipping/shared-validators';

import { PrismaService } from '../../database/prisma.service';
import { EventsGateway } from '../../gateway/events.gateway';

import { ShipmentRepository } from './shipment.repository';

const CARRIER_TRANSITIONS: Partial<Record<ShipmentStatus, ShipmentStatus>> = {
  [ShipmentStatus.PENDING_PICKUP]: ShipmentStatus.IN_TRANSIT,
  [ShipmentStatus.IN_TRANSIT]: ShipmentStatus.DELIVERED,
};

@Injectable()
export class ShipmentService {
  constructor(
    private readonly shipmentRepository: ShipmentRepository,
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private async requireCarrierProfile(userId: string) {
    const profile = await this.prisma.carrierProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('No carrier profile found for this user');
    return profile;
  }

  private async requireShipperProfile(userId: string) {
    const profile = await this.prisma.shipperProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('No shipper profile found for this user');
    return profile;
  }

  async getShipment(id: string, userId: string, role: string) {
    const shipment = await this.shipmentRepository.findById(id);
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);

    if (role === 'ADMIN' || role === 'DISPATCHER') return shipment;

    if (role === 'SHIPPER') {
      const profile = await this.requireShipperProfile(userId);
      if (shipment.shipperId !== profile.id) throw new ForbiddenException('Access denied');
    } else if (role === 'CARRIER') {
      const profile = await this.requireCarrierProfile(userId);
      if (shipment.carrierId !== profile.id) throw new ForbiddenException('Access denied');
    }

    return shipment;
  }

  async getMyShipments(userId: string, role: string, page: number, limit: number) {
    if (role === 'ADMIN' || role === 'DISPATCHER') {
      const { shipments, total } = await this.shipmentRepository.findAll(page, limit);
      return this.paginate(shipments, total, page, limit);
    }

    if (role === 'SHIPPER') {
      const profile = await this.requireShipperProfile(userId);
      const { shipments, total } = await this.shipmentRepository.findByShipper(
        profile.id,
        page,
        limit,
      );
      return this.paginate(shipments, total, page, limit);
    }

    const profile = await this.requireCarrierProfile(userId);
    const { shipments, total } = await this.shipmentRepository.findByCarrier(
      profile.id,
      page,
      limit,
    );
    return this.paginate(shipments, total, page, limit);
  }

  async updateStatus(id: string, userId: string, input: UpdateStatusInput) {
    const shipment = await this.shipmentRepository.findById(id);
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);

    const profile = await this.requireCarrierProfile(userId);
    if (shipment.carrierId !== profile.id)
      throw new ForbiddenException('You are not the carrier for this shipment');

    const allowed = CARRIER_TRANSITIONS[shipment.status];
    if (!allowed || allowed !== input.status) {
      throw new UnprocessableEntityException(
        `Cannot transition from ${shipment.status} to ${input.status}`,
      );
    }

    const extra: { pickedUpAt?: Date; deliveredAt?: Date } = {};
    if (input.status === ShipmentStatus.IN_TRANSIT) extra.pickedUpAt = new Date();
    if (input.status === ShipmentStatus.DELIVERED) extra.deliveredAt = new Date();

    await this.shipmentRepository.updateStatus(id, input.status, extra);
    await this.shipmentRepository.createEvent(id, input.status, {
      latitude: input.latitude,
      longitude: input.longitude,
      notes: input.notes,
    });

    const updated = await this.shipmentRepository.findById(id);

    // Broadcast status change to all WebSocket clients watching this shipment
    this.eventsGateway.emitShipmentUpdated(id, {
      shipmentId: id,
      status: input.status,
      updatedAt: new Date().toISOString(),
    });

    return updated;
  }

  async addLocationUpdate(id: string, userId: string, input: LocationUpdateInput) {
    const shipment = await this.shipmentRepository.findById(id);
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);

    const profile = await this.requireCarrierProfile(userId);
    if (shipment.carrierId !== profile.id)
      throw new ForbiddenException('You are not the carrier for this shipment');

    if (shipment.status !== ShipmentStatus.IN_TRANSIT) {
      throw new UnprocessableEntityException(
        'Location updates only allowed for in-transit shipments',
      );
    }

    const update = await this.shipmentRepository.addLocationUpdate(id, profile.id, input);

    // Broadcast location to watching clients
    this.eventsGateway.emitShipmentUpdated(id, {
      shipmentId: id,
      latitude: input.latitude,
      longitude: input.longitude,
      updatedAt: new Date().toISOString(),
    });

    return update;
  }

  async getLocationHistory(id: string, page: number, limit: number) {
    const shipment = await this.shipmentRepository.findById(id);
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);
    const { updates, total } = await this.shipmentRepository.getLocationHistory(id, page, limit);
    return this.paginate(updates, total, page, limit);
  }

  async getLatestLocation(id: string) {
    const shipment = await this.shipmentRepository.findById(id);
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);
    return this.shipmentRepository.getLatestLocation(id);
  }

  private paginate<T>(data: T[], total: number, page: number, limit: number) {
    return {
      data,
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
