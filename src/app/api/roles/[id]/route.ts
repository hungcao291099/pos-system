import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/db/data-source";
import { Role } from "@/lib/db/entities";
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
        const roleRepo = db.getRepository(Role);

        const role = await roleRepo.findOne({
            where: { id: roleId, deleted: false },
        });

        if (!role) {
            return badRequestResponse("Role not found");
        }

        return successResponse({
            id: role.id,
            name: role.name,
            description: role.description,
            isActive: role.isActive,
            createdAt: role.createdAt,
            modifiedAt: role.modifiedAt,
        });
    } catch (error) {
        console.error("Get role error:", error);
        return errorResponse("An error occurred while fetching role");
    }
}

export async function PUT(
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

        const db = await initializeDatabase();
        const roleRepo = db.getRepository(Role);

        const role = await roleRepo.findOne({
            where: { id: roleId, deleted: false },
        });

        if (!role) {
            return badRequestResponse("Role not found");
        }

        if (body.name !== undefined) role.name = body.name;
        if (body.description !== undefined) role.description = body.description;
        if (body.isActive !== undefined) role.isActive = body.isActive;
        role.modifiedBy = authUser?.username || "system";

        await roleRepo.save(role);

        return successResponse(
            {
                id: role.id,
                name: role.name,
                description: role.description,
                isActive: role.isActive,
            },
            "Role updated successfully"
        );
    } catch (error) {
        console.error("Update role error:", error);
        return errorResponse("An error occurred while updating role");
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "role", "delete");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const roleId = parseInt(id);

        const db = await initializeDatabase();
        const roleRepo = db.getRepository(Role);

        const role = await roleRepo.findOne({
            where: { id: roleId, deleted: false },
        });

        if (!role) {
            return badRequestResponse("Role not found");
        }

        role.deleted = true;
        role.deletedAt = new Date();
        role.deletedBy = authUser?.username || "system";

        await roleRepo.save(role);

        return successResponse(null, "Role deleted successfully");
    } catch (error) {
        console.error("Delete role error:", error);
        return errorResponse("An error occurred while deleting role");
    }
}
