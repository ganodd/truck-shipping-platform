import { z } from 'zod';

export const createBidSchema = z
  .object({
    loadId: z.string().uuid('Invalid load ID'),
    amount: z.number().positive('Amount must be positive').max(999999, 'Amount too large'),
    estimatedPickup: z.coerce.date(),
    estimatedDelivery: z.coerce.date(),
    notes: z.string().max(500).optional(),
  })
  .refine((data) => data.estimatedDelivery > data.estimatedPickup, {
    message: 'Estimated delivery must be after pickup',
    path: ['estimatedDelivery'],
  });

export const updateBidSchema = createBidSchema.omit({ loadId: true }).partial();

export type CreateBidInput = z.infer<typeof createBidSchema>;
export type UpdateBidInput = z.infer<typeof updateBidSchema>;
