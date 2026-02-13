import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/db/data-source";
import { Menu } from "@/lib/db/entities";
import {
    getAuthUser,
    requirePermission,
    successResponse,
    errorResponse,
    badRequestResponse,
} from "@/lib/api-utils";

export async function PUT(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "menu", "update");
        if (permissionCheck) return permissionCheck;

        const body = await request.json();
        const { items } = body; // Array of { id: number, sortOrder: number }

        if (!Array.isArray(items)) {
            return badRequestResponse("Items must be an array");
        }

        const db = await initializeDatabase();
        const menuRepo = db.getRepository(Menu);

        await db.transaction(async (manager) => {
            const transactionalRepo = manager.getRepository(Menu);
            for (const item of items) {
                await transactionalRepo.update(item.id, {
                    sortOrder: item.sortOrder,
                    modifiedBy: authUser?.username || "system",
                });
            }
        });

        return successResponse(null, "Menus reordered successfully");
    } catch (error) {
        console.error("Reorder menu error:", error);
        return errorResponse("An error occurred while reordering menus");
    }
}
