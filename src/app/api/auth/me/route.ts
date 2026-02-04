import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { initializeDatabase } from "@/lib/db/data-source";
import { User, UserRole, RolePermission, RoleMenu, Menu } from "@/lib/db/entities";
import { verifyToken } from "@/lib/auth/jwt";
import { successResponse, unauthorizedResponse, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get("access_token")?.value;

        if (!accessToken) {
            return unauthorizedResponse("No access token provided");
        }

        const payload = await verifyToken(accessToken);
        if (!payload) {
            return unauthorizedResponse("Invalid access token");
        }

        const db = await initializeDatabase();
        const userRepo = db.getRepository(User);

        const user = await userRepo.findOne({
            where: { id: payload.userId, deleted: false, isActive: true },
        });

        if (!user) {
            return unauthorizedResponse("User not found");
        }

        // Get user roles
        const userRoleRepo = db.getRepository(UserRole);
        const userRoles = await userRoleRepo.find({
            where: { userId: user.id },
            relations: ["role"],
        });

        const roles = userRoles.map((ur) => ({
            id: ur.role.id,
            name: ur.role.name,
            description: ur.role.description,
        }));

        const roleIds = userRoles.map((ur) => ur.roleId);
        const isAdmin = roles.some((r) => r.name === "admin");

        // Get permissions
        let permissions: string[] = [];
        if (roleIds.length > 0) {
            const rolePermissionRepo = db.getRepository(RolePermission);
            const rolePermissions = await rolePermissionRepo
                .createQueryBuilder("rp")
                .innerJoinAndSelect("rp.permission", "permission")
                .where("rp.role_id IN (:...roleIds)", { roleIds })
                .getMany();

            permissions = [...new Set(rolePermissions.map((rp) => rp.permission.name))];
        }

        // Get accessible menus
        let menus: Menu[] = [];
        if (isAdmin) {
            const menuRepo = db.getRepository(Menu);
            menus = await menuRepo.find({
                where: { deleted: false, isActive: true },
                order: { sortOrder: "ASC" },
            });
        } else if (roleIds.length > 0) {
            const roleMenuRepo = db.getRepository(RoleMenu);
            const roleMenus = await roleMenuRepo
                .createQueryBuilder("rm")
                .innerJoinAndSelect("rm.menu", "menu")
                .where("rm.role_id IN (:...roleIds)", { roleIds })
                .andWhere("menu.deleted = :deleted", { deleted: false })
                .andWhere("menu.is_active = :isActive", { isActive: true })
                .orderBy("menu.sort_order", "ASC")
                .getMany();

            menus = roleMenus.map((rm) => rm.menu);
        }

        // Build menu tree
        const buildMenuTree = (items: Menu[], parentId: number | null = null): any[] => {
            return items
                .filter((item) => item.parentId === parentId)
                .map((item) => ({
                    id: item.id,
                    name: item.name,
                    path: item.path,
                    icon: item.icon,
                    sortOrder: item.sortOrder,
                    children: buildMenuTree(items, item.id),
                }));
        };

        return successResponse({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                avatar: user.avatar,
                isActive: user.isActive,
            },
            roles,
            permissions,
            menus: buildMenuTree(menus),
            isAdmin,
        });
    } catch (error) {
        console.error("Get current user error:", error);
        return errorResponse("An error occurred while fetching user data");
    }
}
