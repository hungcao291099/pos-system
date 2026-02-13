import { NextRequest, NextResponse } from "next/server";
import { verifyToken, TokenPayload } from "./auth/jwt";

export async function getAuthUser(request: NextRequest): Promise<TokenPayload | null> {
    const accessToken = request.cookies.get("access_token")?.value;

    if (!accessToken) {
        return null;
    }

    return verifyToken(accessToken);
}

export function unauthorizedResponse(message = "Unauthorized") {
    return NextResponse.json(
        { success: false, error: message },
        { status: 401 }
    );
}

export function forbiddenResponse(message = "Forbidden") {
    return NextResponse.json(
        { success: false, error: message },
        { status: 403 }
    );
}

export function badRequestResponse(message: string) {
    return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
    );
}

export function notFoundResponse(message = "Not Found") {
    return NextResponse.json(
        { success: false, error: message },
        { status: 404 }
    );
}

export function successResponse<T>(data: T, message?: string) {
    return NextResponse.json({
        success: true,
        data,
        message,
    });
}

export function errorResponse(message: string, status = 500) {
    return NextResponse.json(
        { success: false, error: message },
        { status }
    );
}

export function hasPermission(
    user: TokenPayload,
    resource: string,
    action: string
): boolean {
    // Admin bypasses all permission checks
    if (user.isAdmin) {
        return true;
    }

    const requiredPermission = `${resource}:${action}`;
    return user.permissions.includes(requiredPermission);
}

export function requirePermission(
    user: TokenPayload | null,
    resource: string,
    action: string
): NextResponse | null {
    if (!user) {
        return unauthorizedResponse();
    }

    if (!hasPermission(user, resource, action)) {
        return forbiddenResponse("You don't have permission to perform this action");
    }

    return null;
}
