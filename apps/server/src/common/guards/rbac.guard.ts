/**
 * KALEN Server — RBAC Permission Guard
 * Checks if the authenticated identity has the required permission(s).
 * Must be used AFTER JwtAuthGuard (depends on request.identity).
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { checkPermission, Role, Permission, rolePermissions } from '@kalen/identity';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const identity = request.identity;

    if (!identity) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'No identity found on request — ensure JwtAuthGuard is applied first',
      });
    }

    // Determine the user's role from their token scopes or database
    // For now, we use a simple role mapping based on the identity kind and scopes
    const userRole = this.resolveRole(identity);

    // Check each required permission
    for (const permission of requiredPermissions) {
      if (!checkPermission(userRole, permission)) {
        throw new ForbiddenException({
          error: 'INSUFFICIENT_SCOPE',
          message: `Role "${userRole}" lacks permission "${permission}"`,
          details: [
            {
              field: 'permission',
              message: `Required permission: ${permission}`,
            },
          ],
        });
      }
    }

    return true;
  }

  /**
   * Resolve an identity's role.
   * TODO: Look up role from database instead of inferring from token.
   */
  private resolveRole(identity: {
    kind: 'human' | 'agent';
    sub: string;
    scopes?: string[];
  }): Role {
    if (identity.kind === 'agent') {
      // Agents with more scopes get privileged role
      const scopeCount = identity.scopes?.length ?? 0;
      return scopeCount > 5 ? Role.AGENT_PRIVILEGED : Role.AGENT_BASIC;
    }

    // TODO: Check for admin roles from database
    return Role.HUMAN_USER;
  }
}
