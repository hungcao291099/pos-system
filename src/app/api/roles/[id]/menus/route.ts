import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/db/data-source";
import { RoleMenu } from "@/lib/db/entities";
import {
    getAuthUser,
    requirePermission,
    successResponse,
    badRequestResponse,
    errorResponse,
} from "@/lib/api-utils";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser(request);
        const permissionCheck = requirePermission(user, "role", "read");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const roleId = parseInt(id);

        const db = await initializeDatabase();
        const roleMenuRepo = db.getRepository(RoleMenu);

        const roleMenus = await roleMenuRepo.find({
            where: { roleId },
            relations: ["menu"],
        });

        return successResponse(
            roleMenus.map((rm) => ({
                id: rm.id,
                menuId: rm.menu.id,
                menuName: rm.menu.name,
                menuPath: rm.menu.path,
                menuIcon: rm.menu.icon,
            }))
        );
    } catch (error) {
        console.error("Get role menus error:", error);
        return errorResponse("An error occurred while fetching role menus");
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "role", "update");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const roleId = parseInt(id);
        const body = await request.json();
        const { menuIds } = body;

        if (!menuIds || !Array.isArray(menuIds)) {
            return badRequestResponse("Menu IDs are required");
        }

        const db = await initializeDatabase();
        const roleMenuRepo = db.getRepository(RoleMenu);

        // Remove existing menus
        await roleMenuRepo.delete({ roleId });

        // Add new menus
        if (menuIds.length > 0) {
            const roleMenus = menuIds.map((menuId: number) => ({
                roleId,
                menuId,
                createdBy: authUser?.username || "system",
            }));
            await roleMenuRepo.save(roleMenus);
        }

        return successResponse(null, "Role menus updated successfully");
    } catch (error) {
        console.error("Update role menus error:", error);
        return errorResponse("An error occurred while updating role menus");
    }
}
