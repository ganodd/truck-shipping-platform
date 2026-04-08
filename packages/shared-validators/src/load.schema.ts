import { z } from 'zod';

import { EquipmentType } from '@truck-shipping/shared-types';

const geoLocationSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required').max(2),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const createLoadSchema = z
  .object({
    origin: geoLocationSchema,
    destination: geoLocationSchema,
    equipmentType: z.nativeEnum(EquipmentType),
    weightLbs: z.number().positive('Weight must be positive').max(80000, 'Max weight is 80,000 lbs'),
    dimensions: z
      .object({
        lengthFt: z.number().positive().optional(),
        widthFt: z.number().positive().optional(),
        heightFt: z.number().positive().optional(),
      })
      .optional(),
    pickupWindowStart: z.coerce.date(),
    pickupWindowEnd: z.coerce.date(),
    deliveryWindowStart: z.coerce.date(),
    deliveryWindowEnd: z.coerce.date(),
    description: z.string().max(1000).optional(),
    specialInstructions: z.string().max(500).optional(),
    budgetMin: z.number().positive().optional(),
    budgetMax: z.number().positive().optional(),
    instantBookPrice: z.number().positive().optional(),
  })
  .refine((data) => data.pickupWindowEnd > data.pickupWindowStart, {
    message: 'Pickup window end must be after start',
    path: ['pickupWindowEnd'],
  })
  .refine((data) => data.deliveryWindowEnd > data.deliveryWindowStart, {
    message: 'Delivery window end must be after start',
    path: ['deliveryWindowEnd'],
  })
  .refine((data) => !data.budgetMin || !data.budgetMax || data.budgetMax >= data.budgetMin, {
    message: 'Budget max must be >= budget min',
    path: ['budgetMax'],
  });

export const updateLoadSchema = createLoadSchema.partial();

export const loadSearchSchema = z.object({
  equipmentType: z.nativeEnum(EquipmentType).optional(),
  originState: z.string().max(2).optional(),
  destinationState: z.string().max(2).optional(),
  minWeight: z.coerce.number().positive().optional(),
  maxWeight: z.coerce.number().positive().optional(),
  pickupAfter: z.coerce.date().optional(),
  pickupBefore: z.coerce.date().optional(),
  maxBudget: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateLoadInput = z.infer<typeof createLoadSchema>;
export type UpdateLoadInput = z.infer<typeof updateLoadSchema>;
export type LoadSearchInput = z.infer<typeof loadSearchSchema>;
