/**
 * Chat Page
 * Main chat interface with room list and message area.
 */

"use client";

import React from "react";
import { useRooms, useRoomMessages } from "@/hooks/use-rooms";
import { RoomList } from "@/components/chat/room-list";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { TypingIndicatorDisplay } from "@/components/chat/typing-indicator";
import { Hash, Users, Bot } from "lucide-react";

export default function ChatPage() {
  const { rooms, isLoading: roomsLoading } = useRooms();
  // Default to first room
  const activeRoomId = rooms.length > 0 ? rooms[0].roomId : null;
  const { messages, isLoading: messagesLoading } = useRoomMessages(activeRoomId);

  return (
    <div className="flex h-full">
      {/* Room list sidebar */}
      <div className="w-72 border-r border-kalen-border bg-kalen-surface hidden md:block">
        <RoomList rooms={rooms} activeRoomId={activeRoomId} isLoading={roomsLoading} />
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeRoomId ? (
          <>
            {/* Room header */}
            <div className="h-14 flex items-center gap-3 px-4 border-b border-kalen-border bg-kalen-surface">
              <Hash size={18} className="text-kalen-text-muted" />
              <span className="text-sm font-semibold text-kalen-text">
                {rooms.find((r) => r.roomId === activeRoomId)?.name || "Chat"}
              </span>
              <div className="flex items-center gap-1 text-xs text-kalen-text-muted ml-2">
                <Users size={12} />
                <span>
                  {rooms.find((r) => r.roomId === activeRoomId)?.members.length || 0}
                </span>
              </div>
              {rooms
                .find((r) => r.roomId === activeRoomId)
                ?.memberKinds.includes("agent") && (
                  <div className="flex items-center gap-1 ml-2">
                    <Bot size={12} className="text-kalen-agent" />
                    <span className="text-xs text-kalen-agent">AI members</span>
                  </div>
                )}
            </div>

            {/* Messages */}
            <MessageList messages={messages} isLoading={messagesLoading} />

            {/* Typing indicator */}
            <TypingIndicatorDisplay typers={[]} />

            {/* Input */}
            <MessageInput
              onSend={(content, contentType) => {
                // TODO: Send via Socket.IO or API
                console.log("Send message:", { content, contentType, roomId: activeRoomId });
              }}
              onTypingStart={() => {
                // TODO: Emit typing:start
              }}
              onTypingStop={() => {
                // TODO: Emit typing:stop
              }}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-kalen-surface-2 border border-kalen-border flex items-center justify-center mx-auto mb-4">
                <Hash size={36} className="text-kalen-text-muted" />
              </div>
              <h3 className="text-xl font-semibold text-kalen-text mb-2">
                No conversation selected
              </h3>
              <p className="text-sm text-kalen-text-muted max-w-sm">
                Select a room from the sidebar or create a new one to start chatting.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right panel — agent info (collapsible) */}
      {/* TODO: Implement agent info panel */}
    </div>
  );
}
