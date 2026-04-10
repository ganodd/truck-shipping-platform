import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { type AuthPayload, UserRole } from '@truck-shipping/shared-types';
import { createPaymentSchema } from '@truck-shipping/shared-validators';
import type { Request } from 'express';

import { CurrentUser } from '../../decorators/current-user.decorator';
import { Public } from '../../decorators/public.decorator';
import { Roles } from '../../decorators/roles.decorator';

import { PaymentService } from './payment.service';

@Controller()
@ApiTags('Payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /** POST /payments/intent — create a Stripe PaymentIntent (SHIPPER only) */
  @Post('payments/intent')
  @ApiBearerAuth()
  @Roles(UserRole.SHIPPER)
  @ApiOperation({ summary: 'Create a Stripe PaymentIntent for a shipment fee' })
  @ApiResponse({ status: 201, description: 'PaymentIntent created — returns clientSecret' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Shipper role required' })
  async createPaymentIntent(@CurrentUser() user: AuthPayload, @Body() body: unknown) {
    const input = createPaymentSchema.parse(body);
    return this.paymentService.createPaymentIntent(user.userId, input);
  }

  /** POST /payments/webhook — Stripe webhook (public, raw body required) */
  @Post('payments/webhook')
  @Public()
  @SkipThrottle()
  @ApiOperation({ summary: 'Stripe webhook endpoint (internal use)' })
  @ApiResponse({ status: 200, description: 'Event processed' })
  @ApiResponse({ status: 400, description: 'Invalid signature or unknown event' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody ?? Buffer.alloc(0);
    return this.paymentService.handleWebhook(rawBody, signature);
  }

  /** GET /shipments/:shipmentId/payments — list payments for a shipment */
  @Get('shipments/:shipmentId/payments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all payments for a shipment' })
  @ApiParam({ name: 'shipmentId', type: String })
  @ApiResponse({ status: 200, description: 'List of payments for the shipment' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  async getShipmentPayments(
    @CurrentUser() user: AuthPayload,
    @Param('shipmentId') shipmentId: string,
    @Query() _query: Record<string, string>,
  ) {
    return this.paymentService.getShipmentPayments(shipmentId, user.userId, user.role);
  }
}
