import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthPayload } from '@truck-shipping/shared-types';
import { UserRole } from '@truck-shipping/shared-types';
import { createVehicleSchema, updateVehicleSchema } from '@truck-shipping/shared-validators';

import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';

import { VehicleService } from './vehicle.service';

@Controller('vehicles')
@ApiTags('Vehicles')
@ApiBearerAuth()
@Roles(UserRole.CARRIER)
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  /** GET /vehicles — get my vehicles */
  @Get()
  @ApiOperation({ summary: 'Get my registered vehicles' })
  @ApiResponse({ status: 200, description: 'List of carrier vehicles' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Carrier role required' })
  async getMyVehicles(@CurrentUser() user: AuthPayload) {
    return this.vehicleService.getMyVehicles(user.userId);
  }

  /** POST /vehicles — register a vehicle */
  @Post()
  @ApiOperation({ summary: 'Register a new vehicle' })
  @ApiResponse({ status: 201, description: 'Vehicle registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Carrier role required' })
  async addVehicle(@CurrentUser() user: AuthPayload, @Body() body: unknown) {
    const input = createVehicleSchema.parse(body);
    return this.vehicleService.addVehicle(user.userId, input);
  }

  /** PATCH /vehicles/:id — update vehicle */
  @Patch(':id')
  @ApiOperation({ summary: 'Update vehicle details' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Vehicle updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Carrier role or ownership required' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async updateVehicle(
    @CurrentUser() user: AuthPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const input = updateVehicleSchema.parse(body);
    return this.vehicleService.updateVehicle(id, user.userId, input);
  }

  /** DELETE /vehicles/:id — deactivate vehicle */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a vehicle' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Vehicle deactivated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Carrier role or ownership required' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async removeVehicle(@CurrentUser() user: AuthPayload, @Param('id') id: string) {
    return this.vehicleService.removeVehicle(id, user.userId);
  }
}
