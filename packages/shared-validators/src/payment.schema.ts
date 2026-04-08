import { z } from 'zod';

import { FeeType } from '@truck-shipping/shared-types';

export const createPaymentSchema = z.object({
  shipmentId: z.string().uuid(),
  amount: z.number().positive(),
  feeType: z.nativeEnum(FeeType),
});

export const ratingSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type RatingInput = z.infer<typeof ratingSchema>;
