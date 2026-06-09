/**
 * useRooms hook
 * Fetches and manages room state using SWR.
 */

"use client";

import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import type { Room, Message, PaginatedResponse } from "@/lib/types";

export function useRooms() {
  const { data, error, isLoading, mutate } = useSWR(
    "rooms",
    () => apiClient.getRooms(),
    {
      revalidateOnFocus: false,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  const rooms = data?.data ?? [];

  return {
    rooms,
    isLoading,
    isError: !data?.success || !!error,
    error: error?.message || data?.error,
    mutate,
  };
}

export function useRoomMessages(roomId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    roomId ? `rooms/${roomId}/messages` : null,
    () => apiClient.getMessages(roomId!),
    {
      revalidateOnFocus: false,
    }
  );

  const messages = data?.data?.items ?? [];

  return {
    messages,
    totalMessages: data?.data?.total ?? 0,
    hasMore: data?.data?.hasMore ?? false,
    isLoading,
    isError: !data?.success || !!error,
    error: error?.message || data?.error,
    mutate,
  };
}

export function useAgents() {
  const { data, error, isLoading, mutate } = useSWR(
    "agents",
    () => apiClient.getAgents(),
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
    }
  );

  const agents = data?.data ?? [];

  return {
    agents,
    isLoading,
    isError: !data?.success || !!error,
    error: error?.message || data?.error,
    mutate,
  };
}

export function useMCPServers() {
  const { data, error, isLoading, mutate } = useSWR(
    "mcp-servers",
    () => apiClient.getMCPServers(),
    {
      revalidateOnFocus: false,
      refreshInterval: 30000,
    }
  );

  const servers = data?.data ?? [];

  return {
    servers,
    isLoading,
    isError: !data?.success || !!error,
    error: error?.message || data?.error,
    mutate,
  };
}
