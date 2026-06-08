/**
 * KALEN MCP Tool Governance — Allowlist/Denylist
 * Per-agent tool access control with allowlist enforcement.
 */

/** Allowlist entry for an agent or user */
interface AllowListEntry {
  /** Entity ID (agent ID or user ID) */
  entityId: string;
  /** Set of explicitly allowed tool names (empty = all allowed unless denied) */
  allowed: Set<string>;
  /** Set of explicitly denied tool names */
  denied: Set<string>;
  /** Whether the allowlist is in restrictive mode (only listed tools allowed) */
  restrictive: boolean;
}

/**
 * Tool Allowlist — governs which tools each agent/user can invoke.
 *
 * Two modes:
 * - Permissive (default): All tools are allowed unless explicitly denied
 * - Restrictive: Only explicitly allowed tools can be used
 */
export class AllowList {
  private entries: Map<string, AllowListEntry> = new Map();
  /** Global deny list — applies to all entities */
  private globalDenied: Set<string> = new Set();

  /**
   * Allow a tool for a specific entity.
   *
   * @param entityId - Agent or user ID
   * @param toolName - Tool name to allow
   */
  allowTool(entityId: string, toolName: string): void {
    let entry = this.entries.get(entityId);
    if (!entry) {
      entry = {
        entityId,
        allowed: new Set(),
        denied: new Set(),
        restrictive: false,
      };
      this.entries.set(entityId, entry);
    }

    entry.allowed.add(toolName);
    entry.denied.delete(toolName); // Remove from deny if present
  }

  /**
   * Deny a tool for a specific entity.
   *
   * @param entityId - Agent or user ID
   * @param toolName - Tool name to deny
   */
  denyTool(entityId: string, toolName: string): void {
    let entry = this.entries.get(entityId);
    if (!entry) {
      entry = {
        entityId,
        allowed: new Set(),
        denied: new Set(),
        restrictive: false,
      };
      this.entries.set(entityId, entry);
    }

    entry.denied.add(toolName);
    entry.allowed.delete(toolName); // Remove from allow if present
  }

  /**
   * Add a tool to the global deny list.
   * No entity can invoke globally denied tools.
   *
   * @param toolName - Tool name to globally deny
   */
  denyGlobal(toolName: string): void {
    this.globalDenied.add(toolName);
  }

  /**
   * Remove a tool from the global deny list.
   *
   * @param toolName - Tool name to remove from global deny
   */
  removeGlobalDeny(toolName: string): void {
    this.globalDenied.delete(toolName);
  }

  /**
   * Set an entity's allowlist to restrictive mode.
   * In restrictive mode, only explicitly allowed tools can be invoked.
   *
   * @param entityId - Agent or user ID
   * @param restrictive - Whether to use restrictive mode
   */
  setRestrictive(entityId: string, restrictive: boolean): void {
    let entry = this.entries.get(entityId);
    if (!entry) {
      entry = {
        entityId,
        allowed: new Set(),
        denied: new Set(),
        restrictive,
      };
      this.entries.set(entityId, entry);
    } else {
      entry.restrictive = restrictive;
    }
  }

  /**
   * Check if a tool is allowed for a specific entity.
   *
   * Evaluation order:
   * 1. Global deny list — if globally denied, always denied
   * 2. Entity-specific deny list — if explicitly denied, denied
   * 3. Restrictive mode — if restrictive and not in allowed list, denied
   * 4. Otherwise, allowed
   *
   * @param entityId - Agent or user ID
   * @param toolName - Tool name to check
   * @returns Whether the tool is allowed
   */
  isAllowed(entityId: string, toolName: string): boolean {
    // Check global deny list first
    if (this.globalDenied.has(toolName)) {
      return false;
    }

    const entry = this.entries.get(entityId);

    // No entity-specific entry — permissive by default
    if (!entry) {
      return true;
    }

    // Check entity-specific deny list
    if (entry.denied.has(toolName)) {
      return false;
    }

    // Check restrictive mode
    if (entry.restrictive) {
      return entry.allowed.has(toolName);
    }

    // Permissive mode — check if explicitly allowed or not denied
    return true;
  }

  /**
   * Get all allowed tools for an entity.
   *
   * @param entityId - Agent or user ID
   * @param allTools - All known tool names (used for restrictive mode listing)
   * @returns Set of allowed tool names
   */
  getAllowedTools(entityId: string, allTools?: string[]): Set<string> {
    const entry = this.entries.get(entityId);

    if (!entry) {
      // No entry — permissive, return all tools minus globally denied
      if (allTools) {
        return new Set(allTools.filter((t) => !this.globalDenied.has(t)));
      }
      return new Set();
    }

    if (entry.restrictive) {
      // Restrictive — only explicitly allowed (minus globally denied)
      const allowed = new Set(entry.allowed);
      for (const tool of this.globalDenied) {
        allowed.delete(tool);
      }
      return allowed;
    }

    // Permissive — all tools minus denied and globally denied
    if (allTools) {
      return new Set(
        allTools.filter(
          (t) => !entry.denied.has(t) && !this.globalDenied.has(t),
        ),
      );
    }

    // No allTools provided — return just the explicitly allowed set
    return entry.allowed;
  }

  /**
   * Remove an entity's allowlist entry.
   *
   * @param entityId - Agent or user ID
   */
  removeEntity(entityId: string): void {
    this.entries.delete(entityId);
  }

  /**
   * Check if an entity has an allowlist entry.
   */
  hasEntry(entityId: string): boolean {
    return this.entries.has(entityId);
  }
}
