/**
 * KALEN RBAC Permission Checking
 * Check roles against permissions and agent scopes against resources.
 */

import { Role, Permission, rolePermissions } from "./roles";

/**
 * Check if a role has a specific permission.
 *
 * @param role - The role to check
 * @param permission - The permission to verify
 * @returns Whether the role has the permission
 */
export function checkPermission(role: Role, permission: Permission): boolean {
  const permissions = rolePermissions.get(role);
  if (!permissions) {
    return false;
  }
  return permissions.has(permission);
}

/**
 * Check if a role has all of the specified permissions.
 *
 * @param role - The role to check
 * @param permissions - Array of permissions to verify
 * @returns Whether the role has all permissions
 */
export function checkPermissions(role: Role, permissions: Permission[]): boolean {
  const rolePerms = rolePermissions.get(role);
  if (!rolePerms) {
    return false;
  }
  return permissions.every((p) => rolePerms.has(p));
}

/**
 * Check if a role has any of the specified permissions.
 *
 * @param role - The role to check
 * @param permissions - Array of permissions (any one is sufficient)
 * @returns Whether the role has at least one permission
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  const rolePerms = rolePermissions.get(role);
  if (!rolePerms) {
    return false;
  }
  return permissions.some((p) => rolePerms.has(p));
}

/**
 * Get all permissions for a role.
 *
 * @param role - The role to query
 * @returns Set of permissions granted to the role
 */
export function getRolePermissions(role: Role): Set<Permission> {
  return rolePermissions.get(role) ?? new Set();
}

/**
 * Scope definition for an agent's access boundaries.
 */
export interface AgentScope {
  /** Agent ID this scope applies to */
  agentId: string;
  /** Rooms the agent can access (empty = all accessible) */
  rooms: string[];
  /** Tools the agent can invoke */
  tools: string[];
  /** Humans the agent can message directly */
  humans: string[];
  /** Whether the scope restricts to explicit lists (true) or uses defaults (false) */
  restricted: boolean;
}

/**
 * Check if an agent's scope allows access to a specific resource.
 *
 * @param scope - The agent's scope definition
 * @param resource - The resource to check access for
 * @returns Whether access is allowed within the scope
 */
export function checkScope(scope: AgentScope, resource: ScopeResource): boolean {
  if (!scope.restricted) {
    return true;
  }

  switch (resource.type) {
    case "room":
      return scope.rooms.length === 0 || scope.rooms.includes(resource.id);
    case "tool":
      return scope.tools.length === 0 || scope.tools.includes(resource.id);
    case "human":
      return scope.humans.length === 0 || scope.humans.includes(resource.id);
    default:
      return false;
  }
}

/**
 * Resource types that can be scope-checked
 */
export type ScopeResource =
  | { type: "room"; id: string }
  | { type: "tool"; id: string }
  | { type: "human"; id: string };

/**
 * Evaluate a combined RBAC + scope check for an agent.
 *
 * @param role - The agent's role
 * @param permission - The required permission
 * @param scope - The agent's scope
 * @param resource - The resource being accessed
 * @returns Whether the agent is allowed to access the resource
 */
export function evaluateAccess(
  role: Role,
  permission: Permission,
  scope: AgentScope,
  resource: ScopeResource,
): { allowed: boolean; reason?: string } {
  // First check RBAC
  if (!checkPermission(role, permission)) {
    return { allowed: false, reason: `Role "${role}" does not have permission "${permission}"` };
  }

  // Then check scope
  if (!checkScope(scope, resource)) {
    return { allowed: false, reason: `Agent scope does not allow access to ${resource.type} "${resource.id}"` };
  }

  return { allowed: true };
}
