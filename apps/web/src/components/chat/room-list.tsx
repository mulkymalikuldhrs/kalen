/**
 * Room List Component
 * Displays the list of chat rooms with filters.
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Hash, Users, Bot, Plus, Search } from "lucide-react";
import { clsx } from "clsx";
import type { Room } from "@/lib/types";

interface RoomListProps {
  rooms: Room[];
  activeRoomId?: string | null;
  isLoading?: boolean;
}

const roomTypeFilters = [
  { value: "all", label: "All" },
  { value: "direct", label: "Direct" },
  { value: "group", label: "Group" },
  { value: "agent-workspace", label: "Agent Rooms" },
] as const;

export function RoomList({ rooms, activeRoomId, isLoading }: RoomListProps) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filteredRooms = rooms.filter((room) => {
    if (filter !== "all" && room.type !== filter) return false;
    if (search && !(room.name || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-kalen-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-kalen-text">Rooms</h2>
          <button
            className="p-1.5 rounded-lg bg-kalen-primary/10 text-kalen-primary hover:bg-kalen-primary/20 transition-colors"
            aria-label="Create room"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-kalen-text-muted"
          />
          <input
            type="text"
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-kalen-bg border border-kalen-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-kalen-text placeholder:text-kalen-text-muted focus:outline-none focus:border-kalen-primary transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1">
          {roomTypeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={clsx(
                "px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors",
                filter === f.value
                  ? "bg-kalen-primary/10 text-kalen-primary"
                  : "text-kalen-text-muted hover:text-kalen-text-secondary hover:bg-kalen-surface-2"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-lg bg-kalen-surface-3" />
                <div className="flex-1">
                  <div className="h-3 w-24 bg-kalen-surface-3 rounded mb-1" />
                  <div className="h-2 w-16 bg-kalen-surface-3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-4 text-center text-sm text-kalen-text-muted">
            No rooms found
          </div>
        ) : (
          filteredRooms.map((room) => (
            <Link
              key={room.roomId}
              href={`/chat/${room.roomId}`}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 transition-colors border-l-2",
                activeRoomId === room.roomId
                  ? "bg-kalen-primary/5 border-kalen-primary text-kalen-text"
                  : "border-transparent text-kalen-text-secondary hover:bg-kalen-surface-2 hover:text-kalen-text"
              )}
            >
              <div
                className={clsx(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  room.type === "agent-workspace"
                    ? "bg-kalen-agent-bg text-kalen-agent"
                    : room.type === "direct"
                    ? "bg-kalen-human-bg text-kalen-human"
                    : "bg-kalen-surface-3 text-kalen-text-secondary"
                )}
              >
                {room.type === "direct" ? (
                  <Users size={16} />
                ) : room.type === "agent-workspace" ? (
                  <Bot size={16} />
                ) : (
                  <Hash size={16} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {room.name || room.roomId}
                  </span>
                  {room.memberKinds.includes("agent") && (
                    <span className="agent-badge text-[8px]">ai</span>
                  )}
                </div>
                <p className="text-[11px] text-kalen-text-muted truncate">
                  {room.members.length} member{room.members.length !== 1 ? "s" : ""}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
