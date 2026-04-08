import { z } from 'zod';

import { VehicleType } from '@truck-shipping/shared-types';

export const createVehicleSchema = z.object({
  type: z.nativeEnum(VehicleType),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z.number().int().min(1980).max(new Date().getFullYear() + 1),
  licensePlate: z.string().min(1).max(20),
  capacityTons: z.number().positive().max(50),
  vin: z.string().length(17).optional(),
  insuranceExpiry: z.coerce.date().optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
