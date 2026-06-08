/**
 * KALEN RBAC Roles and Permissions
 * Role-based access control with granular permissions.
 */

/**
 * System roles in KALEN
 */
export enum Role {
  HUMAN_USER = "human_user",
  AGENT_BASIC = "agent_basic",
  AGENT_PRIVILEGED = "agent_privileged",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

/**
 * Granular permissions for KALEN operations
 */
export enum Permission {
  // Messaging
  MESSAGE_SEND = "message:send",
  MESSAGE_READ = "message:read",
  MESSAGE_EDIT_OWN = "message:edit_own",
  MESSAGE_DELETE_OWN = "message:delete_own",
  MESSAGE_DELETE_ANY = "message:delete_any",
  MESSAGE_REACT = "message:react",

  // Rooms
  ROOM_CREATE = "room:create",
  ROOM_READ = "room:read",
  ROOM_UPDATE = "room:update",
  ROOM_DELETE = "room:delete",
  ROOM_INVITE = "room:invite",
  ROOM_KICK = "room:kick",
  ROOM_MANAGE_MEMBERS = "room:manage_members",

  // Agent operations
  AGENT_CREATE = "agent:create",
  AGENT_READ = "agent:read",
  AGENT_UPDATE_OWN = "agent:update_own",
  AGENT_UPDATE_ANY = "agent:update_any",
  AGENT_DEACTIVATE_OWN = "agent:deactivate_own",
  AGENT_DEACTIVATE_ANY = "agent:deactivate_any",
  AGENT_SCOPE_MANAGE = "agent:scope_manage",

  // MCP operations
  MCP_TOOL_CALL = "mcp:tool_call",
  MCP_TOOL_LIST = "mcp:tool_list",
  MCP_RESOURCE_READ = "mcp:resource_read",
  MCP_SERVER_REGISTER = "mcp:server_register",
  MCP_SERVER_MANAGE = "mcp:server_manage",

  // A2A operations
  A2A_TASK_CREATE = "a2a:task_create",
  A2A_TASK_READ = "a2a:task_read",
  A2A_TASK_CANCEL_OWN = "a2a:task_cancel_own",
  A2A_TASK_CANCEL_ANY = "a2a:task_cancel_any",
  A2A_AGENT_DISCOVER = "a2a:agent_discover",
  A2A_AGENT_REGISTER = "a2a:agent_register",

  // Identity
  IDENTITY_READ = "identity:read",
  IDENTITY_UPDATE_OWN = "identity:update_own",
  IDENTITY_KEY_ROTATE = "identity:key_rotate",

  // Calls
  CALL_CREATE = "call:create",
  CALL_JOIN = "call:join",
  CALL_MANAGE = "call:manage",

  // Files
  FILE_UPLOAD = "file:upload",
  FILE_READ = "file:read",
  FILE_DELETE_OWN = "file:delete_own",
  FILE_DELETE_ANY = "file:delete_any",

  // Admin
  ADMIN_DASHBOARD = "admin:dashboard",
  ADMIN_AUDIT_READ = "admin:audit_read",
  ADMIN_USER_MANAGE = "admin:user_manage",
  ADMIN_SYSTEM_CONFIG = "admin:system_config",
}

/**
 * Role-to-permissions mapping.
 * Each role inherits a specific set of permissions.
 */
export const rolePermissions: Map<Role, Set<Permission>> = new Map([
  [
    Role.HUMAN_USER,
    new Set([
      Permission.MESSAGE_SEND,
      Permission.MESSAGE_READ,
      Permission.MESSAGE_EDIT_OWN,
      Permission.MESSAGE_DELETE_OWN,
      Permission.MESSAGE_REACT,
      Permission.ROOM_CREATE,
      Permission.ROOM_READ,
      Permission.ROOM_UPDATE,
      Permission.ROOM_INVITE,
      Permission.AGENT_CREATE,
      Permission.AGENT_READ,
      Permission.AGENT_UPDATE_OWN,
      Permission.AGENT_DEACTIVATE_OWN,
      Permission.MCP_TOOL_LIST,
      Permission.A2A_TASK_CREATE,
      Permission.A2A_TASK_READ,
      Permission.A2A_TASK_CANCEL_OWN,
      Permission.A2A_AGENT_DISCOVER,
      Permission.IDENTITY_READ,
      Permission.IDENTITY_UPDATE_OWN,
      Permission.IDENTITY_KEY_ROTATE,
      Permission.CALL_CREATE,
      Permission.CALL_JOIN,
      Permission.FILE_UPLOAD,
      Permission.FILE_READ,
      Permission.FILE_DELETE_OWN,
    ]),
  ],
  [
    Role.AGENT_BASIC,
    new Set([
      Permission.MESSAGE_SEND,
      Permission.MESSAGE_READ,
      Permission.MESSAGE_EDIT_OWN,
      Permission.MESSAGE_DELETE_OWN,
      Permission.MESSAGE_REACT,
      Permission.ROOM_READ,
      Permission.MCP_TOOL_CALL,
      Permission.MCP_TOOL_LIST,
      Permission.MCP_RESOURCE_READ,
      Permission.A2A_TASK_CREATE,
      Permission.A2A_TASK_READ,
      Permission.A2A_TASK_CANCEL_OWN,
      Permission.IDENTITY_READ,
      Permission.FILE_READ,
    ]),
  ],
  [
    Role.AGENT_PRIVILEGED,
    new Set([
      Permission.MESSAGE_SEND,
      Permission.MESSAGE_READ,
      Permission.MESSAGE_EDIT_OWN,
      Permission.MESSAGE_DELETE_OWN,
      Permission.MESSAGE_REACT,
      Permission.ROOM_CREATE,
      Permission.ROOM_READ,
      Permission.ROOM_UPDATE,
      Permission.ROOM_INVITE,
      Permission.MCP_TOOL_CALL,
      Permission.MCP_TOOL_LIST,
      Permission.MCP_RESOURCE_READ,
      Permission.A2A_TASK_CREATE,
      Permission.A2A_TASK_READ,
      Permission.A2A_TASK_CANCEL_OWN,
      Permission.A2A_AGENT_DISCOVER,
      Permission.IDENTITY_READ,
      Permission.CALL_JOIN,
      Permission.FILE_READ,
      Permission.FILE_UPLOAD,
    ]),
  ],
  [
    Role.ADMIN,
    new Set([
      // All human permissions
      Permission.MESSAGE_SEND,
      Permission.MESSAGE_READ,
      Permission.MESSAGE_EDIT_OWN,
      Permission.MESSAGE_DELETE_OWN,
      Permission.MESSAGE_DELETE_ANY,
      Permission.MESSAGE_REACT,
      Permission.ROOM_CREATE,
      Permission.ROOM_READ,
      Permission.ROOM_UPDATE,
      Permission.ROOM_DELETE,
      Permission.ROOM_INVITE,
      Permission.ROOM_KICK,
      Permission.ROOM_MANAGE_MEMBERS,
      Permission.AGENT_CREATE,
      Permission.AGENT_READ,
      Permission.AGENT_UPDATE_OWN,
      Permission.AGENT_UPDATE_ANY,
      Permission.AGENT_DEACTIVATE_OWN,
      Permission.AGENT_DEACTIVATE_ANY,
      Permission.AGENT_SCOPE_MANAGE,
      Permission.MCP_TOOL_CALL,
      Permission.MCP_TOOL_LIST,
      Permission.MCP_RESOURCE_READ,
      Permission.MCP_SERVER_REGISTER,
      Permission.A2A_TASK_CREATE,
      Permission.A2A_TASK_READ,
      Permission.A2A_TASK_CANCEL_OWN,
      Permission.A2A_TASK_CANCEL_ANY,
      Permission.A2A_AGENT_DISCOVER,
      Permission.A2A_AGENT_REGISTER,
      Permission.IDENTITY_READ,
      Permission.IDENTITY_UPDATE_OWN,
      Permission.IDENTITY_KEY_ROTATE,
      Permission.CALL_CREATE,
      Permission.CALL_JOIN,
      Permission.CALL_MANAGE,
      Permission.FILE_UPLOAD,
      Permission.FILE_READ,
      Permission.FILE_DELETE_OWN,
      Permission.ADMIN_DASHBOARD,
      Permission.ADMIN_AUDIT_READ,
      Permission.ADMIN_USER_MANAGE,
    ]),
  ],
  [
    Role.SUPER_ADMIN,
    new Set(Object.values(Permission)), // All permissions
  ],
]);
