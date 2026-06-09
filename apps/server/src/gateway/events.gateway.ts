/**
 * KALEN Server — Events Gateway
 * Socket.IO WebSocket gateway for real-time events.
 *
 * Supports:
 * - Authentication via JWT
 * - Room-based event broadcasting
 * - Typing indicators
 * - Presence updates
 * - Message delivery
 *
 * Per API.md, WebSocket connections are at: ws://localhost:4000/events
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@kalen/identity';

interface AuthenticatedSocket extends Socket {
  identity?: {
    kind: 'human' | 'agent';
    sub: string;
    suffix?: string;
    scopes?: string[];
    tokenType: string;
  };
}

@WebSocketGateway({
  namespace: '/events',
  cors: {
    origin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  /** Map of socket ID → identity */
  private socketIdentities = new Map<string, AuthenticatedSocket['identity']>();

  /** Map of userId → Set of socket IDs (for multi-device support) */
  private userSockets = new Map<string, Set<string>>();

  constructor(private configService: ConfigService) {}

  /**
   * Handle new WebSocket connection.
   * Client must send an 'auth' message to authenticate.
   */
  async handleConnection(client: AuthenticatedSocket) {
    // Don't authenticate on connect — wait for 'auth' message
    // This matches the API.md spec
    console.log(`WebSocket client connected: ${client.id}`);
  }

  /**
   * Handle WebSocket disconnection.
   * Clean up presence and room subscriptions.
   */
  async handleDisconnect(client: AuthenticatedSocket) {
    const identity = this.socketIdentities.get(client.id);

    if (identity) {
      // Remove from user sockets map
      const sockets = this.userSockets.get(identity.sub);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(identity.sub);

          // Broadcast presence:offline to all rooms the user was in
          const rooms = Array.from(client.rooms);
          for (const room of rooms) {
            if (room !== client.id) {
              client.to(room).emit('presence:update', {
                userSuffix: identity.suffix,
                status: 'offline',
              });
            }
          }
        }
      }

      this.socketIdentities.delete(client.id);
    }

    console.log(`WebSocket client disconnected: ${client.id}`);
  }

  /**
   * Authenticate a WebSocket connection with JWT.
   * Per API.md: client sends { token: "jwt" }
   */
  @SubscribeMessage('auth')
  async handleAuth(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { token: string },
  ) {
    const jwtSecret = this.configService.get<string>('jwt.secret')!;
    const payload = await verifyToken(data.token, jwtSecret);

    if (!payload || payload.tokenType !== 'access') {
      client.emit('auth:failure', { error: 'Invalid or expired token' });
      return;
    }

    // Store identity on socket
    client.identity = payload;
    this.socketIdentities.set(client.id, payload);

    // Track user sockets
    if (!this.userSockets.has(payload.sub)) {
      this.userSockets.set(payload.sub, new Set());
    }
    this.userSockets.get(payload.sub)!.add(client.id);

    client.emit('auth:success', {
      identity: {
        id: payload.sub,
        kind: payload.kind,
        suffix: payload.suffix,
      },
    });

    console.log(`WebSocket authenticated: ${client.id} → ${payload.sub} (${payload.kind})`);
  }

  /**
   * Subscribe to a room's events.
   * Per API.md: client sends { conversationId: "uuid" }
   */
  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.identity) {
      client.emit('error', { code: 'UNAUTHORIZED', message: 'Not authenticated' });
      return;
    }

    // TODO: Verify the user is a member of the room
    client.join(data.conversationId);
    console.log(`Socket ${client.id} subscribed to room ${data.conversationId}`);
  }

  /**
   * Unsubscribe from a room's events.
   */
  @SubscribeMessage('unsubscribe')
  async handleUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(data.conversationId);
  }

  /**
   * Typing indicator.
   * Per API.md: client sends { conversationId: "uuid" }
   */
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.identity) return;

    client.to(data.conversationId).emit('typing:start', {
      conversationId: data.conversationId,
      userSuffix: client.identity.suffix,
    });

    // Auto-stop after 3 seconds (as per API.md TYPING_INDICATOR_TTL)
    setTimeout(() => {
      if (this.socketIdentities.has(client.id)) {
        client.to(data.conversationId).emit('typing:stop', {
          conversationId: data.conversationId,
          userSuffix: client.identity?.suffix ?? 'unknown',
        });
      }
    }, 3000);
  }

  /**
   * Presence update.
   * Per API.md: client sends { status: "online" | "away" | "dnd" }
   */
  @SubscribeMessage('presence')
  async handlePresence(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { status: 'online' | 'away' | 'dnd' },
  ) {
    if (!client.identity) return;

    // Broadcast to all rooms the client is in
    const rooms = Array.from(client.rooms);
    for (const room of rooms) {
      if (room !== client.id) {
        client.to(room).emit('presence:update', {
          userSuffix: client.identity.suffix,
          status: data.status,
        });
      }
    }
  }

  // ─── Server-side broadcast methods ────────────────────────

  /**
   * Broadcast a new message to a room.
   * Called by MessagingService after a message is persisted.
   */
  broadcastMessageCreated(roomId: string, message: any) {
    this.server.to(roomId).emit('message:created', { message });
  }

  /**
   * Broadcast a message update to a room.
   */
  broadcastMessageUpdated(roomId: string, message: any) {
    this.server.to(roomId).emit('message:updated', { message });
  }

  /**
   * Broadcast a message deletion to a room.
   */
  broadcastMessageDeleted(roomId: string, messageId: string) {
    this.server.to(roomId).emit('message:deleted', { messageId });
  }

  /**
   * Broadcast an agent action event.
   */
  broadcastAgentAction(agentSuffix: string, action: string, target: string) {
    this.server.emit('agent:action', {
      agentSuffix,
      action,
      target,
      timestamp: new Date().toISOString(),
    });
  }
}
