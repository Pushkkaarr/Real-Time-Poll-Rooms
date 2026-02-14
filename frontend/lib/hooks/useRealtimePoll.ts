import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Poll } from '../types/poll';

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:5000';

export const useRealtimePoll = (pollId: string | null) => {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  useEffect(() => {
    if (!pollId) return;

    const newSocket = io(WEBSOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join-poll', pollId);
    });

    newSocket.on('poll-state', (data: Poll) => {
      setPoll(data);
    });

    newSocket.on('poll-updated', (data: Poll) => {
      setPoll(data);
    });

    newSocket.on('poll-deleted', () => {
      setIsDeleted(true);
      setPoll(null);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      // Silently handle WebSocket errors
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('leave-poll', pollId);
        newSocket.disconnect();
      }
    };
  }, [pollId]);

  const broadcastVote = (pollData: Poll) => {
    if (socket && isConnected) {
      socket.emit('vote-cast', { pollId, poll: pollData });
    }
  };

  return {
    poll,
    socket,
    isDeleted,
    isConnected,
    broadcastVote,
  };
};
