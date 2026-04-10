import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthPayload } from '@truck-shipping/shared-types';
import { ratingSchema } from '@truck-shipping/shared-validators';

import { CurrentUser } from '../../decorators/current-user.decorator';

import { RatingService } from './rating.service';

@Controller('ratings')
@ApiTags('Ratings')
@ApiBearerAuth()
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  /** POST /ratings/shipments/:shipmentId — rate a shipment */
  @Post('shipments/:shipmentId')
  @ApiOperation({ summary: 'Rate a delivered shipment (mutual rating)' })
  @ApiParam({ name: 'shipmentId', type: String })
  @ApiResponse({ status: 201, description: 'Rating submitted' })
  @ApiResponse({ status: 400, description: 'Shipment not delivered or already rated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Must be shipper or carrier on this shipment' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  async rateShipment(
    @CurrentUser() user: AuthPayload,
    @Param('shipmentId') shipmentId: string,
    @Body() body: unknown,
  ) {
    const input = ratingSchema.parse(body);
    return this.ratingService.rateShipment(shipmentId, user.userId, input);
  }

  /** GET /ratings/shipments/:shipmentId — get ratings for a shipment */
  @Get('shipments/:shipmentId')
  @ApiOperation({ summary: 'Get all ratings for a shipment' })
  @ApiParam({ name: 'shipmentId', type: String })
  @ApiResponse({ status: 200, description: 'List of ratings for the shipment' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  async getShipmentRatings(@Param('shipmentId') shipmentId: string) {
    return this.ratingService.getShipmentRatings(shipmentId);
  }

  /** GET /ratings/users/:userId — get ratings received by a user */
  @Get('users/:userId')
  @ApiOperation({ summary: 'Get ratings received by a user (with average score)' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 200, description: 'Paginated ratings with average score' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserRatings(
    @Param('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.ratingService.getUserRatings(userId, Number(page), Number(limit));
  }
}
