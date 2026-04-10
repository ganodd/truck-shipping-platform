import { DocumentType } from '@truck-shipping/shared-types';
import { z } from 'zod';

export const uploadUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024), // 50 MB max
  type: z.nativeEnum(DocumentType),
  shipmentId: z.string().uuid().optional(),
});

export const saveDocumentSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileUrl: z.string().url(),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1).max(100),
  type: z.nativeEnum(DocumentType),
  shipmentId: z.string().uuid().optional(),
});

export type UploadUrlInput = z.infer<typeof uploadUrlSchema>;
export type SaveDocumentInput = z.infer<typeof saveDocumentSchema>;
