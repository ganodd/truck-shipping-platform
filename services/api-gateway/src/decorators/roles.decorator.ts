import { SetMetadata } from '@nestjs/common';

import type { UserRole } from '@truck-shipping/shared-types';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to specific user roles.
 * Usage: @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
