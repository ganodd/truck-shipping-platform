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
import { locationUpdateSchema, updateStatusSchema } from '@truck-shipping/shared-validators';

import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';

import { ShipmentService } from './shipment.service';

@Controller('shipments')
@ApiTags('Shipments')
@ApiBearerAuth()
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  /** GET /shipments — list shipments (role-scoped) */
  @Get()
  @ApiOperation({ summary: 'List shipments (role-scoped)' })
  @ApiResponse({ status: 200, description: 'Paginated list of shipments for the calling user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listShipments(
    @CurrentUser() user: AuthPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.shipmentService.getMyShipments(user.userId, user.role, Number(page), Number(limit));
  }

  /** GET /shipments/:id — get shipment details */
  @Get(':id')
  @ApiOperation({ summary: 'Get shipment by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Shipment detail with events and location' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  async getShipment(@CurrentUser() user: AuthPayload, @Param('id') id: string) {
    return this.shipmentService.getShipment(id, user.userId, user.role);
  }

  /** PATCH /shipments/:id/status — update shipment status (CARRIER only) */
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.CARRIER)
  @ApiOperation({ summary: 'Update shipment status (pickup → in-transit → delivered)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Shipment status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Carrier role or assignment required' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  async updateStatus(
    @CurrentUser() user: AuthPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const input = updateStatusSchema.parse(body);
    return this.shipmentService.updateStatus(id, user.userId, input);
  }

  /** POST /shipments/:id/location — push GPS location update (CARRIER only) */
  @Post(':id/location')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.CARRIER)
  @ApiOperation({ summary: 'Post a GPS location update for an in-transit shipment' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, description: 'Location update recorded' })
  @ApiResponse({ status: 400, description: 'Validation error or shipment not in transit' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Carrier role or assignment required' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  async addLocation(
    @CurrentUser() user: AuthPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const input = locationUpdateSchema.parse(body);
    return this.shipmentService.addLocationUpdate(id, user.userId, input);
  }

  /** GET /shipments/:id/location — get latest GPS position */
  @Get(':id/location')
  @ApiOperation({ summary: 'Get latest GPS position for a shipment' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Latest GPS coordinates and timestamp' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Shipment not found or no location recorded yet' })
  async getLatestLocation(@Param('id') id: string) {
    return this.shipmentService.getLatestLocation(id);
  }

  /** GET /shipments/:id/location/history — full GPS trail */
  @Get(':id/location/history')
  @ApiOperation({ summary: 'Get GPS location history for a shipment' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Paginated GPS location history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  async getLocationHistory(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 100,
  ) {
    return this.shipmentService.getLocationHistory(id, Number(page), Number(limit));
  }
}
