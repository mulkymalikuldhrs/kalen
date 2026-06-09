/**
 * Message Input Component
 * Input area with markdown support, typing indicator, and send button.
 */

"use client";

import React, { useCallback, useRef, useState } from "react";
import { Send, Paperclip, Smile, Code, Bold, Italic } from "lucide-react";
import { clsx } from "clsx";

interface MessageInputProps {
  onSend: (content: string, contentType: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  onTypingStart,
  onTypingStop,
  disabled = false,
  placeholder = "Type a message... (markdown supported)",
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState<"markdown" | "code">("markdown");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed, contentType);
    setContent("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Notify typing stopped
    onTypingStop?.();
  }, [content, contentType, disabled, onSend, onTypingStop]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;

    // Typing indicators
    if (value.length > 0) {
      onTypingStart?.();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        onTypingStop?.();
      }, 3000);
    } else {
      onTypingStop?.();
    }
  };

  const insertMarkdown = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);

    const newContent =
      content.substring(0, start) + prefix + selected + suffix + content.substring(end);
    setContent(newContent);
    textarea.focus();

    // Set cursor position after inserted prefix
    setTimeout(() => {
      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = end + prefix.length;
    }, 0);
  };

  return (
    <div className="border-t border-kalen-border bg-kalen-surface">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 pt-2">
        <button
          onClick={() => insertMarkdown("**", "**")}
          className="p-1.5 rounded hover:bg-kalen-surface-2 text-kalen-text-muted hover:text-kalen-text transition-colors"
          aria-label="Bold"
        >
          <Bold size={14} />
        </button>
        <button
          onClick={() => insertMarkdown("_", "_")}
          className="p-1.5 rounded hover:bg-kalen-surface-2 text-kalen-text-muted hover:text-kalen-text transition-colors"
          aria-label="Italic"
        >
          <Italic size={14} />
        </button>
        <button
          onClick={() => insertMarkdown("`", "`")}
          className="p-1.5 rounded hover:bg-kalen-surface-2 text-kalen-text-muted hover:text-kalen-text transition-colors"
          aria-label="Code"
        >
          <Code size={14} />
        </button>
        <button
          onClick={() => setContentType(contentType === "markdown" ? "code" : "markdown")}
          className={clsx(
            "px-2 py-1 rounded text-xs font-medium transition-colors",
            contentType === "code"
              ? "bg-kalen-accent/10 text-kalen-accent"
              : "text-kalen-text-muted hover:text-kalen-text"
          )}
        >
          {contentType === "code" ? "Code Mode" : "Markdown"}
        </button>
      </div>

      {/* Input area */}
      <div className="flex items-end gap-2 p-3">
        {/* Attachments button */}
        <button
          className="p-2 rounded-lg hover:bg-kalen-surface-2 text-kalen-text-muted hover:text-kalen-text transition-colors flex-shrink-0"
          aria-label="Attach file"
        >
          <Paperclip size={18} />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className={clsx(
            "flex-1 bg-kalen-bg border border-kalen-border rounded-xl px-4 py-2.5 text-sm text-kalen-text placeholder:text-kalen-text-muted resize-none focus:outline-none focus:border-kalen-primary focus:ring-1 focus:ring-kalen-primary/20 transition-colors",
            contentType === "code" && "font-mono text-xs",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />

        {/* Emoji button */}
        <button
          className="p-2 rounded-lg hover:bg-kalen-surface-2 text-kalen-text-muted hover:text-kalen-text transition-colors flex-shrink-0"
          aria-label="Emoji"
        >
          <Smile size={18} />
        </button>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          className={clsx(
            "p-2.5 rounded-xl transition-colors flex-shrink-0",
            content.trim() && !disabled
              ? "bg-kalen-primary text-white hover:bg-kalen-primary-hover glow-primary"
              : "bg-kalen-surface-3 text-kalen-text-muted cursor-not-allowed"
          )}
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
