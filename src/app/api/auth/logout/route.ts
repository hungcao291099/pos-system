import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { successResponse } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();

    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");

    return successResponse({ message: "Logged out successfully" });
}
