import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import type { AuthPayload } from '@truck-shipping/shared-types';
import { UserRole } from '@truck-shipping/shared-types';
import { createBidSchema } from '@truck-shipping/shared-validators';

import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { BidService } from './bid.service';

@Controller('bids')
@ApiTags('Bids')
@ApiBearerAuth()
export class BidController {
  constructor(private readonly bidService: BidService) {}

  /** POST /bids — place a bid on a load (CARRIER only) */
  @Post()
  @Roles(UserRole.CARRIER)
  @ApiOperation({ summary: 'Place a bid on a load' })
  async placeBid(@CurrentUser() user: AuthPayload, @Body() body: unknown) {
    const input = createBidSchema.parse(body);
    return this.bidService.placeBid(user.userId, input);
  }

  /** GET /bids/my — get my bids (CARRIER only) */
  @Get('my')
  @Roles(UserRole.CARRIER)
  @ApiOperation({ summary: 'Get my placed bids' })
  async getMyBids(
    @CurrentUser() user: AuthPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.bidService.getMyBids(user.userId, Number(page), Number(limit));
  }

  /** GET /bids/load/:loadId — get all bids for a load (SHIPPER only) */
  @Get('load/:loadId')
  @Roles(UserRole.SHIPPER, UserRole.DISPATCHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all bids for a specific load' })
  @ApiParam({ name: 'loadId', type: String })
  async getLoadBids(@Param('loadId') loadId: string) {
    return this.bidService.getLoadBids(loadId);
  }

  /** PATCH /bids/:id/accept — accept a bid, creates shipment (SHIPPER only) */
  @Patch(':id/accept')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SHIPPER)
  @ApiOperation({ summary: 'Accept a bid and create a shipment' })
  async acceptBid(@CurrentUser() user: AuthPayload, @Param('id') id: string) {
    return this.bidService.acceptBid(id, user.userId);
  }

  /** PATCH /bids/:id/reject — reject a bid (SHIPPER only) */
  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SHIPPER)
  @ApiOperation({ summary: 'Reject a bid' })
  async rejectBid(@CurrentUser() user: AuthPayload, @Param('id') id: string) {
    return this.bidService.rejectBid(id, user.userId);
  }

  /** PATCH /bids/:id/withdraw — withdraw own bid (CARRIER only) */
  @Patch(':id/withdraw')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.CARRIER)
  @ApiOperation({ summary: 'Withdraw a pending bid' })
  async withdrawBid(@CurrentUser() user: AuthPayload, @Param('id') id: string) {
    return this.bidService.withdrawBid(id, user.userId);
  }
}
