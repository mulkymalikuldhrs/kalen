/**
 * Header Component
 * Top bar with search, notifications, and context info.
 */

"use client";

import React, { useState } from "react";
import { Search, Bell, Moon, Sun } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const { identity } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-kalen-surface border-b border-kalen-border">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-kalen-text-muted"
          />
          <input
            type="text"
            placeholder="Search messages, agents, rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-kalen-bg border border-kalen-border rounded-lg pl-9 pr-4 py-2 text-sm text-kalen-text placeholder:text-kalen-text-muted focus:outline-none focus:border-kalen-primary focus:ring-1 focus:ring-kalen-primary/20 transition-colors"
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg hover:bg-kalen-surface-2 text-kalen-text-secondary hover:text-kalen-text transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-kalen-accent rounded-full" />
        </button>

        {/* Theme toggle placeholder */}
        <button
          className="p-2 rounded-lg hover:bg-kalen-surface-2 text-kalen-text-secondary hover:text-kalen-text transition-colors"
          aria-label="Toggle theme"
        >
          <Moon size={18} />
        </button>
      </div>
    </header>
  );
}
