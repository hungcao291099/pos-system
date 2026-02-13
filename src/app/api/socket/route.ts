import { NextRequest, NextResponse } from "next/server";
import { getIO } from "@/lib/socketServer";

export async function GET(request: NextRequest) {
    try {
        const io = getIO();
        return NextResponse.json({
            success: true,
            message: io ? "Socket.IO server is running" : "Socket.IO server not initialized (start with npm run dev:socket)",
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: (error as Error).message,
        });
    }
}
