import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import type { CreateVehicleInput, UpdateVehicleInput } from '@truck-shipping/shared-validators';

import { PrismaService } from '../../database/prisma.service';
import { VehicleRepository } from './vehicle.repository';

@Injectable()
export class VehicleService {
  constructor(
    private readonly vehicleRepository: VehicleRepository,
    private readonly prisma: PrismaService,
  ) {}

  private async requireCarrierProfile(userId: string) {
    const profile = await this.prisma.carrierProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('No carrier profile found for this user');
    return profile;
  }

  async getMyVehicles(userId: string) {
    const profile = await this.requireCarrierProfile(userId);
    return this.vehicleRepository.findByCarrier(profile.id);
  }

  async addVehicle(userId: string, input: CreateVehicleInput) {
    const profile = await this.requireCarrierProfile(userId);
    return this.vehicleRepository.create(profile.id, input);
  }

  async updateVehicle(id: string, userId: string, input: UpdateVehicleInput) {
    const profile = await this.requireCarrierProfile(userId);
    const vehicle = await this.vehicleRepository.findById(id);

    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    if (vehicle.carrierId !== profile.id) throw new ForbiddenException('You do not own this vehicle');

    return this.vehicleRepository.update(id, input);
  }

  async removeVehicle(id: string, userId: string) {
    const profile = await this.requireCarrierProfile(userId);
    const vehicle = await this.vehicleRepository.findById(id);

    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    if (vehicle.carrierId !== profile.id) throw new ForbiddenException('You do not own this vehicle');

    return this.vehicleRepository.deactivate(id);
  }
}
