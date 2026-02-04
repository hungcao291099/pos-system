import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/db/data-source";
import { Menu } from "@/lib/db/entities";
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
        const permissionCheck = requirePermission(user, "menu", "read");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const menuId = parseInt(id);

        const db = await initializeDatabase();
        const menuRepo = db.getRepository(Menu);

        const menu = await menuRepo.findOne({
            where: { id: menuId, deleted: false },
        });

        if (!menu) {
            return badRequestResponse("Menu not found");
        }

        return successResponse({
            id: menu.id,
            name: menu.name,
            path: menu.path,
            icon: menu.icon,
            parentId: menu.parentId,
            sortOrder: menu.sortOrder,
            isActive: menu.isActive,
            createdAt: menu.createdAt,
            modifiedAt: menu.modifiedAt,
        });
    } catch (error) {
        console.error("Get menu error:", error);
        return errorResponse("An error occurred while fetching menu");
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "menu", "update");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const menuId = parseInt(id);
        const body = await request.json();

        const db = await initializeDatabase();
        const menuRepo = db.getRepository(Menu);

        const menu = await menuRepo.findOne({
            where: { id: menuId, deleted: false },
        });

        if (!menu) {
            return badRequestResponse("Menu not found");
        }

        if (body.name !== undefined) menu.name = body.name;
        if (body.path !== undefined) menu.path = body.path;
        if (body.icon !== undefined) menu.icon = body.icon;
        if (body.parentId !== undefined) menu.parentId = body.parentId;
        if (body.sortOrder !== undefined) menu.sortOrder = body.sortOrder;
        if (body.isActive !== undefined) menu.isActive = body.isActive;
        menu.modifiedBy = authUser?.username || "system";

        await menuRepo.save(menu);

        return successResponse(
            {
                id: menu.id,
                name: menu.name,
                path: menu.path,
                icon: menu.icon,
                parentId: menu.parentId,
                sortOrder: menu.sortOrder,
                isActive: menu.isActive,
            },
            "Menu updated successfully"
        );
    } catch (error) {
        console.error("Update menu error:", error);
        return errorResponse("An error occurred while updating menu");
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "menu", "delete");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const menuId = parseInt(id);

        const db = await initializeDatabase();
        const menuRepo = db.getRepository(Menu);

        const menu = await menuRepo.findOne({
            where: { id: menuId, deleted: false },
        });

        if (!menu) {
            return badRequestResponse("Menu not found");
        }

        menu.deleted = true;
        menu.deletedAt = new Date();
        menu.deletedBy = authUser?.username || "system";

        await menuRepo.save(menu);

        return successResponse(null, "Menu deleted successfully");
    } catch (error) {
        console.error("Delete menu error:", error);
        return errorResponse("An error occurred while deleting menu");
    }
}
