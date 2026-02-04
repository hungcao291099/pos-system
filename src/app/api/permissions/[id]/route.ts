import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/db/data-source";
import { Permission } from "@/lib/db/entities";
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
        const permissionCheck = requirePermission(user, "permission", "read");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const permissionId = parseInt(id);

        const db = await initializeDatabase();
        const permissionRepo = db.getRepository(Permission);

        const permission = await permissionRepo.findOne({
            where: { id: permissionId, deleted: false },
        });

        if (!permission) {
            return badRequestResponse("Permission not found");
        }

        return successResponse({
            id: permission.id,
            name: permission.name,
            description: permission.description,
            resource: permission.resource,
            action: permission.action,
            createdAt: permission.createdAt,
            modifiedAt: permission.modifiedAt,
        });
    } catch (error) {
        console.error("Get permission error:", error);
        return errorResponse("An error occurred while fetching permission");
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "permission", "update");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const permissionId = parseInt(id);
        const body = await request.json();

        const db = await initializeDatabase();
        const permissionRepo = db.getRepository(Permission);

        const permission = await permissionRepo.findOne({
            where: { id: permissionId, deleted: false },
        });

        if (!permission) {
            return badRequestResponse("Permission not found");
        }

        if (body.name !== undefined) permission.name = body.name;
        if (body.description !== undefined) permission.description = body.description;
        if (body.resource !== undefined) permission.resource = body.resource;
        if (body.action !== undefined) permission.action = body.action;
        permission.modifiedBy = authUser?.username || "system";

        await permissionRepo.save(permission);

        return successResponse(
            {
                id: permission.id,
                name: permission.name,
                description: permission.description,
                resource: permission.resource,
                action: permission.action,
            },
            "Permission updated successfully"
        );
    } catch (error) {
        console.error("Update permission error:", error);
        return errorResponse("An error occurred while updating permission");
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "permission", "delete");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const permissionId = parseInt(id);

        const db = await initializeDatabase();
        const permissionRepo = db.getRepository(Permission);

        const permission = await permissionRepo.findOne({
            where: { id: permissionId, deleted: false },
        });

        if (!permission) {
            return badRequestResponse("Permission not found");
        }

        permission.deleted = true;
        permission.deletedAt = new Date();
        permission.deletedBy = authUser?.username || "system";

        await permissionRepo.save(permission);

        return successResponse(null, "Permission deleted successfully");
    } catch (error) {
        console.error("Delete permission error:", error);
        return errorResponse("An error occurred while deleting permission");
    }
}
