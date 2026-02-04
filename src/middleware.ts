import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "pos-system-secret-key-change-in-production"
);

// Public routes that don't require authentication
const publicRoutes = ["/login", "/api/auth/login", "/api/auth/refresh"];

// Routes that require specific permissions (non-admin users)
const protectedRoutes: { [key: string]: { resource: string; action: string } } = {
    "/user": { resource: "user", action: "read" },
    "/role": { resource: "role", action: "read" },
    "/menu": { resource: "menu", action: "read" },
    "/permission": { resource: "permission", action: "read" },
};

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes
    if (publicRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Allow static files and Next.js internals
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // Get access token
    const accessToken = request.cookies.get("access_token")?.value;

    if (!accessToken) {
        // Check if it's an API route
        if (pathname.startsWith("/api")) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }
        // Redirect to login for page routes
        return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
        // Verify token
        const { payload } = await jwtVerify(accessToken, JWT_SECRET);
        const user = payload as unknown as {
            userId: number;
            username: string;
            roles: string[];
            permissions: string[];
            isAdmin: boolean;
        };

        // Admin bypasses all permission checks
        if (user.isAdmin) {
            return NextResponse.next();
        }

        // Check route permissions for non-admin users
        const routeConfig = Object.entries(protectedRoutes).find(([route]) =>
            pathname.startsWith(route)
        );

        if (routeConfig) {
            const [, config] = routeConfig;
            const requiredPermission = `${config.resource}:${config.action}`;

            if (!user.permissions.includes(requiredPermission)) {
                if (pathname.startsWith("/api")) {
                    return NextResponse.json(
                        { success: false, error: "Forbidden" },
                        { status: 403 }
                    );
                }
                return NextResponse.redirect(new URL("/home", request.url));
            }
        }

        return NextResponse.next();
    } catch {
        // Token verification failed
        if (pathname.startsWith("/api")) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }
        return NextResponse.redirect(new URL("/login", request.url));
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
