/**
 * Room View Page
 * Individual room view with messages, members, and agent info.
 */

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Hash, Users, Bot, Info, ArrowLeft, AtSign } from "lucide-react";
import { useRooms, useRoomMessages } from "@/hooks/use-rooms";
import { RoomList } from "@/components/chat/room-list";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { TypingIndicatorDisplay } from "@/components/chat/typing-indicator";
import { IdentityBadge } from "@/components/identity/identity-badge";
import { PresenceBadge } from "@/components/chat/presence-badge";
import type { Room } from "@/lib/types";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { rooms, isLoading: roomsLoading } = useRooms();
  const { messages, isLoading: messagesLoading } = useRoomMessages(roomId);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const room = rooms.find((r) => r.roomId === roomId);

  return (
    <div className="flex h-full">
      {/* Room list sidebar (hidden on mobile) */}
      <div className="w-72 border-r border-kalen-border bg-kalen-surface hidden lg:block">
        <RoomList rooms={rooms} activeRoomId={roomId} isLoading={roomsLoading} />
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Room header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-kalen-border bg-kalen-surface">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/chat")}
              className="p-1.5 rounded-lg hover:bg-kalen-surface-2 text-kalen-text-muted lg:hidden"
              aria-label="Back to chat list"
            >
              <ArrowLeft size={18} />
            </button>
            <Hash size={18} className="text-kalen-text-muted" />
            <span className="text-sm font-semibold text-kalen-text">
              {room?.name || "Chat"}
            </span>
            <div className="flex items-center gap-1 text-xs text-kalen-text-muted ml-1">
              <Users size={12} />
              <span>{room?.members.length || 0}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {room?.memberKinds.includes("agent") && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-kalen-agent-bg border border-kalen-agent-border">
                <Bot size={12} className="text-kalen-agent" />
                <span className="text-[11px] text-kalen-agent font-medium">
                  {room.memberKinds.filter((k) => k === "agent").length} AI
                </span>
              </div>
            )}
            <button
              onClick={() => setShowInfoPanel(!showInfoPanel)}
              className={`p-1.5 rounded-lg hover:bg-kalen-surface-2 transition-colors ${
                showInfoPanel ? "text-kalen-primary bg-kalen-primary/10" : "text-kalen-text-muted"
              }`}
              aria-label="Toggle room info"
            >
              <Info size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <MessageList messages={messages} isLoading={messagesLoading} currentUserId="user-1" />

        {/* Typing indicator */}
        <TypingIndicatorDisplay typers={[]} />

        {/* Input */}
        <MessageInput
          onSend={(content, contentType) => {
            // TODO: Send via Socket.IO or API
            console.log("Send message:", { content, contentType, roomId });
          }}
          onTypingStart={() => {
            // TODO: Emit typing:start
          }}
          onTypingStop={() => {
            // TODO: Emit typing:stop
          }}
        />
      </div>

      {/* Right info panel (collapsible) */}
      {showInfoPanel && (
        <div className="w-72 border-l border-kalen-border bg-kalen-surface hidden md:block overflow-y-auto custom-scrollbar">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-kalen-text mb-4">Room Members</h3>
            <div className="space-y-2">
              {room?.members.map((memberId, index) => {
                const kind = room.memberKinds[index];
                return (
                  <div
                    key={memberId}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-kalen-surface-2 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        kind === "agent"
                          ? "bg-kalen-agent-bg text-kalen-agent border border-kalen-agent-border"
                          : "bg-kalen-human-bg text-kalen-human border border-kalen-human-border"
                      }`}
                    >
                      {kind === "agent" ? <Bot size={14} /> : <AtSign size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-kalen-text truncate">{memberId}</span>
                        <IdentityBadge kind={kind} size="sm" />
                      </div>
                    </div>
                    <PresenceBadge status="online" size="sm" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Room info */}
          <div className="p-4 border-t border-kalen-border">
            <h3 className="text-sm font-semibold text-kalen-text mb-3">Room Info</h3>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-kalen-text-muted">Type</dt>
                <dd className="text-kalen-text-secondary capitalize">{room?.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-kalen-text-muted">Created</dt>
                <dd className="text-kalen-text-secondary">
                  {room?.createdAt ? new Date(room.createdAt).toLocaleDateString() : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-kalen-text-muted">Members</dt>
                <dd className="text-kalen-text-secondary">{room?.members.length || 0}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
