'use client';

import { io, Socket } from 'socket.io-client';

export interface PerceptionDataPoint {
    userId: string;
    sessionId: string;
    timestamp: number;
    value: number;
    mediaTimestamp?: number;
}

export interface AggregateData {
    timestamp: number;
    mean: number;
    median: number;
    stdDev: number;
    participants: Record<string, number>;
}

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
            transports: ['websocket'],
            autoConnect: false,
        });
    }
    return socket;
}

export function connectSocket(sessionId: string, userId: string): Socket {
    const s = getSocket();

    if (!s.connected) {
        s.auth = { sessionId, userId };
        s.connect();
    }

    return s;
}

export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

export function sendPerceptionData(data: PerceptionDataPoint): void {
    const s = getSocket();
    if (s.connected) {
        s.emit('perception:update', data);
    }
}

export function subscribeToAggregates(callback: (data: AggregateData) => void): () => void {
    const s = getSocket();
    s.on('perception:aggregate', callback);

    return () => {
        s.off('perception:aggregate', callback);
    };
}

export function subscribeToParticipantData(
    callback: (data: PerceptionDataPoint) => void
): () => void {
    const s = getSocket();
    s.on('perception:participant', callback);

    return () => {
        s.off('perception:participant', callback);
    };
}
