import { PutObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DocumentType } from '@prisma/client';
import type { AppConfig } from '@truck-shipping/shared-utils';
import type { SaveDocumentInput, UploadUrlInput } from '@truck-shipping/shared-validators';
import { v4 as uuidv4 } from 'uuid';

import { CONFIG_TOKEN } from '../../config/config.module';
import { PrismaService } from '../../database/prisma.service';

import { DocumentRepository } from './document.repository';

@Injectable()
export class DocumentService {
  private readonly s3: S3Client;

  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly prisma: PrismaService,
    @Inject(CONFIG_TOKEN) private readonly config: AppConfig,
  ) {
    this.s3 = new S3Client({
      region: this.config.AWS_REGION,
      credentials:
        this.config.AWS_ACCESS_KEY_ID && this.config.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: this.config.AWS_ACCESS_KEY_ID,
              secretAccessKey: this.config.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }

  async getUploadUrl(userId: string, input: UploadUrlInput) {
    if (!this.config.AWS_S3_BUCKET) {
      throw new BadRequestException('Document storage is not configured');
    }

    const ext = input.fileName.split('.').pop() ?? 'bin';
    const key = `documents/${userId}/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.config.AWS_S3_BUCKET,
      Key: key,
      ContentType: input.mimeType,
      ContentLength: input.fileSize,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });
    const fileUrl = `https://${this.config.AWS_S3_BUCKET}.s3.${this.config.AWS_REGION}.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl, key };
  }

  async saveDocument(userId: string, input: SaveDocumentInput) {
    if (input.shipmentId) {
      const shipment = await this.prisma.shipment.findUnique({
        where: { id: input.shipmentId },
        include: { carrier: true, shipper: true },
      });
      if (!shipment) throw new NotFoundException(`Shipment ${input.shipmentId} not found`);
    }

    return this.documentRepository.create({
      userId,
      type: input.type as DocumentType,
      fileName: input.fileName,
      fileUrl: input.fileUrl,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      shipmentId: input.shipmentId,
    });
  }

  async getShipmentDocuments(shipmentId: string, userId: string, role: string) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) throw new NotFoundException(`Shipment ${shipmentId} not found`);

    if (role !== 'ADMIN' && role !== 'DISPATCHER') {
      if (role === 'SHIPPER') {
        const profile = await this.prisma.shipperProfile.findUnique({ where: { userId } });
        if (shipment.shipperId !== profile?.id) throw new ForbiddenException('Access denied');
      } else if (role === 'CARRIER') {
        const profile = await this.prisma.carrierProfile.findUnique({ where: { userId } });
        if (shipment.carrierId !== profile?.id) throw new ForbiddenException('Access denied');
      }
    }

    return this.documentRepository.findByShipment(shipmentId);
  }

  async deleteDocument(id: string, userId: string, role: string) {
    const doc = await this.documentRepository.findById(id);
    if (!doc) throw new NotFoundException(`Document ${id} not found`);

    if (role !== 'ADMIN' && doc.userId !== userId) {
      throw new ForbiddenException('You can only delete your own documents');
    }

    if (this.config.AWS_S3_BUCKET) {
      try {
        const url = new URL(doc.fileUrl);
        const key = url.pathname.slice(1);
        await this.s3.send(
          new DeleteObjectCommand({ Bucket: this.config.AWS_S3_BUCKET, Key: key }),
        );
      } catch {
        // S3 deletion is best-effort; DB record is always removed
      }
    }

    await this.documentRepository.delete(id);
    return { deleted: true };
  }
}
