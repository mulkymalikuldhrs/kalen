/**
 * KALEN Socket.IO Client
 * Manages real-time WebSocket connections for messaging and presence.
 * TODO: Connect to actual Socket.IO server when backend is ready.
 */

import { io, Socket } from "socket.io-client";
import type { Message, PresenceUpdate, TypingIndicator } from "./types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3002";

type EventCallback = (...args: unknown[]) => void;

interface SocketEvents {
  "message:new": (message: Message) => void;
  "message:edited": (message: Message) => void;
  "message:deleted": (data: { messageId: string; roomId: string }) => void;
  "presence:update": (update: PresenceUpdate) => void;
  "typing:start": (indicator: TypingIndicator) => void;
  "typing:stop": (data: { entityId: string; roomId: string }) => void;
  "room:updated": (data: { roomId: string }) => void;
  "agent:status": (data: { agentId: string; status: string }) => void;
  "task:updated": (data: { taskId: string; status: string }) => void;
}

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  connect(accessToken: string): void {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on("connect", () => {
      console.log("[KALEN] WebSocket connected");
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[KALEN] WebSocket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("[KALEN] WebSocket connection error:", error);
      this.reconnectAttempts++;
    });

    // Forward all KALEN events to registered listeners
    const eventNames: Array<keyof SocketEvents> = [
      "message:new",
      "message:edited",
      "message:deleted",
      "presence:update",
      "typing:start",
      "typing:stop",
      "room:updated",
      "agent:status",
      "task:updated",
    ];

    eventNames.forEach((eventName) => {
      this.socket?.on(eventName, (...args: unknown[]) => {
        this.emitToListeners(eventName, args);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  // ─── Event subscription ──────────────────────────────────────

  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback);
  }

  off<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback as EventCallback);
    }
  }

  private emitToListeners(event: string, args: unknown[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`[KALEN] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // ─── Socket emissions ────────────────────────────────────────

  joinRoom(roomId: string): void {
    this.socket?.emit("room:join", { roomId });
  }

  leaveRoom(roomId: string): void {
    this.socket?.emit("room:leave", { roomId });
  }

  sendMessage(roomId: string, content: string, contentType = "markdown"): void {
    this.socket?.emit("message:send", { roomId, content, contentType });
  }

  startTyping(roomId: string): void {
    this.socket?.emit("typing:start", { roomId });
  }

  stopTyping(roomId: string): void {
    this.socket?.emit("typing:stop", { roomId });
  }

  updatePresence(status: string): void {
    this.socket?.emit("presence:update", { status });
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  get socketId(): string | undefined {
    return this.socket?.id;
  }
}

export const socketClient = new SocketClient();
