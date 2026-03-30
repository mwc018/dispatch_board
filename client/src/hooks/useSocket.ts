import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { BoardState } from '../types';

export function useSocket(
  date: string,
  onBoardUpdate?: (board: BoardState) => void,
  onRefresh?: () => void
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io('/', {
      query: { date: date || '' },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('board:updated', (board: BoardState) => {
      onBoardUpdate?.(board);
    });

    socket.on('board:refresh', () => {
      onRefresh?.();
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [date]);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { emit };
}
