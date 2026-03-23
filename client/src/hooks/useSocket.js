import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useSocket(date, onBoardUpdate, onRefresh) {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io('/', {
      query: { date: date || '' },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('board:updated', (board) => {
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

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { emit };
}
