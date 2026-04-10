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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiResponse({ status: 201, description: 'Bid placed successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate bid' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Carrier role required' })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async placeBid(@CurrentUser() user: AuthPayload, @Body() body: unknown) {
    const input = createBidSchema.parse(body);
    return this.bidService.placeBid(user.userId, input);
  }

  /** GET /bids/my — get my bids (CARRIER only) */
  @Get('my')
  @Roles(UserRole.CARRIER)
  @ApiOperation({ summary: 'Get my placed bids' })
  @ApiResponse({ status: 200, description: 'Paginated list of carrier bids' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Carrier role required' })
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
  @ApiResponse({ status: 200, description: 'List of bids for the load' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async getLoadBids(@Param('loadId') loadId: string) {
    return this.bidService.getLoadBids(loadId);
  }

  /** PATCH /bids/:id/accept — accept a bid, creates shipment (SHIPPER only) */
  @Patch(':id/accept')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SHIPPER)
  @ApiOperation({ summary: 'Accept a bid and create a shipment' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Bid accepted — shipment created' })
  @ApiResponse({ status: 400, description: 'Load not in AVAILABLE status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Shipper role or ownership required' })
  @ApiResponse({ status: 404, description: 'Bid not found' })
  async acceptBid(@CurrentUser() user: AuthPayload, @Param('id') id: string) {
    return this.bidService.acceptBid(id, user.userId);
  }

  /** PATCH /bids/:id/reject — reject a bid (SHIPPER only) */
  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SHIPPER)
  @ApiOperation({ summary: 'Reject a bid' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Bid rejected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Shipper role or ownership required' })
  @ApiResponse({ status: 404, description: 'Bid not found' })
  async rejectBid(@CurrentUser() user: AuthPayload, @Param('id') id: string) {
    return this.bidService.rejectBid(id, user.userId);
  }

  /** PATCH /bids/:id/withdraw — withdraw own bid (CARRIER only) */
  @Patch(':id/withdraw')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.CARRIER)
  @ApiOperation({ summary: 'Withdraw a pending bid' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Bid withdrawn' })
  @ApiResponse({ status: 400, description: 'Bid is not in PENDING status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Carrier role or ownership required' })
  @ApiResponse({ status: 404, description: 'Bid not found' })
  async withdrawBid(@CurrentUser() user: AuthPayload, @Param('id') id: string) {
    return this.bidService.withdrawBid(id, user.userId);
  }
}
