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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import type { AuthPayload } from '@truck-shipping/shared-types';
import { UserRole } from '@truck-shipping/shared-types';
import {
  createLoadSchema,
  loadSearchSchema,
  updateLoadSchema,
} from '@truck-shipping/shared-validators';

import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { LoadService } from './load.service';

@Controller('loads')
@ApiTags('Loads')
@ApiBearerAuth()
export class LoadController {
  constructor(private readonly loadService: LoadService) {}

  /** POST /loads — create a new load (SHIPPER only) */
  @Post()
  @Roles(UserRole.SHIPPER)
  @ApiOperation({ summary: 'Create a new load posting' })
  async createLoad(@CurrentUser() user: AuthPayload, @Body() body: unknown) {
    const input = createLoadSchema.parse(body);
    return this.loadService.createLoad(user.userId, input);
  }

  /** GET /loads — search available loads (all authenticated users) */
  @Get()
  @ApiOperation({ summary: 'Search available loads' })
  async searchLoads(@Query() query: unknown) {
    const filters = loadSearchSchema.parse(query);
    return this.loadService.searchLoads(filters);
  }

  /** GET /loads/my — get loads posted by me (SHIPPER only) */
  @Get('my')
  @Roles(UserRole.SHIPPER)
  @ApiOperation({ summary: 'Get my posted loads' })
  async getMyLoads(
    @CurrentUser() user: AuthPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.loadService.getMyLoads(user.userId, Number(page), Number(limit));
  }

  /** GET /loads/:id — get load details */
  @Get(':id')
  @ApiOperation({ summary: 'Get load by ID' })
  @ApiParam({ name: 'id', type: String })
  async getLoad(@Param('id') id: string) {
    return this.loadService.getLoad(id);
  }

  /** PATCH /loads/:id — update load (SHIPPER, owner only) */
  @Patch(':id')
  @Roles(UserRole.SHIPPER)
  @ApiOperation({ summary: 'Update a load posting' })
  async updateLoad(
    @CurrentUser() user: AuthPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const input = updateLoadSchema.parse(body);
    return this.loadService.updateLoad(id, user.userId, input);
  }

  /** DELETE /loads/:id — cancel a load (SHIPPER, owner only) */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SHIPPER)
  @ApiOperation({ summary: 'Cancel a load' })
  async cancelLoad(@CurrentUser() user: AuthPayload, @Param('id') id: string) {
    return this.loadService.cancelLoad(id, user.userId);
  }

  /** GET /loads/:id/matches — rule-based carrier matches (SHIPPER, owner only) */
  @Get(':id/matches')
  @Roles(UserRole.SHIPPER)
  @ApiOperation({ summary: 'Get matched carriers for a load' })
  async getMatches(@CurrentUser() user: AuthPayload, @Param('id') id: string) {
    return this.loadService.getMatchedCarriers(id, user.userId);
  }
}
