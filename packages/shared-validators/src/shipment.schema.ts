import { z } from 'zod';

import { ShipmentStatus } from '@truck-shipping/shared-types';

export const updateStatusSchema = z.object({
  status: z.nativeEnum(ShipmentStatus),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  notes: z.string().max(500).optional(),
});

export const locationUpdateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
  accuracy: z.number().min(0).optional(),
  timestamp: z.coerce.date().optional(),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;
