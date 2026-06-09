/**
 * MCP Tool Browser Component
 * Browsable catalog of available MCP tools across all servers.
 */

"use client";

import React, { useState } from "react";
import {
  Wrench,
  Server,
  Search,
  ChevronDown,
  ChevronRight,
  Circle,
  ExternalLink,
} from "lucide-react";
import { clsx } from "clsx";
import type { MCPServerInfo } from "@/lib/types";

interface MCPToolBrowserProps {
  servers: MCPServerInfo[];
  isLoading?: boolean;
  onToolSelect?: (serverId: string, toolName: string) => void;
}

const statusColors = {
  connected: "bg-emerald-500",
  disconnected: "bg-kalen-text-muted",
  error: "bg-kalen-error",
};

export function MCPToolBrowser({ servers, isLoading, onToolSelect }: MCPToolBrowserProps) {
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const toggleServer = (serverId: string) => {
    setExpandedServers((prev) => {
      const next = new Set(prev);
      if (next.has(serverId)) {
        next.delete(serverId);
      } else {
        next.add(serverId);
      }
      return next;
    });
  };

  // Filter tools by search
  const filteredServers = servers.map((server) => ({
    ...server,
    tools: server.tools.filter(
      (tool) =>
        !search ||
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.description.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((server) => server.tools.length > 0 || !search);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-kalen-text-muted"
        />
        <input
          type="text"
          placeholder="Search tools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-kalen-bg border border-kalen-border rounded-lg pl-9 pr-4 py-2 text-sm text-kalen-text placeholder:text-kalen-text-muted focus:outline-none focus:border-kalen-primary transition-colors"
        />
      </div>

      {/* Server list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-kalen-border bg-kalen-surface p-4">
              <div className="h-4 w-40 bg-kalen-surface-3 rounded mb-3" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-kalen-surface-3 rounded" />
                <div className="h-3 w-3/4 bg-kalen-surface-3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredServers.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-kalen-surface-2 flex items-center justify-center mx-auto mb-4">
            <Wrench size={28} className="text-kalen-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-kalen-text mb-1">No MCP tools found</h3>
          <p className="text-sm text-kalen-text-muted">
            Connect MCP servers to discover available tools
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredServers.map((server) => {
            const isExpanded = expandedServers.has(server.serverId);
            return (
              <div
                key={server.serverId}
                className="rounded-xl border border-kalen-border bg-kalen-surface overflow-hidden"
              >
                {/* Server header */}
                <button
                  onClick={() => toggleServer(server.serverId)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-kalen-surface-2 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-kalen-surface-3 flex items-center justify-center">
                    <Server size={16} className="text-kalen-text-secondary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-kalen-text">
                        {server.name}
                      </span>
                      <span className="text-[10px] text-kalen-text-muted">
                        v{server.version}
                      </span>
                      <Circle
                        size={8}
                        className={clsx("fill-current", statusColors[server.status])}
                      />
                    </div>
                    <span className="text-xs text-kalen-text-muted">
                      {server.tools.length} tool{server.tools.length !== 1 ? "s" : ""} •{" "}
                      {server.transport}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-kalen-text-muted" />
                  ) : (
                    <ChevronRight size={16} className="text-kalen-text-muted" />
                  )}
                </button>

                {/* Tools */}
                {isExpanded && (
                  <div className="border-t border-kalen-border">
                    {server.tools.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-kalen-text-muted">
                        No tools available
                      </div>
                    ) : (
                      server.tools.map((tool) => (
                        <button
                          key={tool.name}
                          onClick={() => onToolSelect?.(server.serverId, tool.name)}
                          className="w-full flex items-start gap-3 p-3 hover:bg-kalen-surface-2 transition-colors text-left border-b border-kalen-border last:border-b-0"
                        >
                          <Wrench size={14} className="text-kalen-accent mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-kalen-text">
                              {tool.name}
                            </div>
                            <p className="text-xs text-kalen-text-muted line-clamp-2 mt-0.5">
                              {tool.description}
                            </p>
                            {tool.inputSchema.properties && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {Object.keys(tool.inputSchema.properties).map((param) => (
                                  <span
                                    key={param}
                                    className={clsx(
                                      "px-1.5 py-0.5 rounded text-[10px] font-mono",
                                      tool.inputSchema.required?.includes(param)
                                        ? "bg-kalen-accent/10 text-kalen-accent"
                                        : "bg-kalen-surface-3 text-kalen-text-muted"
                                    )}
                                  >
                                    {param}
                                    {tool.inputSchema.required?.includes(param) && "*"}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <ExternalLink size={12} className="text-kalen-text-muted flex-shrink-0 mt-1" />
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
