import { Injectable } from '@nestjs/common';
import { FeeType, PaymentStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByShipment(shipmentId: string) {
    return this.prisma.payment.findMany({
      where: { shipmentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStripeIntentId(stripePaymentIntentId: string) {
    return this.prisma.payment.findUnique({
      where: { stripePaymentIntentId },
    });
  }

  async create(data: {
    shipmentId: string;
    shipperId: string;
    carrierId: string;
    amount: number;
    feeType: FeeType;
    stripePaymentIntentId: string;
  }) {
    return this.prisma.payment.create({ data });
  }

  async updateStatus(id: string, status: PaymentStatus, paidAt?: Date) {
    return this.prisma.payment.update({
      where: { id },
      data: { status, ...(paidAt ? { paidAt } : {}) },
    });
  }
}
