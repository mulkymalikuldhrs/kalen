/**
 * KALEN Server — Permissions Decorator
 * Sets required permissions on route handlers for RBAC guard to check.
 */

import { SetMetadata } from '@nestjs/common';
import { Permission } from '@kalen/identity';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator that sets required permissions on a route handler.
 * Used by RbacGuard to check if the authenticated identity has access.
 *
 * @example
 * @RequirePermissions(Permission.MCP_TOOL_CALL)
 * @UseGuards(JwtAuthGuard, RbacGuard)
 * @Post('invoke')
 * invokeTool() { ... }
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
