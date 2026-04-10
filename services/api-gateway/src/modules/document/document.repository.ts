import { Injectable } from '@nestjs/common';
import { DocumentType } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByShipment(shipmentId: string) {
    return this.prisma.document.findMany({
      where: { shipmentId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.document.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data: {
    userId: string;
    type: DocumentType;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    shipmentId?: string;
  }) {
    return this.prisma.document.create({
      data,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.document.delete({ where: { id } });
  }
}
