import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

export interface PerceptionDataPoint {
    userId: string;
    sessionId: string;
    timestamp: number;
    value: number;
    mediaTimestamp?: number;
}

interface SessionData {
    participants: Map<string, number>;
    history: PerceptionDataPoint[];
}

const sessions = new Map<string, SessionData>();

function getSession(sessionId: string): SessionData {
    if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
            participants: new Map(),
            history: [],
        });
    }
    return sessions.get(sessionId)!;
}

function calculateAggregates(participants: Map<string, number>) {
    const values = Array.from(participants.values());
    if (values.length === 0) {
        return { mean: 50, median: 50, stdDev: 0 };
    }

    // Mean
    const mean = values.reduce((a, b) => a + b, 0) / values.length;

    // Median
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

    // Standard Deviation
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    return { mean, median, stdDev };
}

export function initializeWebSocket(httpServer: HTTPServer): SocketIOServer {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST'],
        },
        transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket: Socket) => {
        const sessionId = socket.handshake.auth.sessionId as string;
        const userId = socket.handshake.auth.userId as string;

        console.log(`[WS] User ${userId} connected to session ${sessionId}`);

        // Join session room
        socket.join(sessionId);

        // Handle perception updates
        socket.on('perception:update', (data: PerceptionDataPoint) => {
            const session = getSession(sessionId);

            // Update participant's current value
            session.participants.set(data.userId, data.value);

            // Store in history (limited to last 1000 points per session)
            session.history.push(data);
            if (session.history.length > 10000) {
                session.history = session.history.slice(-5000);
            }

            // Broadcast individual update to moderators
            socket.to(sessionId).emit('perception:participant', data);

            // Calculate and broadcast aggregates
            const aggregates = calculateAggregates(session.participants);
            io.to(sessionId).emit('perception:aggregate', {
                timestamp: data.timestamp,
                ...aggregates,
                participants: Object.fromEntries(session.participants),
            });
        });

        // Handle session control events
        socket.on('session:start-recording', () => {
            io.to(sessionId).emit('session:recording-started');
            console.log(`[WS] Recording started for session ${sessionId}`);
        });

        socket.on('session:stop-recording', () => {
            io.to(sessionId).emit('session:recording-stopped');
            console.log(`[WS] Recording stopped for session ${sessionId}`);
        });

        socket.on('session:play-media', (mediaTimestamp: number) => {
            io.to(sessionId).emit('session:media-sync', mediaTimestamp);
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`[WS] User ${userId} disconnected from session ${sessionId}`);
            const session = getSession(sessionId);
            session.participants.delete(userId);
        });
    });

    return io;
}

// Export session data for API endpoints
export function getSessionHistory(sessionId: string): PerceptionDataPoint[] {
    return getSession(sessionId).history;
}

export function clearSession(sessionId: string): void {
    sessions.delete(sessionId);
}
