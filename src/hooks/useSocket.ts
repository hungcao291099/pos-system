"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket() {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const socket = io({
            path: "/api/socketio",
            addTrailingSlash: false,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            setConnected(true);
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected");
            setConnected(false);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const on = useCallback((event: string, handler: (...args: any[]) => void) => {
        socketRef.current?.on(event, handler);
        return () => {
            socketRef.current?.off(event, handler);
        };
    }, []);

    return { socket: socketRef.current, connected, on };
}
