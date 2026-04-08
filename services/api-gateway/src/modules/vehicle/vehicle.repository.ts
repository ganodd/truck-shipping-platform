import { Injectable } from '@nestjs/common';

import type { CreateVehicleInput, UpdateVehicleInput } from '@truck-shipping/shared-validators';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class VehicleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCarrier(carrierId: string) {
    return this.prisma.vehicle.findMany({
      where: { carrierId, active: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.vehicle.findUnique({ where: { id } });
  }

  async create(carrierId: string, input: CreateVehicleInput) {
    return this.prisma.vehicle.create({
      data: {
        carrierId,
        type: input.type as any,
        make: input.make,
        model: input.model,
        year: input.year,
        licensePlate: input.licensePlate,
        capacityTons: input.capacityTons,
        vin: input.vin,
        insuranceExpiry: input.insuranceExpiry,
      },
    });
  }

  async update(id: string, input: UpdateVehicleInput) {
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        ...(input.type && { type: input.type as any }),
        ...(input.make && { make: input.make }),
        ...(input.model && { model: input.model }),
        ...(input.year && { year: input.year }),
        ...(input.licensePlate && { licensePlate: input.licensePlate }),
        ...(input.capacityTons && { capacityTons: input.capacityTons }),
        ...(input.vin !== undefined && { vin: input.vin }),
        ...(input.insuranceExpiry !== undefined && { insuranceExpiry: input.insuranceExpiry }),
      },
    });
  }

  async deactivate(id: string) {
    return this.prisma.vehicle.update({ where: { id }, data: { active: false } });
  }
}
