import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/db/data-source";
import { UserRole, Role } from "@/lib/db/entities";
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
        const permissionCheck = requirePermission(user, "user", "read");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const userId = parseInt(id);

        const db = await initializeDatabase();
        const userRoleRepo = db.getRepository(UserRole);

        const userRoles = await userRoleRepo.find({
            where: { userId },
            relations: ["role"],
        });

        return successResponse(
            userRoles.map((ur) => ({
                id: ur.id,
                roleId: ur.role.id,
                roleName: ur.role.name,
                roleDescription: ur.role.description,
            }))
        );
    } catch (error) {
        console.error("Get user roles error:", error);
        return errorResponse("An error occurred while fetching user roles");
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "user", "update");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const userId = parseInt(id);
        const body = await request.json();
        const { roleIds } = body;

        if (!roleIds || !Array.isArray(roleIds)) {
            return badRequestResponse("Role IDs are required");
        }

        const db = await initializeDatabase();
        const userRoleRepo = db.getRepository(UserRole);

        // Remove existing roles
        await userRoleRepo.delete({ userId });

        // Add new roles
        if (roleIds.length > 0) {
            const userRoles = roleIds.map((roleId: number) => ({
                userId,
                roleId,
                createdBy: authUser?.username || "system",
            }));
            await userRoleRepo.save(userRoles);
        }

        return successResponse(null, "User roles updated successfully");
    } catch (error) {
        console.error("Update user roles error:", error);
        return errorResponse("An error occurred while updating user roles");
    }
}
