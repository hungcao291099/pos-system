import { Server as SocketIOServer } from "socket.io";

declare global {
    // eslint-disable-next-line no-var
    var __io: SocketIOServer | undefined;
}

export function getIO(): SocketIOServer | null {
    return globalThis.__io || null;
}

/**
 * Emit an event to all connected clients
 */
export function emitEvent(event: string, data: any) {
    const io = getIO();
    if (io) {
        io.emit(event, data);
    }
}
