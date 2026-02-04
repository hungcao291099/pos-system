import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/db/data-source";
import { RolePermission } from "@/lib/db/entities";
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
        const rolePermissionRepo = db.getRepository(RolePermission);

        const rolePermissions = await rolePermissionRepo.find({
            where: { roleId },
            relations: ["permission"],
        });

        return successResponse(
            rolePermissions.map((rp) => ({
                id: rp.id,
                permissionId: rp.permission.id,
                permissionName: rp.permission.name,
                resource: rp.permission.resource,
                action: rp.permission.action,
            }))
        );
    } catch (error) {
        console.error("Get role permissions error:", error);
        return errorResponse("An error occurred while fetching role permissions");
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
        const { permissionIds } = body;

        if (!permissionIds || !Array.isArray(permissionIds)) {
            return badRequestResponse("Permission IDs are required");
        }

        const db = await initializeDatabase();
        const rolePermissionRepo = db.getRepository(RolePermission);

        // Remove existing permissions
        await rolePermissionRepo.delete({ roleId });

        // Add new permissions
        if (permissionIds.length > 0) {
            const rolePermissions = permissionIds.map((permissionId: number) => ({
                roleId,
                permissionId,
                createdBy: authUser?.username || "system",
            }));
            await rolePermissionRepo.save(rolePermissions);
        }

        return successResponse(null, "Role permissions updated successfully");
    } catch (error) {
        console.error("Update role permissions error:", error);
        return errorResponse("An error occurred while updating role permissions");
    }
}
