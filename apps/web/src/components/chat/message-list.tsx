/**
 * Message List Component
 * Scrollable message list with auto-scroll to bottom.
 */

"use client";

import React, { useEffect, useRef } from "react";
import { ArrowDown } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import type { Message } from "@/lib/types";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  currentUserId?: string;
}

export function MessageList({ messages, isLoading, currentUserId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = React.useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show scroll-to-bottom button when scrolled up
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-lg px-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-9 h-9 rounded-lg bg-kalen-surface-3 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-kalen-surface-3 rounded" />
                <div className="h-16 bg-kalen-surface-3 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-y-auto custom-scrollbar"
      >
        {/* Messages */}
        <div className="py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-kalen-surface-2 flex items-center justify-center mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-semibold text-kalen-text mb-2">
                No messages yet
              </h3>
              <p className="text-sm text-kalen-text-muted max-w-sm">
                Start the conversation! Type a message below to begin.
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const prevMessage = messages[index - 1];
              const isSameSender = prevMessage?.senderId === message.senderId;
              const isOwn = message.senderId === currentUserId;

              return (
                <MessageBubble
                  key={message.messageId}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={!isSameSender}
                  senderName={
                    isSameSender
                      ? undefined
                      : message.senderKind === "agent"
                      ? "Agent"
                      : "You"
                  }
                />
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 p-2 rounded-full bg-kalen-surface-2 border border-kalen-border text-kalen-text-secondary hover:text-kalen-text shadow-lg transition-all hover:bg-kalen-surface-3"
          aria-label="Scroll to bottom"
        >
          <ArrowDown size={18} />
        </button>
      )}
    </div>
  );
}
