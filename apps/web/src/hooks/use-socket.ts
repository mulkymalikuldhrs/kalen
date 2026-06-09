/**
 * useSocket hook
 * Provides Socket.IO client access and connection state.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { socketClient } from "@/lib/socket";
import type { Message, PresenceUpdate, TypingIndicator } from "@/lib/types";
import { useAuth } from "./use-auth";

export function useSocket() {
  const { accessToken, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [presence, setPresence] = useState<Map<string, PresenceUpdate>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingIndicator>>(new Map());
  const listenersRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      socketClient.connect(accessToken);
    }
  }, [isAuthenticated, accessToken]);

  useEffect(() => {
    if (listenersRef.current) return;

    // Listen for new messages
    socketClient.on("message:new", (message: unknown) => {
      setMessages((prev) => [...prev, message as Message]);
    });

    // Listen for presence updates
    socketClient.on("presence:update", (update: unknown) => {
      const presenceUpdate = update as PresenceUpdate;
      setPresence((prev) => {
        const next = new Map(prev);
        next.set(presenceUpdate.entityId, presenceUpdate);
        return next;
      });
    });

    // Listen for typing indicators
    socketClient.on("typing:start", (indicator: unknown) => {
      const typingIndicator = indicator as TypingIndicator;
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.set(typingIndicator.entityId, typingIndicator);
        return next;
      });
    });

    socketClient.on("typing:stop", (data: unknown) => {
      const stopData = data as { entityId: string; roomId: string };
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(stopData.entityId);
        return next;
      });
    });

    listenersRef.current = true;

    return () => {
      socketClient.disconnect();
      listenersRef.current = false;
    };
  }, []);

  const sendMessage = useCallback(
    (roomId: string, content: string) => {
      socketClient.sendMessage(roomId, content);
    },
    []
  );

  const joinRoom = useCallback((roomId: string) => {
    socketClient.joinRoom(roomId);
    setMessages([]); // Clear local messages when switching rooms
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    socketClient.leaveRoom(roomId);
  }, []);

  const startTyping = useCallback((roomId: string) => {
    socketClient.startTyping(roomId);
  }, []);

  const stopTyping = useCallback((roomId: string) => {
    socketClient.stopTyping(roomId);
  }, []);

  return {
    isConnected,
    messages,
    presence,
    typingUsers,
    sendMessage,
    joinRoom,
    leaveRoom,
    startTyping,
    stopTyping,
  };
}
