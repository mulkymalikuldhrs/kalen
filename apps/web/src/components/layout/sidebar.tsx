/**
 * Sidebar Navigation
 * Left sidebar with rooms list, navigation links, and user info.
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Users,
  Settings,
  Wrench,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Hash,
  Bot,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRooms } from "@/hooks/use-rooms";
import { IdentityBadge } from "@/components/identity/identity-badge";
import { clsx } from "clsx";

const navItems = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/mcp", label: "MCP Tools", icon: Wrench },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { identity, logout } = useAuth();
  const { rooms, isLoading: roomsLoading } = useRooms();
  const [collapsed, setCollapsed] = useState(false);
  const [showRooms, setShowRooms] = useState(true);

  return (
    <aside
      className={clsx(
        "flex flex-col h-full bg-kalen-surface border-r border-kalen-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-kalen-border">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-kalen-primary to-kalen-accent flex items-center justify-center font-bold text-white text-sm">
              K
            </div>
            <span className="text-lg font-bold text-gradient-primary">KALEN</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-kalen-surface-2 text-kalen-text-secondary transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Main nav */}
        <div className="p-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors",
                  isActive
                    ? "bg-kalen-primary/10 text-kalen-primary"
                    : "text-kalen-text-secondary hover:bg-kalen-surface-2 hover:text-kalen-text"
                )}
              >
                <item.icon size={20} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Rooms section */}
        {!collapsed && (
          <div className="border-t border-kalen-border mt-2">
            <div className="flex items-center justify-between px-4 py-2">
              <button
                onClick={() => setShowRooms(!showRooms)}
                className="flex items-center gap-2 text-xs font-semibold text-kalen-text-muted uppercase tracking-wider hover:text-kalen-text-secondary"
              >
                <Hash size={14} />
                Rooms
                <ChevronRight
                  size={12}
                  className={clsx("transition-transform", showRooms && "rotate-90")}
                />
              </button>
              <button
                className="p-1 rounded hover:bg-kalen-surface-2 text-kalen-text-muted hover:text-kalen-text"
                aria-label="Create room"
              >
                <Plus size={14} />
              </button>
            </div>

            {showRooms && (
              <div className="px-2 pb-2">
                {roomsLoading ? (
                  <div className="px-3 py-2 text-xs text-kalen-text-muted">Loading rooms...</div>
                ) : rooms.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-kalen-text-muted">No rooms yet</div>
                ) : (
                  rooms.map((room) => {
                    const isActive = pathname === `/chat/${room.roomId}`;
                    return (
                      <Link
                        key={room.roomId}
                        href={`/chat/${room.roomId}`}
                        className={clsx(
                          "flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 transition-colors text-sm",
                          isActive
                            ? "bg-kalen-surface-2 text-kalen-text"
                            : "text-kalen-text-secondary hover:bg-kalen-surface-2 hover:text-kalen-text"
                        )}
                      >
                        {room.type === "direct" ? (
                          <Users size={14} />
                        ) : room.type === "agent-workspace" ? (
                          <Bot size={14} className="text-kalen-agent" />
                        ) : (
                          <Hash size={14} />
                        )}
                        <span className="truncate">{room.name || room.roomId}</span>
                        {room.memberKinds.includes("agent") && (
                          <span className="ml-auto agent-badge text-[8px]">ai</span>
                        )}
                      </Link>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-kalen-border p-3">
        {identity && !collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-kalen-primary/20 flex items-center justify-center text-kalen-primary text-sm font-semibold">
              {identity.kind === "human"
                ? identity.identity.displayName[0]?.toUpperCase()
                : "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {identity.kind === "human" ? identity.identity.displayName : "Agent"}
                </span>
                <IdentityBadge kind={identity.kind} size="sm" />
              </div>
              <p className="text-xs text-kalen-text-muted truncate">
                {identity.kind === "human" ? identity.identity.email : ""}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-kalen-surface-2 text-kalen-text-muted hover:text-kalen-error transition-colors"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : collapsed && identity ? (
          <button
            onClick={logout}
            className="w-full p-2 rounded-lg hover:bg-kalen-surface-2 text-kalen-text-muted hover:text-kalen-error transition-colors flex justify-center"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        ) : null}
      </div>
    </aside>
  );
}
