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

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        const permissionCheck = requirePermission(user, "menu", "read");
        if (permissionCheck) return permissionCheck;

        const db = await initializeDatabase();
        const menuRepo = db.getRepository(Menu);

        const { searchParams } = new URL(request.url);
        const tree = searchParams.get("tree") === "true";

        const menus = await menuRepo.find({
            where: { deleted: false },
            order: { sortOrder: "ASC" },
        });

        if (tree) {
            // Build menu tree
            const buildTree = (items: Menu[], parentId: number | null = null): any[] => {
                return items
                    .filter((item) => item.parentId === parentId)
                    .map((item) => ({
                        id: item.id,
                        name: item.name,
                        path: item.path,
                        icon: item.icon,
                        sortOrder: item.sortOrder,
                        isActive: item.isActive,
                        children: buildTree(items, item.id),
                    }));
            };
            return successResponse(buildTree(menus));
        }

        return successResponse(
            menus.map((m) => ({
                id: m.id,
                name: m.name,
                path: m.path,
                icon: m.icon,
                parentId: m.parentId,
                sortOrder: m.sortOrder,
                isActive: m.isActive,
                createdAt: m.createdAt,
                modifiedAt: m.modifiedAt,
            }))
        );
    } catch (error) {
        console.error("Get menus error:", error);
        return errorResponse("An error occurred while fetching menus");
    }
}

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "menu", "create");
        if (permissionCheck) return permissionCheck;

        const body = await request.json();
        const { name, path, icon, parentId, sortOrder = 0, isActive = true } = body;

        if (!name || !path) {
            return badRequestResponse("Menu name and path are required");
        }

        const db = await initializeDatabase();
        const menuRepo = db.getRepository(Menu);

        const menu = menuRepo.create({
            name,
            path,
            icon,
            parentId,
            sortOrder,
            isActive,
            createdBy: authUser?.username || "system",
            modifiedBy: authUser?.username || "system",
        });

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
            "Menu created successfully"
        );
    } catch (error) {
        console.error("Create menu error:", error);
        return errorResponse("An error occurred while creating menu");
    }
}
