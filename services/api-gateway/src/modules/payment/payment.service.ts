import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import type { AppConfig } from '@truck-shipping/shared-utils';
import type { CreatePaymentInput } from '@truck-shipping/shared-validators';
import Stripe from 'stripe';

import { CONFIG_TOKEN } from '../../config/config.module';
import { PrismaService } from '../../database/prisma.service';

import { PaymentRepository } from './payment.repository';

@Injectable()
export class PaymentService {
  private readonly stripe: Stripe;

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly prisma: PrismaService,
    @Inject(CONFIG_TOKEN) private readonly config: AppConfig,
  ) {
    this.stripe = new Stripe(this.config.STRIPE_SECRET_KEY ?? '', {
      apiVersion: '2024-06-20',
    });
  }

  async createPaymentIntent(userId: string, input: CreatePaymentInput) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: input.shipmentId },
      include: {
        shipper: true,
        carrier: true,
      },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment ${input.shipmentId} not found`);
    }

    const shipperProfile = await this.prisma.shipperProfile.findUnique({
      where: { userId },
    });

    if (shipment.shipperId !== shipperProfile?.id) {
      throw new ForbiddenException('Only the shipper of this shipment can initiate payment');
    }

    if (!this.config.STRIPE_SECRET_KEY) {
      throw new BadRequestException('Payment processing is not configured');
    }

    const intent = await this.stripe.paymentIntents.create({
      amount: input.amount,
      currency: 'usd',
      metadata: {
        shipmentId: input.shipmentId,
        feeType: input.feeType,
        shipperId: shipperProfile.id,
        carrierId: shipment.carrierId,
      },
    });

    const payment = await this.paymentRepository.create({
      shipmentId: input.shipmentId,
      shipperId: shipperProfile.id,
      carrierId: shipment.carrierId,
      amount: input.amount,
      feeType: input.feeType,
      stripePaymentIntentId: intent.id,
    });

    return {
      clientSecret: intent.client_secret,
      paymentId: payment.id,
      amount: payment.amount,
      status: payment.status,
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<{ received: boolean }> {
    if (!this.config.STRIPE_WEBHOOK_SECRET) {
      throw new BadRequestException('Webhook secret is not configured');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.config.STRIPE_WEBHOOK_SECRET,
      );
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const payment = await this.paymentRepository.findByStripeIntentId(intent.id);
      if (payment) {
        await this.paymentRepository.updateStatus(payment.id, PaymentStatus.COMPLETED, new Date());
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const payment = await this.paymentRepository.findByStripeIntentId(intent.id);
      if (payment) {
        await this.paymentRepository.updateStatus(payment.id, PaymentStatus.FAILED);
      }
    }

    return { received: true };
  }

  async getShipmentPayments(shipmentId: string, userId: string, role: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment ${shipmentId} not found`);
    }

    if (role !== 'ADMIN' && role !== 'DISPATCHER') {
      if (role === 'SHIPPER') {
        const profile = await this.prisma.shipperProfile.findUnique({ where: { userId } });
        if (shipment.shipperId !== profile?.id) {
          throw new ForbiddenException('Access denied');
        }
      } else if (role === 'CARRIER') {
        const profile = await this.prisma.carrierProfile.findUnique({ where: { userId } });
        if (shipment.carrierId !== profile?.id) {
          throw new ForbiddenException('Access denied');
        }
      }
    }

    return this.paymentRepository.findByShipment(shipmentId);
  }
}
