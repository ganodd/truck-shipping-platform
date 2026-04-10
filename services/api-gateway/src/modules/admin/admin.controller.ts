import { Controller, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@truck-shipping/shared-types';

import { Roles } from '../../decorators/roles.decorator';

import { AdminService } from './admin.service';

@Controller('admin')
@ApiTags('Admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** GET /admin/stats — platform-wide KPIs */
  @Get('stats')
  @ApiOperation({ summary: 'Get platform analytics and KPIs (admin only)' })
  @ApiResponse({ status: 200, description: 'Aggregated platform statistics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  async getStats() {
    return this.adminService.getStats();
  }

  /** GET /admin/users — paginated user list with optional filters */
  @Get('users')
  @ApiOperation({ summary: 'List all users with optional role/kyc filters (admin only)' })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  async listUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('role') role?: string,
    @Query('kyc') kyc?: string,
  ) {
    return this.adminService.listUsers(Number(page), Number(limit), role, kyc);
  }

  /** PATCH /admin/users/:id/kyc/approve — approve a user's KYC */
  @Patch('users/:id/kyc/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve KYC for a user (admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'KYC approved' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async approveKyc(@Param('id') id: string) {
    return this.adminService.approveKyc(id);
  }

  /** PATCH /admin/users/:id/kyc/reject — reject a user's KYC */
  @Patch('users/:id/kyc/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject KYC for a user (admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'KYC rejected' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async rejectKyc(@Param('id') id: string) {
    return this.adminService.rejectKyc(id);
  }

  /** GET /admin/loads — all loads across the platform */
  @Get('loads')
  @ApiOperation({ summary: 'List all loads across the platform (admin only)' })
  @ApiResponse({ status: 200, description: 'Paginated load list' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  async listLoads(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    return this.adminService.listLoads(Number(page), Number(limit), status);
  }
}
