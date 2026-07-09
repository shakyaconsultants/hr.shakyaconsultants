import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Message } from '@/features/communication/api/communication.api';

const SOCKET_ENABLED = import.meta.env.VITE_SOCKET_ENABLED === 'true';
const SOCKET_PATH = import.meta.env.VITE_SOCKET_PATH ?? '/socket.io';

export const COMMUNICATION_SOCKET_EVENTS = {
  MESSAGE_NEW: 'communication:message:new',
  JOIN_CONVERSATION: 'communication:join',
  LEAVE_CONVERSATION: 'communication:leave',
} as const;

type SocketClient = {
  connected: boolean;
  emit: (event: string, payload?: unknown) => void;
  on: (event: string, handler: (payload: unknown) => void) => void;
  off: (event: string, handler: (payload: unknown) => void) => void;
  disconnect: () => void;
};

let socketModulePromise: Promise<typeof import('socket.io-client')> | null = null;

function loadSocketModule() {
  if (!socketModulePromise) {
    socketModulePromise = import('socket.io-client');
  }
  return socketModulePromise;
}

function resolveSocketUrl(): string | null {
  const explicit = import.meta.env.VITE_SOCKET_URL?.trim();
  if (explicit) return explicit;

  const apiBase = import.meta.env.VITE_API_BASE_URL?.trim();
  if (apiBase) return apiBase;

  if (import.meta.env.DEV && import.meta.env.VITE_API_PROXY_TARGET) {
    return import.meta.env.VITE_API_PROXY_TARGET;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return null;
}

/**
 * Subscribe to real-time message events for the active conversation.
 * Falls back to polling when sockets are disabled or unavailable.
 */
export function useCommunicationSocket(conversationId?: string) {
  const queryClient = useQueryClient();
  const socketRef = useRef<SocketClient | null>(null);
  const joinedConversationRef = useRef<string | null>(null);

  useEffect(() => {
    if (!SOCKET_ENABLED || !conversationId) return;

    let cancelled = false;

    void (async () => {
      const socketUrl = resolveSocketUrl();
      if (!socketUrl) return;

      const { io } = await loadSocketModule();
      if (cancelled) return;

      const socket = io(socketUrl, {
        path: SOCKET_PATH,
        transports: ['websocket', 'polling'],
        withCredentials: true,
        autoConnect: true,
      }) as SocketClient;

      socketRef.current = socket;

      const handleNewMessage = (payload: unknown) => {
        const data = payload as { conversationId?: string; message?: Message };
        if (!data.conversationId || !data.message) return;

        queryClient.setQueryData(
          ['communication', 'messages', data.conversationId, { pageSize: 100 }],
          (
            cache: { items: Message[]; total: number; page: number; pageSize: number } | undefined,
          ) => {
            const items = cache?.items ?? [];
            if (items.some((item) => item.id === data.message!.id)) {
              return cache;
            }
            return {
              items: [...items, data.message!],
              total: (cache?.total ?? items.length) + 1,
              page: cache?.page ?? 1,
              pageSize: cache?.pageSize ?? 100,
            };
          },
        );
      };

      socket.on('connect', () => {
        if (conversationId) {
          socket.emit(COMMUNICATION_SOCKET_EVENTS.JOIN_CONVERSATION, conversationId);
          joinedConversationRef.current = conversationId;
        }
      });

      socket.on(COMMUNICATION_SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);

      if (socket.connected && conversationId) {
        socket.emit(COMMUNICATION_SOCKET_EVENTS.JOIN_CONVERSATION, conversationId);
        joinedConversationRef.current = conversationId;
      }
    })();

    return () => {
      cancelled = true;
      const socket = socketRef.current;
      if (socket) {
        if (joinedConversationRef.current) {
          socket.emit(
            COMMUNICATION_SOCKET_EVENTS.LEAVE_CONVERSATION,
            joinedConversationRef.current,
          );
        }
        socket.disconnect();
        socketRef.current = null;
        joinedConversationRef.current = null;
      }
    };
  }, [conversationId, queryClient]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !SOCKET_ENABLED || !conversationId) return;

    if (joinedConversationRef.current && joinedConversationRef.current !== conversationId) {
      socket.emit(COMMUNICATION_SOCKET_EVENTS.LEAVE_CONVERSATION, joinedConversationRef.current);
    }

    if (socket.connected) {
      socket.emit(COMMUNICATION_SOCKET_EVENTS.JOIN_CONVERSATION, conversationId);
      joinedConversationRef.current = conversationId;
    }
  }, [conversationId]);
}
