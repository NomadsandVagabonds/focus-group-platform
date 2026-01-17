'use client';

import {
    Room,
    RoomEvent,
    RemoteParticipant,
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
        console.log('[Aggregator] Starting aggregator');
        this.aggregateCallback = callback;
        this.aggregateInterval = setInterval(() => this.calculateAndBroadcast(), 250);
    }

    stop() {
        console.log('[Aggregator] Stopping aggregator');
        if (this.aggregateInterval) {
            clearInterval(this.aggregateInterval);
            this.aggregateInterval = null;
        }
        this.aggregateCallback = null;
        this.participantValues.clear();
    }

    updateValue(userId: string, value: number, timestamp: number) {
        console.log(`[Aggregator] Update from ${userId}: ${value}`);
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

        console.log('[Aggregator] Broadcasting aggregate:', participants);
        this.aggregateCallback(aggregate);
    }
}

const aggregator = new PerceptionAggregator();

// Set the current LiveKit room
export function setRoom(room: Room) {
    console.log('[LiveKit-Data] setRoom called, room state:', room.state);
    currentRoom = room;
}

// Get current room
export function getRoom(): Room | null {
    return currentRoom;
}

// Send perception data (from participant)
export function sendPerceptionData(data: PerceptionDataPoint): void {
    console.log('[LiveKit-Data] sendPerceptionData called, room exists:', !!currentRoom);

    if (!currentRoom) {
        console.warn('[LiveKit-Data] No room set!');
        return;
    }

    if (!currentRoom.localParticipant) {
        console.warn('[LiveKit-Data] No local participant!');
        return;
    }

    const message = JSON.stringify({
        topic: PERCEPTION_UPDATE,
        data,
    });

    console.log('[LiveKit-Data] Publishing data:', data.userId, data.value);

    // Send to all participants (moderator will receive)
    currentRoom.localParticipant.publishData(
        encoder.encode(message),
        { reliable: true }
    ).then(() => {
        console.log('[LiveKit-Data] Data published successfully');
    }).catch((err) => {
        console.error('[LiveKit-Data] Failed to publish data:', err);
    });
}

// Subscribe to perception updates (moderator uses this)
export function subscribeToPerceptionUpdates(
    room: Room,
    onUpdate: (data: PerceptionDataPoint) => void,
    onAggregate: (data: AggregateData) => void,
    isModerator: boolean = false
): () => void {
    console.log('[LiveKit-Data] subscribeToPerceptionUpdates, isModerator:', isModerator);

    // Start aggregator if moderator
    if (isModerator) {
        aggregator.start(onAggregate);
    }

    // Handle incoming data messages
    const handleDataReceived = (
        payload: Uint8Array,
        participant?: RemoteParticipant,
    ) => {
        console.log('[LiveKit-Data] DATA RECEIVED from:', participant?.identity);

        try {
            const message = JSON.parse(decoder.decode(payload));
            console.log('[LiveKit-Data] Parsed message topic:', message.topic);

            if (message.topic === PERCEPTION_UPDATE) {
                const perceptionData = message.data as PerceptionDataPoint;
                console.log('[LiveKit-Data] Perception update:', perceptionData.userId, perceptionData.value);
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
            console.error('[LiveKit-Data] Error parsing data message:', e);
        }
    };

    // Handle participant disconnection
    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
        console.log('[LiveKit-Data] Participant disconnected:', participant.identity);
        if (isModerator) {
            aggregator.removeParticipant(participant.identity);
        }
    };

    console.log('[LiveKit-Data] Subscribing to DataReceived event');
    room.on(RoomEvent.DataReceived, handleDataReceived);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);

    // Return cleanup function
    return () => {
        console.log('[LiveKit-Data] Unsubscribing from events');
        room.off(RoomEvent.DataReceived, handleDataReceived);
        room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
        if (isModerator) {
            aggregator.stop();
        }
    };
}

// Legacy compatibility
export function connectSocket(sessionId: string, userId: string): { on: Function; connected: boolean } {
    console.log('[LiveKit-Data] connectSocket called (deprecated)');
    return {
        on: () => { },
        connected: currentRoom?.state === 'connected'
    };
}

export function disconnectSocket(): void {
    // No-op
}
