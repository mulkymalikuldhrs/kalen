/**
 * Message Bubble Component
 * Renders a single message with different styles for human vs agent.
 */

"use client";

import React from "react";
import { Bot, User, Reply, MoreHorizontal } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { clsx } from "clsx";
import type { Message } from "@/lib/types";
import { IdentityBadge } from "@/components/identity/identity-badge";

interface MessageBubbleProps {
  message: Message;
  isOwn?: boolean;
  showAvatar?: boolean;
  senderName?: string;
}

export function MessageBubble({
  message,
  isOwn = false,
  showAvatar = true,
  senderName,
}: MessageBubbleProps) {
  const isAgent = message.senderKind === "agent";
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={clsx(
        "group flex gap-3 px-4 py-2 hover:bg-kalen-surface/50 transition-colors",
        isOwn && "bg-kalen-surface/30"
      )}
    >
      {/* Avatar */}
      {showAvatar ? (
        <div
          className={clsx(
            "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
            isAgent
              ? "bg-kalen-agent-bg text-kalen-agent border border-kalen-agent-border"
              : "bg-kalen-human-bg text-kalen-human border border-kalen-human-border"
          )}
        >
          {isAgent ? <Bot size={18} /> : <User size={18} />}
        </div>
      ) : (
        <div className="w-9 flex-shrink-0" />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        {showAvatar && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-kalen-text">
              {senderName || message.senderId}
            </span>
            <IdentityBadge kind={message.senderKind} size="sm" />
            <span className="text-[11px] text-kalen-text-muted">{time}</span>
          </div>
        )}

        {/* Message body */}
        <div className={clsx("rounded-lg", isAgent && "border-l-2 border-kalen-agent/40 pl-3")}>
          <div className="markdown-content text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Reactions */}
        {Object.keys(message.reactions).length > 0 && (
          <div className="flex gap-1 mt-1.5">
            {Object.entries(message.reactions).map(([emoji, userIds]) => (
              <button
                key={emoji}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-kalen-surface-2 border border-kalen-border text-xs hover:border-kalen-border-light transition-colors"
              >
                <span>{emoji}</span>
                <span className="text-kalen-text-muted">{userIds.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions (visible on hover) */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-start gap-1 pt-1">
        <button
          className="p-1 rounded hover:bg-kalen-surface-2 text-kalen-text-muted hover:text-kalen-text transition-colors"
          aria-label="Reply"
        >
          <Reply size={14} />
        </button>
        <button
          className="p-1 rounded hover:bg-kalen-surface-2 text-kalen-text-muted hover:text-kalen-text transition-colors"
          aria-label="More actions"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>
    </div>
  );
}
