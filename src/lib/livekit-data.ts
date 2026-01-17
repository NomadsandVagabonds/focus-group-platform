'use client';

import {
    Room,
    DataPacket_Kind,
    RoomEvent,
    RemoteParticipant,
    LocalParticipant,
} from 'livekit-client';

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

// Data channel topics
const PERCEPTION_UPDATE = 'perception:update';
const PERCEPTION_AGGREGATE = 'perception:aggregate';

// Text encoder/decoder for data messages
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Current room reference
let currentRoom: Room | null = null;

// Aggregate calculation helper (runs on moderator side)
class PerceptionAggregator {
    private participantValues: Map<string, { value: number; timestamp: number }> = new Map();
    private aggregateCallback: ((data: AggregateData) => void) | null = null;
    private aggregateInterval: NodeJS.Timeout | null = null;

    start(callback: (data: AggregateData) => void) {
        this.aggregateCallback = callback;
        // Calculate and broadcast aggregates every 250ms
        this.aggregateInterval = setInterval(() => this.calculateAndBroadcast(), 250);
    }

    stop() {
        if (this.aggregateInterval) {
            clearInterval(this.aggregateInterval);
            this.aggregateInterval = null;
        }
        this.aggregateCallback = null;
        this.participantValues.clear();
    }

    updateValue(userId: string, value: number, timestamp: number) {
        this.participantValues.set(userId, { value, timestamp });
        // Remove stale values (older than 5 seconds)
        const now = Date.now();
        this.participantValues.forEach((v, k) => {
            if (now - v.timestamp > 5000) {
                this.participantValues.delete(k);
            }
        });
    }

    removeParticipant(userId: string) {
        this.participantValues.delete(userId);
    }

    private calculateAndBroadcast() {
        if (!this.aggregateCallback || this.participantValues.size === 0) return;

        const values = Array.from(this.participantValues.values()).map(v => v.value);
        const participants: Record<string, number> = {};
        this.participantValues.forEach((v, k) => {
            participants[k] = v.value;
        });

        // Calculate statistics
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const sorted = [...values].sort((a, b) => a - b);
        const median = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];
        const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        const aggregate: AggregateData = {
            timestamp: Date.now(),
            mean,
            median,
            stdDev,
            participants,
        };

        this.aggregateCallback(aggregate);
    }
}

const aggregator = new PerceptionAggregator();

// Set the current LiveKit room
export function setRoom(room: Room) {
    currentRoom = room;
}

// Get current room
export function getRoom(): Room | null {
    return currentRoom;
}

// Send perception data (from participant)
export function sendPerceptionData(data: PerceptionDataPoint): void {
    if (!currentRoom || !currentRoom.localParticipant) {
        console.warn('No room connected, cannot send perception data');
        return;
    }

    const message = JSON.stringify({
        topic: PERCEPTION_UPDATE,
        data,
    });

    // Send to all participants (moderator will receive)
    currentRoom.localParticipant.publishData(
        encoder.encode(message),
        { reliable: true }
    );
}

// Subscribe to perception updates (moderator uses this)
export function subscribeToPerceptionUpdates(
    room: Room,
    onUpdate: (data: PerceptionDataPoint) => void,
    onAggregate: (data: AggregateData) => void,
    isModerator: boolean = false
): () => void {
    // Start aggregator if moderator
    if (isModerator) {
        aggregator.start(onAggregate);
    }

    // Handle incoming data messages
    const handleDataReceived = (
        payload: Uint8Array,
        participant?: RemoteParticipant,
    ) => {
        try {
            const message = JSON.parse(decoder.decode(payload));

            if (message.topic === PERCEPTION_UPDATE) {
                const perceptionData = message.data as PerceptionDataPoint;
                onUpdate(perceptionData);

                // If moderator, update aggregator
                if (isModerator) {
                    aggregator.updateValue(
                        perceptionData.userId,
                        perceptionData.value,
                        perceptionData.timestamp
                    );
                }
            }
        } catch (e) {
            console.error('Error parsing data message:', e);
        }
    };

    // Handle participant disconnection
    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
        if (isModerator) {
            aggregator.removeParticipant(participant.identity);
        }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);

    // Return cleanup function
    return () => {
        room.off(RoomEvent.DataReceived, handleDataReceived);
        room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
        if (isModerator) {
            aggregator.stop();
        }
    };
}

// Broadcast aggregate data (from moderator to all participants)
export function broadcastAggregate(data: AggregateData): void {
    if (!currentRoom || !currentRoom.localParticipant) return;

    const message = JSON.stringify({
        topic: PERCEPTION_AGGREGATE,
        data,
    });

    currentRoom.localParticipant.publishData(
        encoder.encode(message),
        { reliable: false } // Aggregates can be lossy for lower latency
    );
}

// Subscribe to aggregates (participant uses this to see overall sentiment)
export function subscribeToAggregates(
    room: Room,
    callback: (data: AggregateData) => void
): () => void {
    const handleDataReceived = (payload: Uint8Array) => {
        try {
            const message = JSON.parse(decoder.decode(payload));
            if (message.topic === PERCEPTION_AGGREGATE) {
                callback(message.data as AggregateData);
            }
        } catch (e) {
            console.error('Error parsing aggregate message:', e);
        }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
        room.off(RoomEvent.DataReceived, handleDataReceived);
    };
}

// Legacy compatibility - these mirror the old Socket.io interface
export function connectSocket(sessionId: string, userId: string): { on: Function; connected: boolean } {
    // This is now a no-op since we use the LiveKit room directly
    console.log('Socket.io deprecated - using LiveKit Data Channels');
    return {
        on: () => { },
        connected: currentRoom?.state === 'connected'
    };
}

export function disconnectSocket(): void {
    // No-op - room disconnection handled by VideoGrid
}
